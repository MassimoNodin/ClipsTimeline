import subprocess
def compress_video_ffmpeg(input_path, output_path, crf=23):
    # Use FFmpeg to compress the video
    subprocess.run([
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-crf', str(crf),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-strict', 'experimental',
        output_path
    ])

compress_video_ffmpeg("/home/massimonodin/Documents/ClipsTimeline/files/4ZE4x2YfjC2gNg.mov","/home/massimonodin/Documents/ClipsTimeline/files/vHyil_Pr9cDI1Q-compressed.mp4", 40)