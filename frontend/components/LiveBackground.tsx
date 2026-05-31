'use client'
import { useEffect, useRef } from 'react'

export default function LiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    let frame = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Grid dots
    const makeDots = () => {
      const dots: { x: number; y: number; base: number }[] = []
      for (let x = 0; x < canvas.width; x += 55) {
        for (let y = 0; y < canvas.height; y += 55) {
          dots.push({ x, y, base: Math.random() * Math.PI * 2 })
        }
      }
      return dots
    }
    let dots = makeDots()
    window.addEventListener('resize', () => { dots = makeDots() })

    // ── Circuit traces
    type Trace = { pts: { x: number; y: number }[]; progress: number; speed: number; alpha: number }
    const makeTrace = (): Trace => {
      const pts: { x: number; y: number }[] = []
      const startX = Math.random() * canvas.width
      const startY = Math.random() * canvas.height
      let x = startX, y = startY
      const steps = 10 + Math.floor(Math.random() * 10)
      pts.push({ x, y })
      for (let i = 0; i < steps; i++) {
        const dir = Math.floor(Math.random() * 4)
        const dist = 60 + Math.random() * 120
        if (dir === 0) x += dist
        else if (dir === 1) x -= dist
        else if (dir === 2) y += dist
        else y -= dist
        pts.push({ x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) })
      }
      return { pts, progress: 0, speed: 0.004 + Math.random() * 0.006, alpha: 0.15 + Math.random() * 0.25 }
    }
    const traces: Trace[] = Array.from({ length: 12 }, makeTrace)

    // ── Embers
    type Ember = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number }
    const embers: Ember[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 1.2 + 0.3),
      life: Math.random(),
      size: Math.random() * 2 + 0.5,
      hue: Math.random() * 35 + 5,
    }))

    // ── Fog layers
    type Fog = { x: number; y: number; r: number; alpha: number; vx: number; vy: number }
    const fogLayers: Fog[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.3 + Math.random() * canvas.height * 0.5,
      r: 200 + Math.random() * 300,
      alpha: 0.03 + Math.random() * 0.04,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
    }))

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.14)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Radial deep glow
      const rg = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.6, 0, canvas.width / 2, canvas.height * 0.6, canvas.width * 0.55)
      rg.addColorStop(0, 'rgba(180,40,0,0.06)')
      rg.addColorStop(0.5, 'rgba(100,20,0,0.03)')
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid dots
      dots.forEach(d => {
        const a = 0.04 + 0.04 * Math.sin(frame * 0.015 + d.base)
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,80,0,${a})`
        ctx.fill()
      })

      // Circuit traces
      traces.forEach(tr => {
        tr.progress += tr.speed
        if (tr.progress > 1) {
          Object.assign(tr, makeTrace(), { progress: 0 })
          return
        }
        const total = tr.pts.length - 1
        const trailLen = 0.25
        const headFrac = tr.progress
        const tailFrac = Math.max(0, headFrac - trailLen)
        const headIdx = Math.floor(headFrac * total)
        const tailIdx = Math.floor(tailFrac * total)

        for (let i = tailIdx; i <= Math.min(headIdx, total - 1); i++) {
          const seg = (i - tailIdx) / Math.max(1, headIdx - tailIdx)
          ctx.beginPath()
          ctx.moveTo(tr.pts[i].x, tr.pts[i].y)
          ctx.lineTo(tr.pts[i + 1].x, tr.pts[i + 1].y)
          ctx.strokeStyle = `rgba(255,${80 + seg * 60},0,${tr.alpha * seg})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
        // Head glow dot
        const hp = tr.pts[Math.min(headIdx, total)]
        if (hp) {
          ctx.beginPath()
          ctx.arc(hp.x, hp.y, 3, 0, Math.PI * 2)
          const hg = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 6)
          hg.addColorStop(0, `rgba(255,160,0,${tr.alpha * 2})`)
          hg.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = hg
          ctx.fill()
        }
      })

      // Fog layers
      fogLayers.forEach(f => {
        f.x += f.vx
        f.y += f.vy
        if (f.x < -f.r) f.x = canvas.width + f.r
        if (f.x > canvas.width + f.r) f.x = -f.r
        if (f.y < -f.r) f.y = canvas.height + f.r
        if (f.y > canvas.height + f.r) f.y = -f.r
        const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
        fg.addColorStop(0, `rgba(120,40,0,${f.alpha})`)
        fg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = fg
        ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2)
      })

      // Embers
      embers.forEach(e => {
        e.x += e.vx + Math.sin(frame * 0.02 + e.y * 0.005) * 0.25
        e.y += e.vy
        e.life -= 0.006
        if (e.life <= 0) {
          e.x = Math.random() * canvas.width
          e.y = canvas.height + 5
          e.life = 0.4 + Math.random() * 0.6
          e.vy = -(Math.random() * 1.2 + 0.3)
        }
        const a = e.life * 0.85
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${e.hue},100%,60%,${a})`
        ctx.fill()
      })

      // Horizontal speed streak flashes
      if (frame % 90 < 2) {
        const sy = Math.random() * canvas.height
        const grad = ctx.createLinearGradient(0, sy, canvas.width, sy)
        grad.addColorStop(0, 'transparent')
        grad.addColorStop(0.3, 'rgba(255,60,0,0.06)')
        grad.addColorStop(0.7, 'rgba(255,100,0,0.08)')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, sy - 0.5, canvas.width, 1)
      }

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}