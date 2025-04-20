# ClipsTimeline 🎬

## Overview ✨

**ClipsTimeline** is a modern, async-powered video management platform for uploading, compressing, transcribing, and organizing video clips. It features a web interface with Google OAuth login, timeline browsing, search, and robust metadata management.

- **Video compression** with FFmpeg (CUDA-accelerated)
- **Audio transcription** with OpenAI Whisper
- **Async task queues** for scalable processing
- **Google OAuth** authentication (Flask)
- **SQLite** for metadata and user management
- **Game and tag management** with logo support

---

## Core Features ⚙️

- **Web Interface**: Upload, browse, search, and manage clips via Flask (`clipsServer.py`)
- **User Authentication**: Google OAuth login, user sessions, and access control
- **Video Compression**: FFmpeg with CUDA (`uploadProcessing.py`)
- **Audio Transcription**: Whisper CLI integration
- **Metadata Management**: Titles, descriptions, tags, games, creation dates, thumbnails
- **Search**: By title, description, game, or transcript
- **Game Management**: Add games and logos
- **File Management**: Upload, update, delete, and thumbnail selection

---

## File Structure 📁

```text
ClipsTimeline/
├── bin/                     # Whisper binary (if not in PATH)
├── files/                   # Video, audio, and preview files
│   ├── <video_id>.mov/mp4   # Original videos
│   ├── <video_id>-compressed.mp4
│   ├── <video_id>-audio.wav
│   └── <video_id>-preview.jpg
├── logs/
│   ├── uploadManager.log
│   ├── ffmpeg/ffmpegLog-*.log
│   └── whisper/whisper-*.log
├── whisperOutput/           # Whisper transcription outputs
├── durationOutput/          # FFprobe duration outputs
├── ffmpegOutput/            # FFprobe date outputs
├── logos/                   # Game logos
├── templates/               # Flask HTML templates
├── static/                  # Static files (JS, CSS)
├── clipStorage.py           # Async DB operations for clips
├── clipsServer.py           # Flask web app (UI, API, Auth)
├── uploadProcessing.py      # Async task queue manager
├── user.py                  # Flask-Login user model
├── db.py                    # Flask DB setup for user.db
├── clipsReset.py            # DB/table reset utility
├── requirements.txt         # Python dependencies
├── google_secret.txt        # Google OAuth credentials (not in repo)
├── clips.db                 # SQLite DB for clips
├── user.db                  # SQLite DB for users
└── README.md
```

---

## Workflow 🔄

1. **User Login**  
   Users log in via Google OAuth. Only allowed Google IDs can access the app.

2. **Uploading Videos**  
   Users upload videos via the web UI. Metadata and thumbnails are generated.

3. **Async Processing**  
   - `uploadProcessing.py` detects new uploads and compresses them with FFmpeg.
   - After compression, audio is extracted and transcribed with Whisper.

4. **Browsing & Search**  
   Users browse clips by timeline, search by keywords, and view details.

5. **Management**  
   Users can update metadata, change thumbnails, or delete their own clips.

---

## Example Usage 🚀

### Uploading a Video (Web UI)

1. Log in with Google.
2. Go to the **Upload** page.
3. Select a video file (`.mp4` or `.mov`).
4. Optionally set the date/game.
5. Submit and wait for processing.

### Example: Querying Clip Info via API

```python
import requests

session = requests.Session()
# Assume you have authenticated via Google OAuth and have a session cookie

resp = session.post("https://clipsviewer.uk.to/fileInfo?id=YOUR_VIDEO_ID")
print(resp.json())
```

### Example: Uploading a Video via API

```python
import requests

with open("myclip.mp4", "rb") as f:
    files = {"videoFile": f}
    resp = requests.post(
        "https://clipsviewer.uk.to/upload?day=1&month=1&year=2024",
        files=files,
        # cookies/session as needed
    )
print(resp.json())
```

### Example: Deleting a Clip

```python
import requests

resp = requests.post("https://clipsviewer.uk.to/delete-clip?id=YOUR_VIDEO_ID")
print(resp.json())
```

### Example: Searching for Clips

```python
import requests

resp = requests.post("https://clipsviewer.uk.to/search?searchStr=funny+gameplay")
print(resp.json())
```

---

## How to Run 🏁

### Prerequisites

- Python 3.8+
- FFmpeg with CUDA support
- Whisper CLI (in `bin/` or in PATH)
- All Python dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Google OAuth credentials in `google_secret.txt`:
  ```
  YOUR_GOOGLE_CLIENT_ID
  YOUR_GOOGLE_CLIENT_SECRET
  ```

### Database Initialization

```bash
export FLASK_APP=clipsServer.py
flask init-db
```

### Running the Services

#### Using systemd (Recommended)

- See `clipsviewer.service` and `uploadmanager.service` for Gunicorn and processing worker setup.

#### Manual (Development)

```bash
python3 uploadProcessing.py
gunicorn -b 0.0.0.0:8000 --workers 4 clipsServer:app
```

---

## Systemd Service Example

```ini
# /etc/systemd/system/clipsviewer.service
[Unit]
Description=A Clips Viewing Service
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/home/massimo-nodin/Documents/ClipsTimeline
ExecStart=/usr/bin/gunicorn -b unix:/home/massimo-nodin/Documents/ClipsTimeline/clips.sock -w 9 -m 007 --preload --capture-output --log-level debug clipsServer:app

[Install]
WantedBy=multi-user.target
```

---

## For Developers: Adding a New Game

```python
import requests

resp = requests.post(
    "https://clipsviewer.uk.to/new-game?gameName=Chess&logo=https://example.com/chess.jpg"
)
print(resp.json())
```

---

## Contact

For further details or assistance, please contact Massimo Nodin. 🧑‍💻
