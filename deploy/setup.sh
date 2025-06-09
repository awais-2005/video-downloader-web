#!/bin/bash

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Install ffmpeg (required for video processing)
sudo apt-get update
sudo apt-get install -y ffmpeg

# Install nginx
sudo apt-get install -y nginx

# Set up the application
sudo mkdir -p /opt/video-downloader-web
sudo chown $USER:$USER /opt/video-downloader-web

# Copy nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/video-downloader
sudo ln -s /etc/nginx/sites-available/video-downloader /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Set up systemd service
sudo cp deploy/video-downloader.service /etc/systemd/system/
sudo systemctl enable video-downloader
sudo systemctl start video-downloader
