import ffmpeg
import sys
from pprint import pprint # for printing Python dictionaries in a human-readable way

# read the audio/video file from the command line arguments
media_file = "/home/massimonodin/Documents/ClipsTimeline/files/zUlcI6PK3ZsHaQ.mov"
# uses ffprobe command to extract all possible metadata from the media file
pprint(ffmpeg.probe(media_file)["streams"])