// src/app/apple-icon.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size    = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="6" cy="6" r="3" stroke="white" strokeWidth="2" />
          <circle cx="6" cy="18" r="3" stroke="white" strokeWidth="2" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
