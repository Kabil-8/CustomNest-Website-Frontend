import React, { useEffect, useRef } from 'react';

interface ThreadParticlesProps {
  className?: string;
}

export function ThreadParticles({ className = '' }: ThreadParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing yarn fibers and golden ambient sparks
    const particleCount = Math.min(Math.floor(width / 30), 45);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.3 - 0.1,
      alpha: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      color: Math.random() > 0.4 ? 'rgba(192, 107, 92,' : 'rgba(231, 179, 168,',
    }));

    let waveOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle animated stitch/thread wave in background
      waveOffset += 0.008;

      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.strokeStyle = 'rgba(162, 78, 66, 0.12)';

      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const y = Math.sin(x * 0.005 + waveOffset) * 24 + Math.cos(x * 0.002 + waveOffset * 0.5) * 15 + height * 0.65;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second offset thread wave
      ctx.beginPath();
      ctx.setLineDash([12, 16]);
      ctx.strokeStyle = 'rgba(217, 143, 130, 0.14)';
      for (let x = 0; x <= width; x += 10) {
        const y = Math.cos(x * 0.006 - waveOffset * 0.8) * 30 + Math.sin(x * 0.003 + waveOffset) * 12 + height * 0.45;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Draw floating yarn fiber particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulse) * 0.2);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
