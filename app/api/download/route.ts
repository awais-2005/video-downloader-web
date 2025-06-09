import { type NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { tmpdir } from "os"
import ytDlp from 'yt-dlp-exec'
import { createReadStream, statSync, unlinkSync } from "fs"
import { getFfmpeg } from '@ffmpeg-installer/ffmpeg'

// Set FFmpeg path
process.env.FFMPEG_PATH = getFfmpeg().path

// Use environment variable for yt-dlp path if available
const ytDlpPath = process.env.YTDLP_PATH || undefined

export async function POST(request: NextRequest) {
  try {
    const { url, format } = await request.json()

    if (!url || !format) {
      return NextResponse.json({ error: "URL and format are required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Download the video using yt-dlp
    const downloadResult = await downloadVideo(url, format)

    if (!downloadResult.success || !downloadResult.filePath) {
      return NextResponse.json({ error: downloadResult.error || "Download failed" }, { status: 500 })
    }

    // Read the file and return it
    if (!downloadResult.filePath) {
      return NextResponse.json({ error: "File path is undefined after download." }, { status: 500 })
    }
    const fileStats = await new Promise<import("fs").Stats>((resolveStats, rejectStats) => {
      (require("fs") as typeof import("fs")).stat(downloadResult.filePath as import("fs").PathLike, (err: NodeJS.ErrnoException | null, stats: import("fs").Stats) => {
        if (err) rejectStats(err)
        else resolveStats(stats)
      })
    })
    const totalSize = fileStats.size
    const fileStream = createReadStream(downloadResult.filePath)

    // Set up a ReadableStream for Next.js Response
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          controller.enqueue(chunk)
        })
        fileStream.on("end", () => {
          controller.close()
          // Clean up the temporary file
          try { unlinkSync(downloadResult.filePath!) } catch { }
        })
        fileStream.on("error", (error) => {
          controller.error(error)
          // Clean up on error
          try { unlinkSync(downloadResult.filePath!) } catch { }
        })
      },
    })

    const filename = downloadResult.filename || `video_${Date.now()}`
    const extension = downloadResult.extension || "mp4"
    const response = new NextResponse(stream)
    response.headers.set("Content-Type", getContentType(extension))
    response.headers.set("Content-Disposition", `attachment; filename=\"${filename}.${extension}\"`)
    response.headers.set("Content-Length", totalSize.toString())
    // Allow CORS for streaming
    response.headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Disposition")
    return response
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}

interface DownloadResult {
  success: boolean
  filePath?: string
  filename?: string
  extension?: string
  error?: string
}

