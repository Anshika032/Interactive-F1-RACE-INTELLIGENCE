'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import RaceInfo from '@/components/RaceInfo'

const LiveBackground = dynamic(() => import('../components/LiveBackground'), { ssr: false })

const HeroSection = dynamic(() => import('../components/HeroSection'), { ssr: false })

const PredictionDashboard = dynamic(
  () => import('../components/PredictionDashboard'),
  { ssr: false }
)

export default function Home() {
  const introRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(introRef.current,
      { opacity: 1 },
      { opacity: 0, duration: 0.8, delay: 0.5, ease: 'power2.inOut',
        onComplete: () => { if (introRef.current) introRef.current.style.display = 'none' }
      }
    )
    tl.fromTo(contentRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    )
  }, [])

  return (
    <main style={{ background: '#000', minHeight: '100vh', position: 'relative' }}>

      {/* Intro flash */}
      <div ref={introRef} style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 'clamp(14px,3vw,28px)',
          fontWeight: 900, letterSpacing: 12,
          background: 'linear-gradient(135deg,#FF4500,#FF8C00,#FFD700)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          RACE ORACLE
        </div>
        <div style={{ width: 120, height: 1, background: 'linear-gradient(90deg,transparent,#FF4500,transparent)' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, letterSpacing: 5, color: 'rgba(255,100,40,0.5)' }}>
          INITIALISING AI ENGINE
        </div>
      </div>

      <LiveBackground />

      <div ref={contentRef} style={{ opacity: 0, position: 'relative', zIndex: 5 }}>

        {/* Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '18px 6vw',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,69,0,0.15)',
        }}>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: 16,
            background: 'linear-gradient(90deg,#FF4500,#FF8C00)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: 3,
          }}>RACE ORACLE</div>
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: 'PREDICT', href: '#prediction' },
              { label: 'TELEMETRY', href: '#telemetry', disabled: true },
              { label: 'STRATEGY', href: '#strategy', disabled: true },
              { label: 'FANTASY', href: '#fantasy', disabled: true },
            ].map(item => (
              <a key={item.label} href={item.disabled ? undefined : item.href} style={{
                fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3,
                color: item.disabled ? 'rgba(255,120,50,0.25)' : 'rgba(255,120,50,0.6)',
                background: 'none', border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase' as const,
                textDecoration: 'none',
                position: 'relative' as const,
              }}>
                {item.label}
                {item.disabled && (
                  <span style={{ fontSize: 7, marginLeft: 4, color: 'rgba(255,69,0,0.3)' }}>SOON</span>
                )}
              </a>
            ))}
          </div>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2, color: 'rgba(255,69,0,0.4)' }}>
            <span style={{ color: '#FF4500' }}>●</span> LIVE
          </div>
        </nav>

        <HeroSection />

        <div style={{ height: 1, margin: '0 6vw', background: 'linear-gradient(90deg,transparent,rgba(255,69,0,0.4),transparent)' }} />

        <RaceInfo />

        <PredictionDashboard />

        <footer style={{
          borderTop: '1px solid rgba(255,69,0,0.15)',
          padding: '24px 6vw',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(255,69,0,0.3)' }}>RACE ORACLE © 2025</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, letterSpacing: 2, color: 'rgba(255,120,50,0.3)' }}>XGBOOST · MULTI-SEASON · LEAKAGE-SAFE</div>
        </footer>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#000}
        ::-webkit-scrollbar-thumb{background:rgba(255,69,0,0.4)}
        ::selection{background:rgba(255,69,0,0.3);color:#FFD700}
      `}</style>
    </main>
  )
}