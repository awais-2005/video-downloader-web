import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"

interface VideoFormat {
  format_id: string
  ext: string
  quality: string
  format_note?: string
  acodec?: string
  vcodec?: string
  filesize?: number
  format: string
  height?: number // Added height property to resolve TypeScript errors
}

interface YtDlpInfo {
  title: string
  thumbnail?: string
  duration?: number
  formats: VideoFormat[]
  extractor: string
  webpage_url: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Get video info using yt-dlp
    const videoInfo = await getVideoInfo(url)

    if (!videoInfo) {
      return NextResponse.json({ error: "Could not extract video information from this URL" }, { status: 400 })
    }

    // Process and filter formats
    const processedFormats = processFormats(videoInfo.formats)

    const result = {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail || "/placeholder.svg?height=180&width=320",
      duration: formatDuration(videoInfo.duration || 0),
      platform: videoInfo.extractor,
      formats: processedFormats,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching video info:", error)
    return NextResponse.json(
      { error: "Failed to fetch video information. This platform might not be supported." },
      { status: 500 },
    )
  }
}

function getVideoInfo(url: string): Promise<YtDlpInfo | null> {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn("yt-dlp", [
      "--dump-json",
      "--no-download",
      "--no-warnings",
      url
    ]);

    let output = "";
    let errorOutput = "";

    ytDlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on("close", (code) => {
      if (code === 0 && output.trim()) {
        try {
          const info = JSON.parse(output.trim());
          resolve(info);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          resolve(null);
        }
      } else {
        console.error("yt-dlp error:", errorOutput);
        resolve(null);
      }
    });

    ytDlp.on("error", (error) => {
      console.error("Spawn error:", error);
      reject(error);
    });
  });
}

function processFormats(formats: VideoFormat[]) {
  if (!formats || !Array.isArray(formats)) {
    return []
  }

  // Debug: Log formats for Twitter
  if (formats.length > 0 && formats[0].format && formats[0].format.includes('twitter')) {
    console.log('Twitter formats:', JSON.stringify(formats, null, 2));
  }

  // Only include unique MP4 video formats for selection, always with audio (yt-dlp will merge)
  const seen = new Set();
  let videoFormats = formats
    .filter(
      (format) =>
        format.ext === "mp4" &&
        format.vcodec && format.vcodec !== "none" &&
        format.format_id &&
        (format.format_note || format.quality || format.height)
    )
    .filter((format) => {
      // Only keep the first occurrence of each qualityLabel (e.g., 1080p, 720p, etc.)
      const label = String(format.format_note || format.quality || format.height || "").toLowerCase();
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .map((format) => ({
      itag: format.format_id,
      quality: format.quality || format.format_note || format.height || "Unknown",
      format: format.format,
      hasAudio: true, // Always true for UI clarity
      hasVideo: true,
      container: format.ext,
      qualityLabel: format.format_note || format.quality || format.height,
      filesize: format.filesize,
      label: `${format.format_note || format.quality || format.height || "Video"} - MP4 (Video + Audio)`
    }))

  // Fallback: If no MP4 video formats found, include any video format with vcodec (not none)
  if (videoFormats.length === 0) {
    const fallbackSeen = new Set();
    videoFormats = formats
      .filter(
        (format) => format.vcodec && format.vcodec !== "none" && format.format_id && (format.format_note || format.quality || format.height)
      )
      .filter((format) => {
        const label = String(format.format_note || format.quality || format.height || "").toLowerCase();
        if (fallbackSeen.has(label)) return false;
        fallbackSeen.add(label);
        return true;
      })
      .map((format) => ({
        itag: format.format_id,
        quality: format.quality || format.format_note || format.height || "Unknown",
        format: format.format,
        hasAudio: true,
        hasVideo: true,
        container: format.ext,
        qualityLabel: format.format_note || format.quality || format.height,
        filesize: format.filesize,
        label: `${format.format_note || format.quality || format.height || "Video"} - ${format.ext.toUpperCase()} (Video + Audio)`
      }))
  }

  // Always provide a best audio option
  const bestAudio = formats.find(
    (format) => format.ext && format.acodec && format.acodec !== "none" && (!format.vcodec || format.vcodec === "none")
  )

  const result: any[] = []
  if (videoFormats.length > 0) {
    result.push(...videoFormats)
  }
  if (bestAudio) {
    result.push({
      itag: bestAudio.format_id,
      quality: bestAudio.quality || bestAudio.format_note || "Best",
      format: bestAudio.format,
      hasAudio: true,
      hasVideo: false,
      container: bestAudio.ext,
      qualityLabel: bestAudio.format_note || "Best",
      filesize: bestAudio.filesize,
      label: "Audio Only"
    })
  }
  return result
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "Unknown"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
