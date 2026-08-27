import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TonyFlix — Xem Phim Online HD Vietsub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b0b0d 0%, #16161a 100%)',
          color: '#e4f22e',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>TONYFLIX</div>
        <div style={{ fontSize: 36, color: '#f5f5f5', marginTop: 12 }}>
          Xem Phim Online HD Vietsub
        </div>
        <div style={{ fontSize: 24, color: '#9ca3af', marginTop: 8 }}>
          Phim bộ · Phim lẻ · Anime · Cập nhật liên tục
        </div>
      </div>
    ),
    { ...size },
  )
}