function downloadVideo(url: string, formatId: string): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const tempDir = tmpdir()
    const outputTemplate = join(tempDir, `download_${Date.now()}.%(ext)s`)

    let ytDlpArgs: string[]
    // Detect audio-only requests
    const isAudioOnly = formatId === "audio-only" || formatId === "audio"

    if (isAudioOnly) {
      // Always select best available audio
      ytDlpArgs = [
        "-f", "bestaudio",
        "-x", "--audio-format", "mp3", "--audio-quality", "0",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    } else if (url.includes("facebook.com")) {
      // Handle Facebook videos - ensure we get both video and audio streams
      ytDlpArgs = [
        "-f", "bestvideo+bestaudio/best",
        "--merge-output-format", "mp4",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    } else if (url.includes("instagram.com")) {
      ytDlpArgs = [
        "-f", "best",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // Always merge best video+audio for selected MP4 quality
      ytDlpArgs = [
        "-f", `${formatId}+bestaudio[ext=m4a]/best[ext=mp4]/best`,
        "--merge-output-format", "mp4",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    } else if (formatId === "bestvideo+bestaudio") {
      ytDlpArgs = [
        "-f", "bestvideo+bestaudio",
        "--merge-output-format", "mp4",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    } else {
      ytDlpArgs = [
        "-f", formatId,
        "--merge-output-format", "mp4",
        "--output", outputTemplate,
        "--no-warnings",
        url,
      ]
    }

    // Always use the default cookies.txt file if it exists
    const fs = require("fs")
    const path = require("path")
    const defaultCookiesPath = path.join(process.cwd(), "cookies.txt")
    if (fs.existsSync(defaultCookiesPath)) {
      ytDlpArgs.push("--cookies", defaultCookiesPath)
    }

    const ytDlp = spawn("yt-dlp", ytDlpArgs)

    let errorOutput = ""

    ytDlp.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    ytDlp.on("close", (code) => {
      // Check if file exists before proceeding
      if (code === 0) {
        // Find the output file (mp4 or mp3)
        const exts = ["mp4", "mkv", "webm", "mp3", "m4a", "wav", "ogg"]
        let foundFile = undefined
        let foundExt = undefined
        for (const ext of exts) {
          const candidate = outputTemplate.replace("%(ext)s", ext)
          if (fs.existsSync(candidate)) {
            foundFile = candidate
            foundExt = ext
            break
          }
        }
        if (foundFile) {
          const filename = foundFile.split(/[/\\]/).pop() || "video"
          const nameWithoutExt = filename.replace(`.${foundExt}`, "")
          resolve({
            success: true,
            filePath: foundFile,
            filename: nameWithoutExt.replace(/[^a-zA-Z0-9\-_\s]/g, "_"),
            extension: foundExt,
          })
        } else {
          resolve({
            success: false,
            error: "Download failed. The file was not created. This format might not be available.\n" + errorOutput,
          })
        }
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Fallback: try -f best if robust format fails for YouTube
        const fallbackArgs = [
          "-f", "best",
          "--merge-output-format", "mp4",
          "--output", outputTemplate,
          "--no-warnings",
          url,
        ]
        if (fs.existsSync(defaultCookiesPath)) {
          fallbackArgs.push("--cookies", defaultCookiesPath)
        }
        const fallback = spawn("yt-dlp", fallbackArgs)
        let fallbackError = ""
        fallback.stderr.on("data", (data) => {
          fallbackError += data.toString()
        })
        fallback.on("close", (fallbackCode) => {
          if (fallbackCode === 0) {
            const exts = ["mp4", "mkv", "webm", "mp3", "m4a", "wav", "ogg"]
            let foundFile = undefined
            let foundExt = undefined
            for (const ext of exts) {
              const candidate = outputTemplate.replace("%(ext)s", ext)
              if (fs.existsSync(candidate)) {
                foundFile = candidate
                foundExt = ext
                break
              }
            }
            if (foundFile) {
              const filename = foundFile.split(/[/\\]/).pop() || "video"
              const nameWithoutExt = filename.replace(`.${foundExt}`, "")
              resolve({
                success: true,
                filePath: foundFile,
                filename: nameWithoutExt.replace(/[^a-zA-Z0-9\-_\s]/g, "_"),
                extension: foundExt,
              })
            } else {
              resolve({
                success: false,
                error: "Download failed (YouTube fallback). The file was not created.\n" + fallbackError,
              })
            }
          } else {
            resolve({
              success: false,
              error: "yt-dlp error: " + errorOutput + "\nYouTube fallback error: " + fallbackError,
            })
          }
        })
      } else if (formatId === "bestvideo+bestaudio") {
        // Fallback: try -f best if bestvideo+bestaudio fails
        const fallbackArgs = [
          "-f", "best",
          "--output", outputTemplate,
          "--no-warnings",
          url,
        ]
        if (fs.existsSync(defaultCookiesPath)) {
          fallbackArgs.push("--cookies", defaultCookiesPath)
        }
        const fallback = spawn("yt-dlp", fallbackArgs)
        let fallbackError = ""
        fallback.stderr.on("data", (data) => {
          fallbackError += data.toString()
        })
        fallback.on("close", (fallbackCode) => {
          if (fallbackCode === 0) {
            const exts = ["mp4", "mkv", "webm", "mp3", "m4a", "wav", "ogg"]
            let foundFile = undefined
            let foundExt = undefined
            for (const ext of exts) {
              const candidate = outputTemplate.replace("%(ext)s", ext)
              if (fs.existsSync(candidate)) {
                foundFile = candidate
                foundExt = ext
                break
              }
            }
            if (foundFile) {
              const filename = foundFile.split(/[/\\]/).pop() || "video"
              const nameWithoutExt = filename.replace(`.${foundExt}`, "")
              resolve({
                success: true,
                filePath: foundFile,
                filename: nameWithoutExt.replace(/[^a-zA-Z0-9\-_\s]/g, "_"),
                extension: foundExt,
              })
            } else {
              resolve({
                success: false,
                error: "Download failed (fallback). The file was not created.\n" + fallbackError,
              })
            }
          } else {
            resolve({
              success: false,
              error: "yt-dlp error: " + errorOutput + "\nFallback error: " + fallbackError,
            })
          }
        })
      } else {
        resolve({
          success: false,
          error: "yt-dlp error: " + errorOutput,
        })
      }
    })

    ytDlp.on("error", (error) => {
      resolve({
        success: false,
        error: "Failed to start download process: " + error,
      })
    })
  })
}

function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    wav: "audio/wav",
  }
  return contentTypes[extension.toLowerCase()] || "application/octet-stream"
}
