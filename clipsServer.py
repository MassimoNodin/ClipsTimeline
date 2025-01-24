from flask import Flask, render_template, jsonify, request, redirect, flash, url_for, session, send_from_directory
import os
from werkzeug.utils import secure_filename
from secrets import token_urlsafe
import cv2
import json
import clipStorage
import asyncio
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user
)
from oauthlib.oauth2 import WebApplicationClient
import requests

from db import init_db_command
from user import User

path = __file__.replace(os.path.basename(__file__),"")
os.chdir(path)

UPLOAD_FOLDER = f'{path}/files'
ALLOWED_EXTENSIONS = {'mp4','mov'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'massimonodin123456789'

login_manager = LoginManager()
login_manager.init_app(app)

google_secrets = open("google_secret.txt").read().split("\n")
GOOGLE_CLIENT_ID = google_secrets[0]
GOOGLE_CLIENT_SECRET = google_secrets[1]
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)

admins = ["108992402502922392813"]
allowedUsers = ["108992402502922392813", #Massi
                "104632428452758058272", #Pana
                "107190117031060547103", #Xav
                "105290878241221690191" #Steve
                ]

# Flask-Login helper to retrieve a user from our db
@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

# OAuth 2 client setup
client = WebApplicationClient(GOOGLE_CLIENT_ID)

async def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/testAuth")
async def nginx_auth():
    if current_user.is_authenticated:
        return ""
    else:
        return "", 401

@app.route("/admin")
@login_required
async def adminPage():
    userID = current_user.get_id()
    if str(userID) not in admins:
        return redirect(url_for("clipsTimline"))
    return render_template("admin.html")

@app.route("/user-info", methods=['POST'])
@login_required
async def userInfo():
    userID = request.args.get('id')
    if userID == None:
        userID = current_user.get_id()
    return {"UserInfo":User.getJson(userID)}

@app.route("/profile")
@login_required
async def profile():
    return render_template("profile.html")

@app.route("/user-clips", methods=['POST'])
@login_required
async def userClips():
    userID = request.args.get('id')
    return {"userClips":await clipStorage.userClips(userID)}

@app.route('/thumbnailUpdate', methods=['POST'])
@login_required
async def updateThumbnail():
    vidId = request.args.get('id')
    fileInfo = (await clipStorage.fileInfo(vidId))["fileInfo"]
    if str(current_user.get_id()) != fileInfo[10]:
        return {"Success":False}
    timeStamp = float(request.args.get('ts'))
    vid = cv2.VideoCapture(os.path.join(app.config['UPLOAD_FOLDER'], vidId+"."+fileInfo[8]))
    fps = vid.get(cv2.CAP_PROP_FPS)
    vid.set(cv2.CAP_PROP_POS_FRAMES, fps * timeStamp)
    rval, frame = vid.read()
    os.remove(f"{app.config['UPLOAD_FOLDER']}/{vidId}-preview.jpg")
    cv2.imwrite(f"{app.config['UPLOAD_FOLDER']}/{vidId}-preview.jpg", frame)
    vid.release()
    await clipStorage.changeTS(vidId,timeStamp)
    return {"Success":True}

@app.route('/fileInfo', methods=['POST'])
async def fileInfo():
    userID = current_user.get_id()
    vidId = request.args.get('id')
    fInfo = await clipStorage.fileInfo(vidId,current_user.is_authenticated)
    if str(userID) in admins and len(fInfo["fileInfo"]) > 0:
        fInfo["realOwner"] = fInfo["fileInfo"][10]
        fInfo["fileInfo"][10] = admins[0]
    return jsonify(fInfo)

@app.route('/game-list', methods=['POST'])
@login_required
async def gameList():
    gamesList = await clipStorage.gameList()
    return {"gamesList":gamesList}

@app.route('/new-game', methods=['POST','GET'])
@login_required
async def newGame():
    if str(current_user.get_id()) not in admins:
        return {"Success":False}
    gameName = request.args.get('gameName')
    logoURL = request.args.get('logo')
    if gameName == None or logoURL == None:
        return {"Success":False, "alreadyExists":False}
    img_data = requests.get(logoURL).content
    with open(f'{path}/logos/{gameName}.jpg', 'wb') as gLogo:
        gLogo.write(img_data)
    return await clipStorage.newGame(gameName,f'https://{request.host}/logos/{gameName}.jpg')

@app.route('/tags', methods=['POST'])
@login_required
async def tagList():
    return {"tags":await clipStorage.tagList()}

@app.route('/favicon.ico')
async def favicon():
    return url_for('static', filename='favicon.ico')

@app.route("/game-logo", methods=['POST'])
@login_required
async def gameLogo():
    gameName = request.args.get('gameName')
    return await clipStorage.gameLogo(gameName)

@app.route('/upload-manage', methods=['GET'])
@login_required
async def uploadManage():
    vidId = request.args.get('id')
    fileInfo = (await clipStorage.fileInfo(vidId))["fileInfo"]
    if len(fileInfo) == 0:
        return redirect(url_for("clipsTimeline"))
    if str(current_user.get_id()) != fileInfo[10] and str(current_user.get_id()) not in admins:
        return redirect(url_for("viewClip")+"?id="+vidId)
    filePath = f"{app.config['UPLOAD_FOLDER']}/{vidId}.{fileInfo[8]}"
    if (os.path.isfile(filePath)):
        return render_template("uploadManage.html")
    return redirect(url_for("clipsTimeline"))

