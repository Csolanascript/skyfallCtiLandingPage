'use client'
import { useEffect, useRef } from 'react'

export function ChaosCanvas({ w = 240, h = 320 }: { w?: number; h?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D; if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 420
    const usedDpr = isMobile ? Math.min(dpr, 1) : dpr
    canvas.width = w * usedDpr; canvas.height = h * usedDpr
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    ctx.scale(usedDpr, usedDpr)

    class Particle {
      x: number; y: number; vx: number; vy: number; r: number
      constructor() {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.vx = (Math.random() - 0.5) * 2.2
        this.vy = (Math.random() - 0.5) * 2.2
        this.r = 1.2 + Math.random() * 1.8
      }
      update() {
        this.vx += (Math.random() - 0.5) * 0.35
        this.vy += (Math.random() - 0.5) * 0.35
        this.vx *= 0.97; this.vy *= 0.97
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > w) this.vx *= -1
        if (this.y < 0 || this.y > h) this.vy *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(232,84,25,0.7)'
        ctx.fill()
      }
    }

    const count = Math.max(6, Math.round((w * h) / (isMobile ? 600 : 280)))
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) particles.push(new Particle())

    let animId: number | null = null
    let intervalId: number | null = null
    const loop = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, 0, w, h)
      particles.forEach(p => { p.update(); p.draw() })
    }
    if (isMobile) {
      // throttle to ~30fps on small devices
      intervalId = window.setInterval(loop, 1000 / 30)
    } else {
      const animate = () => { loop(); animId = requestAnimationFrame(animate) }
      animate()
    }
    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [w, h])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

export function GraphCanvas({ w = 240, h = 320 }: { w?: number; h?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D; if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 420
    const usedDpr = isMobile ? Math.min(dpr, 1) : dpr
    canvas.width = w * usedDpr; canvas.height = h * usedDpr
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
    ctx.scale(usedDpr, usedDpr)

    const EDGE_DIST = Math.min(w, h) * 0.35

    interface Node { x: number; y: number; r: number; hub: boolean; phase: number }

    const clusters = [
      { cx: w * 0.27, cy: h * 0.22, n: Math.max(3, Math.round(7 * (isMobile ? 0.6 : 1))) },
      { cx: w * 0.74, cy: h * 0.28, n: Math.max(3, Math.round(6 * (isMobile ? 0.6 : 1))) },
      { cx: w * 0.22, cy: h * 0.72, n: Math.max(3, Math.round(7 * (isMobile ? 0.6 : 1))) },
      { cx: w * 0.75, cy: h * 0.74, n: Math.max(3, Math.round(8 * (isMobile ? 0.6 : 1))) },
    ]

    const nodes: Node[] = []
    const rng = (a: number, b: number) => a + Math.random() * (b - a)

    clusters.forEach(({ cx, cy, n }) => {
      nodes.push({ x: cx, y: cy, r: 4.5, hub: true, phase: rng(0, Math.PI * 2) })
      for (let i = 0; i < n - 1; i++) {
        const angle = rng(0, Math.PI * 2)
        const dist = rng(14, Math.min(w, h) * 0.22)
        nodes.push({
          x: Math.max(4, Math.min(w - 4, cx + Math.cos(angle) * dist)),
          y: Math.max(4, Math.min(h - 4, cy + Math.sin(angle) * dist)),
          r: rng(1.2, 2.4), hub: false, phase: rng(0, Math.PI * 2)
        })
      }
    })

    const edges: [number, number][] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (Math.sqrt(dx * dx + dy * dy) < EDGE_DIST) edges.push([i, j])
      }
    }

    let t = 0; let animId: number | null = null; let intervalId: number | null = null
    const loop = () => {
      t += isMobile ? 0.035 : 0.018
      ctx.fillStyle = 'rgba(0,0,0,0.14)'
      ctx.fillRect(0, 0, w, h)

      edges.forEach(([i, j]) => {
        const a = nodes[i]; const b = nodes[j]
        const dx = a.x - b.x; const dy = a.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        const alpha = (1 - d / EDGE_DIST) * 0.45
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(232,84,25,${alpha})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      })

      nodes.forEach(n => {
        const pulse = n.hub ? 1 + 0.22 * Math.sin(t + n.phase) : 1
        const r = n.r * pulse

        if (n.hub) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, r * 2.8, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.8)
          glow.addColorStop(0, `rgba(232,84,25,${0.18 + 0.08 * Math.sin(t + n.phase)})`)
          glow.addColorStop(1, 'rgba(232,84,25,0)')
          ctx.fillStyle = glow
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.hub ? 'rgba(232,84,25,0.95)' : 'rgba(232,84,25,0.65)'
        ctx.fill()
      })
    }
    if (isMobile) {
      intervalId = window.setInterval(loop, 1000 / 30)
    } else {
      const animate = () => { loop(); animId = requestAnimationFrame(animate) }
      animate()
    }
    return () => { if (animId) cancelAnimationFrame(animId); if (intervalId) clearInterval(intervalId) }
  }, [w, h])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

export { ChaosCanvas as EntropyCanvas }
