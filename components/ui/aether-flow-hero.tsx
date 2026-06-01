"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ');

export function ParticleCanvas({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

    class Particle {
      x: number; y: number;
      directionX: number; directionY: number;
      size: number; color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x; this.y = y;
        this.directionX = directionX; this.directionY = directionY;
        this.size = size; this.color = color;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx!.fillStyle = this.color;
        ctx!.fill();
      }

      update() {
        if (this.x > canvas!.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas!.height || this.y < 0) this.directionY = -this.directionY;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 5;
            this.y -= forceDirectionY * force * 5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particles = [];
      const numberOfParticles = (canvas!.height * canvas!.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (canvas!.width - size * 4) + size * 2;
        const y = Math.random() * (canvas!.height - size * 4) + size * 2;
        const directionX = Math.random() * 0.4 - 0.2;
        const directionY = Math.random() * 0.4 - 0.2;
        particles.push(new Particle(x, y, directionX, directionY, size, 'rgba(232,84,25,0.75)'));
      }
    }

    const resizeCanvas = () => {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      init();
    };

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance =
            (particles[a].x - particles[b].x) ** 2 +
            (particles[a].y - particles[b].y) ** 2;

          if (distance < (canvas!.width / 7) * (canvas!.height / 7)) {
            const opacityValue = 1 - distance / 20000;

            if (mouse.x !== null && mouse.y !== null) {
              const dx = particles[a].x - mouse.x;
              const dy = particles[a].y - mouse.y;
              const distMouse = Math.sqrt(dx * dx + dy * dy);
              ctx!.strokeStyle = distMouse < mouse.radius
                ? `rgba(255,120,60,${opacityValue})`
                : `rgba(232,84,25,${opacityValue * 0.5})`;
            } else {
              ctx!.strokeStyle = `rgba(232,84,25,${opacityValue * 0.5})`;
            }

            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx!.fillStyle = 'rgba(0,0,0,0.15)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach(p => p.update());
      connect();
    };

    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseOut = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute top-0 left-0 w-full h-full', className)}
    />
  );
}

const AetherFlowHero = () => {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.2 + 0.5, duration: 0.8, ease: 'easeInOut' as const },
    }),
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <ParticleCanvas />

      <div className="relative z-10 text-center p-6">
        <motion.div
          custom={0} variants={fadeUpVariants} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6 backdrop-blur-sm"
        >
          <Zap className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-gray-200">Dynamic Rendering Engine</span>
        </motion.div>

        <motion.h1
          custom={1} variants={fadeUpVariants} initial="hidden" animate="visible"
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
        >
          Aether Flow
        </motion.h1>

        <motion.p
          custom={2} variants={fadeUpVariants} initial="hidden" animate="visible"
          className="max-w-2xl mx-auto text-lg text-gray-400 mb-10"
        >
          An intelligent, adaptive framework for creating fluid digital experiences that feel alive and respond to user interaction in real-time.
        </motion.p>

        <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible">
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2 mx-auto">
            Explore the Engine
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AetherFlowHero;