@app.route('/update-clip', methods=['POST'])
@login_required
async def updateClip():
    bodyJson = json.loads(request.data, strict=False)
    if str(current_user.get_id()) !=  (await clipStorage.fileInfo(bodyJson[0]))["fileInfo"][10] and str(current_user.get_id()) not in admins:
        return {"Success":False}
    return await clipStorage.updateFile(bodyJson)

@app.route("/column-list", methods=['POST'])
@login_required
async def columnList():
    columnName = request.args.get('columnName')
    rows = await clipStorage.columnEntries(columnName)
    rows.sort()
    return {"colmuns":rows}

@app.route("/file-size", methods=["POST"])
@login_required
async def fileSize():
    vidId = request.args.get('id')
    return await clipStorage.filesize(vidId)

@app.route("/view-clip")
async def viewClip():
    return render_template("viewFile.html")

@app.route("/search", methods=["POST","GET"])
async def search():
    if request.method == "POST":
        if not current_user.is_authenticated:
            return {"Success": False}
        string = request.args.get('searchStr')
        return await clipStorage.search(string)
    session['prevPage'] = request.url
    return render_template("search.html")

@app.route('/timeline-search', methods=['POST'])
@login_required
async def timelineSearch():
    yearArg = request.args.get('year')
    gameArg = request.args.get('game')
    return await clipStorage.yearSearch(yearArg,gameArg)


@app.route('/delete-clip', methods=['POST'])
@login_required
async def deleteClip():
    vidId = request.args.get('id')
    if vidId:
        return await clipStorage.deleteFile(vidId, current_user.get_id())
    return {"Success":False}

@app.route('/upload', methods=['GET', 'POST'])
async def upload_file():
    if request.method == 'POST':
        if not current_user.is_authenticated:
            return {"Success":False}
        day = request.args.get('day')
        month = request.args.get('month')
        year = request.args.get('year')
        # check if the post request has the file part
        if 'videoFile' not in request.files:
            return jsonify({"Success":False})
        file = request.files['videoFile']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            return {"Success":False}
        if file and await allowed_file(file.filename):
            filename = secure_filename(file.filename) 
            id = token_urlsafe(10)
            while os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], id+"."+filename.split(".")[-1])):
                id = token_urlsafe(10)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], id+"."+filename.split(".")[-1]))
            vid = cv2.VideoCapture(os.path.join(app.config['UPLOAD_FOLDER'], id+"."+filename.split(".")[-1]))
            rval, frame = vid.read()
            cv2.imwrite(f"{app.config['UPLOAD_FOLDER']}/{id}-preview.jpg", frame)
            vid.release()
            ffmpegDate = await asyncio.create_subprocess_shell(f'/usr/bin/ffprobe -v quiet -select_streams v:0  -show_entries stream_tags=creation_time -of default=noprint_wrappers=1:nokey=1 {os.path.join(app.config["UPLOAD_FOLDER"], id+"."+filename.split(".")[-1])} > {path}ffmpegOutput/{id}.txt')
            await ffmpegDate.wait()
            dateFile = open(f"{path}ffmpegOutput/{id}.txt")
            dateStr = dateFile.read().split("\n")[0]
            os.remove(f"{path}ffmpegOutput/{id}.txt")
            if dateStr != "":
                dateStr = dateStr[:10]
                year = dateStr.split("-")[0]
                month = dateStr.split("-")[1]
                day = dateStr.split("-")[2]
            await clipStorage.newFile(id,filename.split(".")[-1],current_user.get_id(),day,month,year)
            return jsonify({"Success":True,"id":id})
    return render_template("uploadFile.html")

async def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()

@app.route("/login")
async def loginPage():
    # Find out what URL to hit for Google login
    google_provider_cfg = await get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Use library to construct the request for Google login and provide
    # scopes that let you retrieve user's profile from Google
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=request.base_url + "/callback",
        scope=["openid", "email", "profile"],
    )
    return redirect(request_uri)

@app.route("/login/callback")
async def callback():
    # Get authorization code Google sent back to you
    code = request.args.get("code")

    google_provider_cfg = await get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]

    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )

    # Parse the tokens!
    try:
        client.parse_request_body_response(json.dumps(token_response.json()))
    except:
        return redirect(url_for("loginPage"))

    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    if userinfo_response.json().get("email_verified"):
        unique_id = userinfo_response.json()["sub"]
        users_email = userinfo_response.json()["email"]
        picture = userinfo_response.json()["picture"]
        users_name = userinfo_response.json()["given_name"]
    else:
        return "User email not available or not verified by Google.", 400
    
    user = User(
        id_=unique_id, name=users_name, email=users_email, profile_pic=picture
    )

    if str(unique_id) not in allowedUsers:
        return redirect(url_for("mainPage")+"?loginError=1")
    if not User.get(unique_id):
        User.create(unique_id, users_name, users_email, picture)

    # Begin user session by logging the user in
    login_user(user)

    # Send user back to homepage
    prevPage = session.pop('prevPage', '/')

    return redirect(prevPage)

@app.route("/logout")
@login_required
async def logout():
    logout_user()
    prevPage = session.pop('prevPage', '/')
    if prevPage != None:
        return redirect(prevPage)
    return redirect(url_for("mainPage"))
    

@app.route("/timeline")
async def clipsTimeline():
    session['prevPage'] = request.url
    return render_template("timeline.html")

@app.route("/")
async def mainPage():
    session['prevPage'] = request.url
    return render_template("mainPage.html")

@login_manager.unauthorized_handler
def unauthorized_callback():
    if request.method == "POST":
        return {"Sucess":False}
    session['prevPage'] = request.url
    return redirect(url_for('mainPage'))

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=443,debug=True)