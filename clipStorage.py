import sqlite3
import os
import datetime
import math

path = __file__.replace(os.path.basename(__file__),"")

async def createConn():
    return sqlite3.connect("clips.db")

async def convert_size(size_bytes):
   if size_bytes == 0:
       return "0B"
   size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
   i = int(math.floor(math.log(size_bytes, 1024)))
   p = math.pow(1024, i)
   s = round(size_bytes / p, 2)
   return "%s %s" % (s, size_name[i])

async def filesize(vidId):
    try:
        fileType = (await fileInfo(vidId))['fileInfo'][8]
        compressedSize = os.path.getsize(f"{path}/files/{vidId}-compressed.mp4")
        fullSize = os.path.getsize(f"{path}/files/{vidId}.{fileType}")
        return {"Success":True,"raw":[compressedSize,fullSize],"compressed":await convert_size(compressedSize),"fullQuality":await convert_size(fullSize)}
    except Exception as e:
        return {"Success":False}

async def changeTS(id, newTS):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE clips SET thumbnailTS = ? WHERE id = ?",(newTS,id))
    conn.commit()
    conn.close()

async def search(string):
    conn = await createConn()
    cursor = conn.cursor()
    words = [f"%{x}%" for x in string.split(" ")]
    likeStr = " AND ".join(["fileTitle Like ?"]*len(words))
    gameLikeStr = " AND ".join(["game Like ?"]*len(words))
    audioStr = " AND ".join(["audioTranscript Like ?"]*len(words))
    titleResults = cursor.execute(f"SELECT id FROM clips WHERE {likeStr}",tuple(words)).fetchall()
    gameResults = cursor.execute(f"SELECT id FROM clips WHERE {gameLikeStr}",tuple(words)).fetchall()
    descResults = cursor.execute(f"SELECT id FROM clips WHERE {likeStr}",tuple(words)).fetchall()
    transcriptResults = cursor.execute(f"SELECT vidID FROM clipInfo WHERE {audioStr}",tuple(words)).fetchall()
    conn.close()
    return {"titleResult":[x[0] for x in titleResults], "gameResult":[v[0] for v in gameResults],"descResult": [y[0] for y in descResults], "audioResult":[z[0] for z in transcriptResults]}

async def gameList():
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT gameName FROM games")
    games = cursor.fetchall()
    conn.close()
    games = [game[0] for game in games]
    return games
    
async def transcribeList():
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT vidID FROM clipInfo WHERE audioTranscript = ''")
    transcribe = cursor.fetchall()
    conn.close()
    return transcribe

async def processList():
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT id, fileType FROM clips WHERE processed = ?",(0,))
    unprocessed = cursor.fetchall()
    conn.close()
    return unprocessed

async def videoInformation(vidID):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM clipInfo WHERE vidID = ?",(vidID,))
    clipInfo = cursor.fetchall()
    conn.close()
    return clipInfo

async def videoCompressed(vidID, duration):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"INSERT INTO clipInfo (vidID, audioTranscript, videoTranscript, duration) VALUES (?,?,?,?)",(vidID,"","",duration))
    cursor.execute(f"UPDATE clips SET processed = ? WHERE id = ?",(1,vidID))
    conn.commit()
    conn.close()

async def audioTranscribed(vidID, audioTranscript):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE clipInfo SET audioTranscript = ? WHERE vidID = ?",(audioTranscript,vidID))
    conn.commit()
    conn.close()

async def newGame(gameName, imgURL):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM games WHERE gameName = ?",(gameName,))
    exists = cursor.fetchall()
    if len(exists) == 0:
        cursor.execute(f"INSERT INTO games (gameName, imageURL) VALUES (?,?)",(gameName,imgURL,))
        conn.commit()
        conn.close()
        return {"Success":True, "alreadyExists":False}
    else:
        conn.close()
        return {"Success":False, "alreadyExists":True}

async def clipDataCheck(data):
    if len(data) == 9:
        print("not long enough",flush=True)
        return False
    gamesList = await gameList()
    if data[3] not in gamesList and data[3]!="":
        print("not in game list",flush=True)
        return False
    try:
        datetime.datetime(int(data[4]),int(data[5]),int(data[6]))
    except ValueError:
        print("invalid Date",flush=True)
        return False
    return True
    
async def gameLogo(game):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT imageURL FROM games WHERE gameName = ?",(game,))
    return {"result":cursor.fetchone()}

async def yearSearch(year, game):
    conn = await createConn()
    cursor = conn.cursor()
    files = {"Success":False}
    if year != None:
        if game != None:
            cursor.execute(f"SELECT * FROM clips WHERE year = ? AND game = ? ORDER BY month, day",(year,game))
        else:
            cursor.execute(f"SELECT * FROM clips WHERE year = ? ORDER BY month, day",(year,))
        files = {"Success":True, "searchResult":cursor.fetchall()}
    conn.close()
    return files

async def columnEntries(column):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {column} FROM clips")
    columnVals = cursor.fetchall()
    columnValues = list(dict.fromkeys(columnVals))
    conn.close()
    return columnValues

async def userClips(id):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM clips WHERE ownerID = ?",(id,))
    userFiles = cursor.fetchall()
    print(userFiles,flush=True)
    conn.close()
    return userFiles

async def deleteFile(id,userID):
    fInfo = (await fileInfo(id))["fileInfo"]
    if len(fInfo)!=0:
        conn = await createConn()
        cursor = conn.cursor()
        if fInfo[10]==userID:
            cursor.execute(f"DELETE FROM clips WHERE id = ?",(id,))
            cursor.execute(f"DELETE FROM clipInfo WHERE vidID = ?",(id,))
            conn.commit()
            conn.close()
            os.remove(os.path.join(path, "files/"+id+"."+fInfo[8]))
            os.remove(os.path.join(path, "files/"+id+"-compressed.mp4"))
            os.remove(os.path.join(path, "files/"+id+"-preview.jpg"))
            return {"Success":True}
        conn.close()
    return {"Success":False}

async def updateFile(data):
    fInfo = (await fileInfo(data[0]))["fileInfo"]
    if await clipDataCheck(data) and fInfo != []:
        conn = await createConn()
        cursor = conn.cursor()
        cursor.execute(f"UPDATE clips SET fileTitle = ?, fileDesc = ?, game = ?, year = ?, month = ?, day = ?, tags = ? WHERE id = ?",(data[1].replace("\n",""),data[2].replace("\n",""),data[3],int(data[4]),int(data[5]),int(data[6]),data[7],data[0],))
        conn.commit()
        conn.close()
        return {"Success":True}
    return {"Success":False}

async def newFile(id,fileType, ownerID,day,month,year):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"INSERT INTO clips (id, fileTitle, fileDesc, game, year, month, day, tags, fileType, thumbnailTS, ownerID, processed, likes, dislikes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(id,'','','No Game',year,month,day,'',fileType,0,ownerID,0,0,0))
    conn.commit()
    conn.close()

async def fileInfo(id, loggedIn = False):
    conn = await createConn()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM clips WHERE id = ?",(id,))
    fileInfo = cursor.fetchall()
    if len(fileInfo)==0:
        conn.close()
        return {"fileInfo":[]}
    conn.close()
    fileAddon = []
    if fileInfo[0][11] and loggedIn:
        fileAddon = [y for y in (await videoInformation(id))[0]]
    return {"fileInfo":[x for x in fileInfo[0]]+fileAddon}