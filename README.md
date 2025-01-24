# ClipsTimeline

## Overview
**ClipsTimeline** is a robust and efficient video management tool designed for processing, compressing, storing, and managing video clips. It streamlines workflows by integrating advanced video compression, transcription, and metadata management into a single cohesive system.

The application leverages **FFmpeg** for video compression, **Whisper** for audio transcription, and **SQLite** for database management, providing an end-to-end solution for video storage and processing.

---

## Core Features

- **Video Compression**  
  Utilizes **FFmpeg** with CUDA hardware acceleration to compress videos efficiently.
  - Automatically checks and ensures compressed file sizes are smaller than the original. If not, the original file is retained.

- **Audio Transcription**  
  Extracts audio from video files using **MoviePy** and transcribes it using **OpenAI's Whisper**.
  - Transcriptions are stored in the database and are ready for search and analysis.

- **Metadata Management**  
  Stores video metadata, including file size, duration, title, description, tags, game, and owner information.
  - Tracks processing statuses and timestamps for thumbnails.

- **Search Functionality**  
  Allows searching of videos by title, description, game, and audio transcript using a flexible keyword-based search.

- **Task Queues**  
  Implements asynchronous workers for handling video compression and audio transcription tasks concurrently.
  - Dynamically manages queues for unprocessed and transcription-ready videos.

- **Game Management**  
  Supports adding new games with associated logos and retrieving a list of all games in the database.

- **File Management**  
  Handles file deletion, ensuring all related files (compressed, audio, and preview) are safely removed.
  - Updates video metadata and supports adding new videos to the database.

---

## File Structure

```ClipsTimeline/
├── bin/                     # Contains Whisper binary
├── files/                   # Directory for video and audio files
│   ├── <video_id>.mov       # Original videos
│   ├── <video_id>-compressed.mp4  # Compressed videos
│   ├── <video_id>-audio.wav # Extracted audio files
├── logs/                    # Log files for debugging
│   ├── uploadManager.log    # Main log file
│   ├── ffmpeg/              # FFmpeg worker logs
│   ├── whisper/             # Whisper transcription logs
├── whisperOutput/           # Temporary Whisper transcription outputs
├── durationOutput/          # Temporary FFprobe duration outputs
├── clipStorage.py           # Handles database operations
├── uploadManager.py         # Main script for task queue management
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```
---

## Workflow

1. **Uploading Videos**  
   Videos are uploaded into the `files/` directory with a unique ID.
   - Metadata is stored in the `clips` table within the SQLite database.

2. **Video Compression**  
   - Uncompressed videos are detected by the `ffmpeg-Queue-Manager`.
   - Videos are processed using `compress_video_ffmpeg()` and stored in the `files/` directory with the `-compressed.mp4` suffix.

3. **Audio Transcription**  
   - Compressed videos are queued for transcription by the `whisper-Queue-Manager`.
   - Transcriptions are generated and stored in the database.

4. **Metadata Search and Retrieval**  
   - Users can search for videos using keywords in the title, description, game, or transcript.

5. **File Deletion and Updates**  
   - Videos can be deleted or updated, ensuring all associated files and database entries are handled appropriately.

---

## Core Scripts

1. **clipStorage.py**  
   Contains all database operations, including file info retrieval, updates, and metadata validation.

2. **uploadManager.py**  
   Manages task queues for video compression and transcription.
   - Spawns workers to handle asynchronous processing efficiently.

3. **FFmpeg Integration**  
   Handles video compression with hardware acceleration for better performance.

4. **Whisper Integration**  
   Manages audio extraction and transcription using the Whisper model.

---

## How to Use

### Prerequisites
1. Install **Python 3.8+**.
2. Install FFmpeg with CUDA support.
3. Install **MoviePy**, **Whisper**, and other dependencies:
   ```bash
   pip install -r requirements.txt

Steps to Run
	1.	Clone the repository and navigate to the project directory:

git clone <repository_url>
cd ClipsTimeline


	2.	Run the main script:

python3 uploadManager.py


	3.	Upload video files to the files/ directory.
	4.	Monitor logs for task progress:
	•	General log: logs/uploadManager.log
	•	FFmpeg logs: logs/ffmpeg/
	•	Whisper logs: logs/whisper/
 
For further details or assistance, please contact Massimo Nodin.
