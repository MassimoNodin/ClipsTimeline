import asyncio
import clipStorage
import logging
import os
import moviepy.editor as mp 
import json
import shutil

path = __file__.replace(os.path.basename(__file__),"")

num_ffmpeg_workers = 5
num_whisper_workers = 3

logs = [f"{path}/logs/uploadManager.log"] + [f"{path}logs/ffmpeg/ffmpegLog-{i+1}.log" for i in range(num_ffmpeg_workers)] + [f"{path}logs/whisper/whisper-{i+1}.log" for i in range(num_whisper_workers)]

for log in logs:
    with open(log, 'w'):
        pass
logging.basicConfig(level=logging.DEBUG, filename=f"{path}/logs/uploadManager.log", filemode="a+",
                        format='%(asctime)s |:| LEVEL: %(levelname)s |:| LINE NO.: %(lineno)d |:| FUNCTION/METHOD: %(funcName)s %(message)s',datefmt="%d/%b/%Y %H:%M:%S")

async def whisperWorker(name, audioQueue):
    logging.debug(name+"\n")
    while True:
        video = await audioQueue.get()
        if video is None:
            await asyncio.sleep(1)
        else:
            logging.debug(f"Transcribing Audio for Video with ID = {video[0]}")
            filename = video[0]
            index = name.split('-')[2]
            file = mp.VideoFileClip(f"{path}files/{filename}-compressed.mp4")
            audio_file = file.audio
            audioPath = f"{path}files/{filename}-audio.wav"
            audio_file.write_audiofile(audioPath)
            audioInstance = await asyncio.create_subprocess_shell(f"{path}/bin/whisper {audioPath} --model small.en --task transcribe --output_dir {path}/whisperOutput/{filename} --language en > {path}/logs/whisper/whisperLog-{index}.log")
            await audioInstance.wait()
            if os.path.exists(f"{path}/whisperOutput/{filename}/{filename}-audio.txt"):
                outputFile = open(f"{path}/whisperOutput/{filename}/{filename}-audio.txt")
                outputText = outputFile.read().replace("\n", " ")
                shutil.rmtree(f"{path}/whisperOutput/{filename}")
                os.remove(audioPath)
                await clipStorage.audioTranscribed(filename, outputText)
                logging.info(f"Transcribed Audio for Video with ID = {video[0]}\n")
            else:
                logging.error(f"Failed to Transcribe Audio for Video with ID = {video[0]}\n")

async def compress_video_ffmpeg(input_path, output_path, index):
    try:
        ffmpegInstance = await asyncio.create_subprocess_shell(f'/usr/bin/ffmpeg -y -vsync 0 -hwaccel cuda -hwaccel_output_format cuda -i {input_path} -crf \'20\' -c:a copy -c:v h264_nvenc {output_path} 2> {path}/logs/ffmpeg/ffmpegLog-{index}.log')
        await ffmpegInstance.wait()
        fileSizes = await clipStorage.filesize(output_path.split("/")[-1].split("-compressed")[0])
        if fileSizes["raw"][0] > fileSizes["raw"][1]:
            os.remove(output_path)
            shutil.copy2(input_path,output_path)
        return True
    except Exception as e:
        logging.error(e)
        return False

async def videoLength(filePath,id):
    ffmpegVideo = await asyncio.create_subprocess_shell(f'ffprobe -v quiet -show_streams -select_streams v:0 -of json {filePath} > {path}durationOutput/{id}.json')
    await ffmpegVideo.wait()
    with open(f"{path}durationOutput/{id}.json") as do:
        duration = json.load(do)
    os.remove(f"{path}durationOutput/{id}.json")
    return duration["streams"][0]["duration"]

uncompressedVideos = []

async def ffmpeg_queue_worker(name, queue):
    while True:
        global uncompressedVideos
        unprocessed = await clipStorage.processList()
        unprocessed = [[z for z in i] for i in unprocessed]
        newVids = [x for x in unprocessed if x not in uncompressedVideos]
        for vid in newVids:
            logging.info(f"New Video Uploaded | id = {vid}")
            await queue.put(vid)
            uncompressedVideos.append(vid)
        await asyncio.sleep(1)

videosToTranscribe = []

async def whisper_queue_worker(name, queue):
    while True:
        global videosToTranscribe
        transcribe = await clipStorage.transcribeList()
        transcribe = [[z for z in i] for i in transcribe]
        newVids = [x for x in transcribe if x not in videosToTranscribe]
        for vid in newVids:
            await queue.put(vid)
            videosToTranscribe.append(vid)
        await asyncio.sleep(1)

async def ffmpegWorker(name, ffmpegQueue):
    logging.debug(name+"\n")
    while True:
        video = await ffmpegQueue.get()
        if video is None:
            await asyncio.sleep(1)
        else:
            logging.debug(f"Compressing Video with ID = {video[0]}")
            processVideo = await compress_video_ffmpeg(f"{path}files/{video[0]}.{video[1]}",f"{path}files/{video[0]}-compressed.mp4", name.split("-")[2])
            if processVideo:
                logging.info(f"Compressed Video with ID = {video[0]}")
                await clipStorage.videoCompressed(video[0],await videoLength(f"{path}files/{video[0]}-compressed.mp4",video[0]))
            else:
                logging.error(f"Failed Compression on Video with ID = {video[0]}\n")

async def main():
    ffmpegQueue = asyncio.Queue()
    audioQueue = asyncio.Queue()
    ffmpegWorkers = [ffmpegWorker(f'Video-Processor-{i+1}', ffmpegQueue) for i in range(num_ffmpeg_workers)]
    whisperWorkers = [whisperWorker(f'Audio-Trancriber-{i+1}', audioQueue) for i in range(num_whisper_workers)]
    workers = [whisper_queue_worker("whisper-Queue-Manager",audioQueue)] + [ffmpeg_queue_worker(f'ffmpeg-Queue-Manager',ffmpegQueue)] + ffmpegWorkers + whisperWorkers
    worker_tasks = [asyncio.create_task(worker) for worker in workers]
    await asyncio.gather(*worker_tasks)

if __name__ == "__main__":
    asyncio.run(main())