import os
import sqlite3
import json

path = __file__.replace(os.path.basename(__file__),"")
os.chdir(path)

yn = input("u: (update clips columns), c: (clips), g: (games), u: (users), i: (file info)   |  ")
if yn == "u":
    with open(f"{path}/clipColumns.json") as cc:
        columnData = json.load(cc)["columns"]
    columns = [c[0] for c in columnData]
    print(columns)
    conn = sqlite3.connect("clips.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM clips")
    dbColumns = [description[0] for description in cursor.description]
    columnsToDelete = []
    for dbColumn in dbColumns:
        if dbColumn not in columns:
            columnsToDelete.append(dbColumn)
    cursor.execute(f"CREATE TABLE new_clips AS SELECT {', '.join([col for col in dbColumns if col not in columnsToDelete])} FROM clips")
    cursor.execute(f"DROP TABLE clips")
    cursor.execute(f"ALTER TABLE new_clips RENAME TO clips")
    for column in columnData:
        if column[0] not in dbColumns:
            if column[1] in ["INTEGER","FLOAT"]:
                default = 0
            elif column[1] == "TEXT":
                default = "\'\'"
            cursor.execute(f"ALTER TABLE clips ADD COLUMN {column[0]} {column[1]} DEFAULT {default}")
    conn.commit()
    conn.close()
if yn == "c":
    for filename in os.listdir(path+"/files"):
        os.remove(path+"/files/"+filename)
    conn = sqlite3.connect("clips.db")
    cursor = conn.cursor()
    cursor.execute("DROP TABLE clips")
    cursor.execute("CREATE TABLE clips (id TEXT, fileTitle TEXT, fileDesc TEXT, game TEXT, year INTEGER, month INTEGER, day INTEGER, tags TEXT, fileType TEXT, thumbnailTS FLOAT, ownerID TEXT, processed INTEGER, likes INTEGER, dislikes INTEGER)")
    conn.close()
    yn = "i"
if yn == "g":
    conn = sqlite3.connect("clips.db")
    cursor = conn.cursor()
    cursor.execute("DROP TABLE games")
    cursor.execute("CREATE TABLE games (gameName TEXT, imageURL TEXT)")
    conn.close()
if yn == "i":
    conn = sqlite3.connect("clips.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM clips WHERE processed = 1")
    idsToDelete = cursor.fetchall()
    for id in idsToDelete:
        try:
            os.remove(f"{path}/files/{id[0]}-compressed.mp4")
        except:
            pass
    try:
        cursor.execute("DROP TABLE clipInfo")
    except:
        pass
    cursor.execute("CREATE TABLE clipInfo (vidID INTEGER, audioTranscript TEXT, videoTranscript TEXT, duration FLOAT)")
    cursor.execute(f"UPDATE clips SET processed = 0")
    conn.commit()
    conn.close()
if yn == "u":
    if os.path.isfile("user.db"):
        os.remove("user.db")
    conn = sqlite3.connect("user.db")
    cursor = conn.cursor()
    cursor.execute("""CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  profile_pic TEXT NOT NULL
);""")
    conn.close()