# Video Downloader Web App

A modern web application for downloading videos from various platforms including YouTube, Facebook, Instagram, Twitter, and more. Built with Next.js 14+, TypeScript, and Tailwind CSS.

![Video Downloader Demo](public/placeholder.svg)

## Features

- 📥 Download videos from multiple platforms
- 🎵 Extract audio from videos
- 🎨 Modern UI with dark/light mode
- 📱 Responsive design
- 🚀 Fast downloads with progress tracking
- ⚡ Server-side processing with yt-dlp

## Supported Platforms

- YouTube
- Facebook
- Instagram
- Twitter
- TikTok
- And many more...

## Tech Stack

- **Frontend:** Next.js 14+, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Video Processing:** yt-dlp, ffmpeg
- **Development:** Node.js 20+

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x or later
- yt-dlp (`pip install yt-dlp`)
- ffmpeg

### Prerequisites
- A VPS (Virtual Private Server) running Ubuntu/Debian
- A domain name pointing to your server
- Node.js 20.x or later
- yt-dlp and ffmpeg

### Option 1: Manual Deployment

1. Clone the repository on your server:
```bash
git clone <your-repo-url> /opt/video-downloader-web
cd /opt/video-downloader-web
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Install required system dependencies:
```bash
# Install yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Install ffmpeg
sudo apt-get update
sudo apt-get install -y ffmpeg
```

5. Set up Nginx:
- Copy the nginx configuration from `deploy/nginx.conf` to `/etc/nginx/sites-available/video-downloader`
- Update the domain name in the configuration
- Create a symbolic link: `sudo ln -s /etc/nginx/sites-available/video-downloader /etc/nginx/sites-enabled/`
- Remove default config: `sudo rm /etc/nginx/sites-enabled/default`
- Test and restart nginx: `sudo nginx -t && sudo systemctl restart nginx`

6. Set up the systemd service:
- Copy the service file: `sudo cp deploy/video-downloader.service /etc/systemd/system/`
- Enable and start the service:
```bash
sudo systemctl enable video-downloader
sudo systemctl start video-downloader
```

### Option 2: Automatic Deployment

1. SSH into your server

2. Clone the repository:
```bash
git clone <your-repo-url> /opt/video-downloader-web
cd /opt/video-downloader-web
```

3. Run the setup script:
```bash
chmod +x deploy/setup.sh
./deploy/setup.sh
```

4. Update the domain in nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/video-downloader
```

### SSL/HTTPS Setup (Recommended)

1. Install Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

### Maintenance

- Update yt-dlp regularly:
```bash
sudo yt-dlp -U
```

- Monitor the application logs:
```bash
sudo journalctl -u video-downloader -f
```

- Restart the application:
```bash
sudo systemctl restart video-downloader
```

## Environment Variables

No special environment variables are required for basic operation. However, you can set the following optional variables:
- `PORT`: The port the application runs on (default: 3000)
- `NODE_ENV`: Set to 'production' for production deployment
