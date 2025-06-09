FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy the entire project
COPY . .

# Make sure the install script is executable and run it to install binaries
RUN chmod +x scripts/vercel-install.sh && ./scripts/vercel-install.sh

# Build the Next.js app
RUN npm run build

# Expose the port (default Next.js serves on 3000)
EXPOSE 3000

# Set PATH for yt-dlp and ffmpeg binaries
ENV PATH="/app/node_modules/yt-dlp-exec/bin:/app/node_modules/ffmpeg-static/bin:$PATH"

# Start the app
CMD ["npm", "start"]