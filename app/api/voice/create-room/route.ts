import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

async function getManagementToken() {
  return jwt.sign(
    {
      access_key: process.env.HMS_ACCESS_KEY,
      type: 'management',
      version: 2,
      iat: Math.floor(Date.now() / 1000),
      nbf: Math.floor(Date.now() / 1000),
    },
    process.env.HMS_SECRET!,
    { algorithm: 'HS256', expiresIn: '1h', jwtid: crypto.randomUUID() }
  )
}

export async function POST(req: NextRequest) {
  const { gameId } = await req.json()
  if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })

  const token = await getManagementToken()

  const roomRes = await fetch('https://api.100ms.live/v2/rooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `game-${gameId}-${Date.now()}`,
      template_id: process.env.HMS_TEMPLATE_ID,
    }),
  })
  const room = await roomRes.json()
  if (!room.id) {
    return NextResponse.json({ error: 'Failed to create room', detail: room }, { status: 500 })
  }

  const codeRes = await fetch(`https://api.100ms.live/v2/room-codes/room/${room.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const codes = await codeRes.json()
  const roomCode = codes?.data?.[0]?.code

  return NextResponse.json({ roomCode })
}