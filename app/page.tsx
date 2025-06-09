"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2, Video, Music } from "lucide-react"

interface VideoFormat {
  itag: number
  quality: string
  format: string
  hasAudio: boolean
  hasVideo: boolean
  container: string
  qualityLabel?: string
}

interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  platform: string
  formats: VideoFormat[]
}

export default function VideoDownloader() {
  const [url, setUrl] = useState("")
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState("")
  const [selectedQuality, setSelectedQuality] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState("")
  const [downloadProgress, setDownloadProgress] = useState(0)

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL")
      return
    }

    setIsLoading(true)
    setError("")
    setVideoInfo(null)

    try {
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video information")
      }

      setVideoInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadVideo = async () => {
    // Use correct formatId for backend
    const formatToSend = selectedFormat === "audio-only" ? "audio-only" : selectedQuality
    if (!formatToSend || !url) return

    setIsDownloading(true)
    setError("")
    setDownloadProgress(0)

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, format: formatToSend }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Download failed")
      }

      // Stream the response and update progress
      const contentLength = response.headers.get("Content-Length")
      const total = contentLength ? parseInt(contentLength, 10) : 0
      const reader = response.body?.getReader()
      let received = 0
      const chunks: Uint8Array[] = []

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          received += value.length
          if (total) {
            setDownloadProgress(Math.round((received / total) * 100))
          }
        }
      }

      const blob = new Blob(chunks)
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `${videoInfo?.title || "video"}.${selectedFormat.includes("mp3") ? "mp3" : "mp4"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const getFormatLabel = (format: VideoFormat) => {
    if (format.hasVideo && format.hasAudio) {
      return `${format.qualityLabel || format.quality} - ${format.container.toUpperCase()} (Video + Audio)`
    } else if (format.hasVideo) {
      return `${format.qualityLabel || format.quality} - ${format.container.toUpperCase()} (Video Only)`
    } else if (format.hasAudio) {
      return `Audio Only - ${format.container.toUpperCase()}`
    }
    return `${format.quality} - ${format.container.toUpperCase()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Video Downloader</h1>
          <p className="text-gray-600">
            Download videos from any platform - Instagram, TikTok, YouTube, Twitter, and more
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Enter Video URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                placeholder="Paste any video URL (Instagram, TikTok, YouTube, Twitter, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={fetchVideoInfo} disabled={isLoading} className="sm:w-auto w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Info"
                )}
              </Button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
          </CardContent>
        </Card>

        {videoInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={videoInfo.thumbnail || "/placeholder.svg"}
                  alt={videoInfo.title}
                  className="w-full md:w-48 h-32 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{videoInfo.title}</h3>
                  <p className="text-gray-600">Duration: {videoInfo.duration}</p>
                  <p className="text-gray-600">Platform: {videoInfo.platform}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {videoInfo && videoInfo.formats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format selection dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Format</label>
                <Select
                  value={selectedFormat}
                  onValueChange={(val) => {
                    setSelectedFormat(val)
                    setSelectedQuality("") // Reset quality if format changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio-only">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        Audio Only (Best Quality, MP3)
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video (Select Quality)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Video quality dropdown, only if video is selected */}
              {selectedFormat === "video" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Video Quality</label>
                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose video quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoInfo.formats
                        .filter(f => f.hasVideo && f.qualityLabel)
                        .sort((a, b) => {
                          // Sort by resolution descending (e.g., 1080p > 720p > 480p)
                          const getRes = (q: string | undefined) => parseInt(q || "0");
                          return getRes(b.qualityLabel) - getRes(a.qualityLabel);
                        })
                        .map((format) => (
                          <SelectItem key={format.itag} value={format.itag.toString()}>
                            {getFormatLabel(format)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={downloadVideo}
                disabled={
                  (selectedFormat === "video" && !selectedQuality) ||
                  !selectedFormat ||
                  isDownloading
                }
                className={
                  `w-full relative overflow-hidden transition-all duration-300 ${isDownloading ? 'cursor-default' : ''}`
                }
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <span className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300" style={{ width: `${downloadProgress}%`, opacity: 0.2 }} />
                    <span className="relative z-10 w-full flex items-center justify-center">
                      {downloadProgress < 100 ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading... {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Finalizing...
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
