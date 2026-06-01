'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

class Vector2D {
  constructor(public x: number, public y: number) {}
  static random(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}
class Vector3D {
  constructor(public x: number, public y: number, public z: number) {}
}

class AnimationController {
  private timeline: gsap.core.Timeline
  private time   = 0
  private canvas: HTMLCanvasElement
  private ctx:    CanvasRenderingContext2D
  private size:   number
  private stars:  Star[] = []

  private readonly changeEventTime      = 0.32
  private readonly cameraZ              = -400
  private readonly cameraTravelDistance = 3400
  private readonly startDotYOffset      = 28
  private readonly viewZoom             = 100
  private readonly numberOfStars        = 5000
  private readonly trailLength          = 80
  private readonly dotColor             = '#E85419'

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, _dpr: number, size: number) {
    this.canvas   = canvas
    this.ctx      = ctx
    this.size     = size
    this.timeline = gsap.timeline({ repeat: -1 })
    this.setupStars()
    this.setupTimeline()
  }

  private setupStars() {
    const orig = Math.random
    let seed   = 1234
    Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    for (let i = 0; i < this.numberOfStars; i++) this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance))
    Math.random = orig
  }

  private setupTimeline() {
    this.timeline.to(this, { time: 1, duration: 15, repeat: -1, ease: 'none', onUpdate: () => this.render() })
  }

  ease(p: number, g: number)          { return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g) }
  easeOutElastic(x: number)           { const c4 = (2 * Math.PI) / 4.5; if (x <= 0) return 0; if (x >= 1) return 1; return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1 }
  map(v: number, s1: number, e1: number, s2: number, e2: number) { return s2 + (e2 - s2) * ((v - s1) / (e1 - s1)) }
  constrain(v: number, mn: number, mx: number) { return Math.min(Math.max(v, mn), mx) }
  lerp(s: number, e: number, t: number)        { return s * (1 - t) + e * t }

  spiralPath(p: number): Vector2D {
    p = this.constrain(1.2 * p, 0, 1); p = this.ease(p, 1.8)
    const theta = 2 * Math.PI * 6 * Math.sqrt(p)
    const r     = 170 * Math.sqrt(p)
    return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset)
  }

  rotate(v1: Vector2D, v2: Vector2D, p: number, orientation: boolean): Vector2D {
    const mid   = new Vector2D((v1.x + v2.x) / 2, (v1.y + v2.y) / 2)
    const dx    = v1.x - mid.x; const dy = v1.y - mid.y
    const angle = Math.atan2(dy, dx); const o = orientation ? -1 : 1
    const r     = Math.sqrt(dx * dx + dy * dy)
    const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p)
    return new Vector2D(
      mid.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(p)),
      mid.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(p)),
    )
  }

  showProjectedDot(position: Vector3D, sizeFactor: number) {
    const t2       = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    const newCamZ  = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance
    if (position.z > newCamZ) {
      const depth = position.z - newCamZ
      const x = this.viewZoom * position.x / depth
      const y = this.viewZoom * position.y / depth
      const sw = 400 * sizeFactor / depth
      this.ctx.lineWidth = sw
      this.ctx.beginPath()
      this.ctx.arc(x, y, 0.5, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawStartDot() {
    if (this.time > this.changeEventTime) {
      const dy = this.cameraZ * this.startDotYOffset / this.viewZoom
      this.showProjectedDot(new Vector3D(0, dy, this.cameraTravelDistance), 2.5)
    }
  }

  render() {
    const ctx = this.ctx
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, this.size, this.size)
    ctx.save()
    ctx.translate(this.size / 2, this.size / 2)
    const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1)
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    ctx.rotate(-Math.PI * this.ease(t2, 2.7))
    for (let i = 0; i < this.trailLength; i++) {
      const f     = this.map(i, 0, this.trailLength, 1.1, 0.1)
      const sw    = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f
      const alpha = Math.round(this.map(i, 0, this.trailLength, 255, 60)).toString(16).padStart(2, '0')
      ctx.fillStyle  = `${this.dotColor}${alpha}`
      ctx.lineWidth  = sw
      const pathTime = t1 - 0.00015 * i
      const position = this.spiralPath(pathTime)
      const offset   = new Vector2D(position.x + 5, position.y + 5)
      const rotated  = this.rotate(position, offset, Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, i % 2 === 0)
      ctx.beginPath(); ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = this.dotColor
    for (const star of this.stars) star.render(t1, this)
    this.drawStartDot()
    ctx.restore()
  }

  destroy() { this.timeline.kill() }
}

class Star {
  private dx: number; private dy: number
  private spiralLocation: number; private strokeWeightFactor: number
  private z: number; private angle: number; private distance: number
  private rotationDirection: number; private expansionRate: number; private finalScale: number

  constructor(cameraZ: number, cameraTravelDistance: number) {
    this.angle            = Math.random() * Math.PI * 2
    this.distance         = 30 * Math.random() + 15
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1
    this.expansionRate    = 1.2 + Math.random() * 0.8
    this.finalScale       = 0.7 + Math.random() * 0.6
    this.dx               = this.distance * Math.cos(this.angle)
    this.dy               = this.distance * Math.sin(this.angle)
    this.spiralLocation   = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3
    this.z                = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ)
    const lerp = (s: number, e: number, t: number) => s * (1 - t) + e * t
    this.z                = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation)
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0)
  }

  render(p: number, ctrl: AnimationController) {
    const spiralPos = ctrl.spiralPath(this.spiralLocation)
    const q         = p - this.spiralLocation
    if (q <= 0) return
    const dp      = ctrl.constrain(4 * q, 0, 1)
    const linearE = dp; const elasticE = ctrl.easeOutElastic(dp); const powerE = Math.pow(dp, 2)
    let easing: number
    if (dp < 0.3)      easing = ctrl.lerp(linearE, powerE, dp / 0.3)
    else if (dp < 0.7) { const t = (dp - 0.3) / 0.4; easing = ctrl.lerp(powerE, elasticE, t) }
    else               easing = elasticE
    void easing
    let screenX: number, screenY: number
    if (dp < 0.3) {
      const t = dp / 0.3
      screenX = ctrl.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, t)
      screenY = ctrl.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, t)
    } else if (dp < 0.7) {
      const mid = (dp - 0.3) / 0.4; const curve = Math.sin(mid * Math.PI) * this.rotationDirection * 1.5
      const bx = spiralPos.x + this.dx * 0.3; const by = spiralPos.y + this.dy * 0.3
      const tx = spiralPos.x + this.dx * 0.7; const ty = spiralPos.y + this.dy * 0.7
      screenX = ctrl.lerp(bx, tx, mid) + (-this.dy * 0.4 * curve) * mid
      screenY = ctrl.lerp(by, ty, mid) + (this.dx * 0.4 * curve) * mid
    } else {
      const fp = (dp - 0.7) / 0.3; const bx = spiralPos.x + this.dx * 0.7; const by = spiralPos.y + this.dy * 0.7
      const td = this.distance * this.expansionRate * 1.5; const sa = this.angle + 1.2 * this.rotationDirection * fp * Math.PI
      screenX = ctrl.lerp(bx, spiralPos.x + td * Math.cos(sa), fp)
      screenY = ctrl.lerp(by, spiralPos.y + td * Math.sin(sa), fp)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cameraZ: number = (ctrl as any).cameraZ; const viewZoom: number = (ctrl as any).viewZoom
    const vx = (this.z - cameraZ) * screenX / viewZoom; const vy = (this.z - cameraZ) * screenY / viewZoom
    const pos = new Vector3D(vx, vy, this.z)
    let size = 1.0
    if (dp < 0.6) size = 1.0 + dp * 0.2
    else { const t = (dp - 0.6) / 0.4; size = ctrl.lerp(1.2, this.finalScale, t) }
    ctrl.showProjectedDot(pos, 8.5 * this.strokeWeightFactor * size)
  }
}

export function SpiralBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctrlRef   = useRef<AnimationController | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const set = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    set(); window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  useEffect(() => {
    if (!dims.w) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr  = window.devicePixelRatio || 1
    const size = Math.max(dims.w, dims.h)
    canvas.width = size * dpr; canvas.height = size * dpr
    canvas.style.width = `${dims.w}px`; canvas.style.height = `${dims.h}px`
    ctx.scale(dpr, dpr)
    if (ctrlRef.current) ctrlRef.current.destroy()
    ctrlRef.current = new AnimationController(canvas, ctx, dpr, size)
    return () => { ctrlRef.current?.destroy(); ctrlRef.current = null }
  }, [dims])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
