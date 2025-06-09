#!/bin/bash

# Download yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod a+rx yt-dlp
mv yt-dlp node_modules/yt-dlp-exec/bin/

# Download and extract FFmpeg
curl -L https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0/linux-x64 -o ffmpeg
chmod a+rx ffmpeg
mkdir -p node_modules/ffmpeg-static/bin
mv ffmpeg node_modules/ffmpeg-static/bin/
