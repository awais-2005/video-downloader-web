import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import { join } from "path"
import { randomUUID } from "crypto"

// POST: Store cookies for the session
export async function POST(request: NextRequest) {
    try {
        const { cookies } = await request.json()
        if (!cookies || typeof cookies !== "string") {
            return NextResponse.json({ error: "Cookies are required" }, { status: 400 })
        }
        // Generate or get session id from cookie
        let sessionId = request.cookies.get("sessionId")?.value
        if (!sessionId) {
            sessionId = randomUUID()
        }
        // Store cookies in a file named by sessionId
        const cookiesPath = join(process.cwd(), `cookies_${sessionId}.txt`)
        await fs.writeFile(cookiesPath, cookies, "utf8")
        // Set sessionId cookie in response
        const res = NextResponse.json({ success: true })
        res.cookies.set("sessionId", sessionId, { httpOnly: true, path: "/", sameSite: "lax" })
        return res
    } catch (error) {
        return NextResponse.json({ error: "Failed to store cookies" }, { status: 500 })
    }
}

// DELETE: Remove cookies for the session
export async function DELETE(request: NextRequest) {
    try {
        const sessionId = request.cookies.get("sessionId")?.value
        if (!sessionId) {
            return NextResponse.json({ error: "No session" }, { status: 400 })
        }
        const cookiesPath = join(process.cwd(), `cookies_${sessionId}.txt`)
        await fs.unlink(cookiesPath)
        const res = NextResponse.json({ success: true })
        res.cookies.set("sessionId", "", { httpOnly: true, path: "/", maxAge: 0 })
        return res
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete cookies" }, { status: 500 })
    }
}
