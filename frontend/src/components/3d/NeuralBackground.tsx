import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../lib/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
}

export const NeuralBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });
  const theme = useAppStore((state) => state.theme);
  const showParticles = useAppStore((state) => state.showParticles);

  useEffect(() => {
    if (!showParticles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const isDark = theme === 'dark';
    const particleColors = isDark
      ? ['#00F2FE', '#6366F1', '#A855F7', '#38BDF8']
      : ['#0284C7', '#4F46E5', '#7C3AED', '#2563EB'];
    const connectionColor = isDark ? '99, 102, 241' : '79, 70, 229';

    // Particle density: slightly lighter for a clean, non-distracting look
    const particleCount = Math.min(70, Math.max(35, Math.floor((width * height) / 22000)));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      const baseRadius = Math.random() * 1.5 + 1.0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: baseRadius,
        baseRadius,
        color,
        alpha: isDark ? Math.random() * 0.5 + 0.3 : Math.random() * 0.35 + 0.2,
      });
    }

    const handlePointerMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseleave', handlePointerLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const maxConnectDist = 110;
      const mouseMaxDist = 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseMaxDist) {
            const pullForce = (1 - dist / mouseMaxDist) * 0.025;
            p.x += dx * pullForce;
            p.y += dy * pullForce;
            p.radius = p.baseRadius * (1 + (1 - dist / mouseMaxDist) * 0.8);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.strokeStyle = isDark
              ? `rgba(0, 242, 254, ${(1 - dist / mouseMaxDist) * 0.4})`
              : `rgba(2, 132, 199, ${(1 - dist / mouseMaxDist) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            p.radius = p.baseRadius;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const opacity = (1 - dist / maxConnectDist) * (isDark ? 0.22 : 0.12);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [theme, showParticles]);

  if (!showParticles) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 ${
        theme === 'dark' ? 'opacity-85' : 'opacity-35'
      }`}
      aria-hidden="true"
    />
  );
};
