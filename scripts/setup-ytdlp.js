const { spawn } = require("child_process")

console.log("Checking yt-dlp installation...")

// Check if yt-dlp is installed
const checkYtDlp = spawn("yt-dlp", ["--version"])

checkYtDlp.on("close", (code) => {
  if (code === 0) {
    console.log("✅ yt-dlp is already installed and working!")
  } else {
    console.log("❌ yt-dlp not found. Please install it:")
    console.log("")
    console.log("Option 1 - Using pip:")
    console.log("pip install yt-dlp")
    console.log("")
    console.log("Option 2 - Using conda:")
    console.log("conda install -c conda-forge yt-dlp")
    console.log("")
    console.log("Option 3 - Download binary:")
    console.log("Visit: https://github.com/yt-dlp/yt-dlp/releases")
    console.log("")
    console.log("For more installation options, visit:")
    console.log("https://github.com/yt-dlp/yt-dlp#installation")
  }
})

checkYtDlp.on("error", (error) => {
  console.log("❌ yt-dlp not found. Please install it:")
  console.log("")
  console.log("Option 1 - Using pip:")
  console.log("pip install yt-dlp")
  console.log("")
  console.log("Option 2 - Using conda:")
  console.log("conda install -c conda-forge yt-dlp")
  console.log("")
  console.log("Option 3 - Download binary:")
  console.log("Visit: https://github.com/yt-dlp/yt-dlp/releases")
  console.log("")
  console.log("For more installation options, visit:")
  console.log("https://github.com/yt-dlp/yt-dlp#installation")
})
