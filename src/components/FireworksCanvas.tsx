import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  flicker: boolean;
}

interface CatBurst {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  color: string;
  rotation: number;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  isCatRocket: boolean;
}

const PALETTE = [
  '#FF6B8B', // Vivid Kawaii Pink
  '#60A5FA', // Vivid Sky Blue
  '#FFE36E', // Bright Retro Yellow / Gold
  '#4DE1C1', // Bright Mint
  '#C084FC', // Vivid Lavender Purple
  '#FFA07A', // Warm Coral
  '#FFFFFF', // Gleaming Star White
];

export interface FireworksCanvasProps {
  active?: boolean;
  mode?: 'foreground' | 'background';
  spawnDuration?: number; // Duration to keep spawning in ms (e.g. 3800 for foreground), 0 or undefined for infinite
  className?: string;
  zIndex?: number;
}

export const FireworksCanvas: React.FC<FireworksCanvasProps> = ({
  active = true,
  mode = 'background',
  spawnDuration = mode === 'foreground' ? 3800 : 0,
  className = '',
  zIndex = mode === 'foreground' ? 60 : 52,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];
    const catBursts: CatBurst[] = [];

    const startTime = Date.now();
    let lastLaunchTime = Date.now();
    let rocketCount = 0;

    const createRocket = (forceCat?: boolean) => {
      // Check if spawn duration has elapsed
      if (spawnDuration > 0 && Date.now() - startTime > spawnDuration) {
        return;
      }

      let x: number;
      let targetY: number;

      if (mode === 'background') {
        // Background rockets launch across full width or sides for visibility around the modal
        const onSide = Math.random() > 0.35;
        if (onSide) {
          x = Math.random() > 0.5 ? width * (0.05 + Math.random() * 0.22) : width * (0.73 + Math.random() * 0.22);
        } else {
          x = width * (0.2 + Math.random() * 0.6);
        }
        targetY = height * (0.12 + Math.random() * 0.45);
      } else {
        // Foreground rockets launch directly across the screen and center for grand celebration
        x = width * (0.12 + Math.random() * 0.76);
        targetY = height * (0.18 + Math.random() * 0.4);
      }

      const speed = 13 + Math.random() * 4.5;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.32;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const isCat = forceCat !== undefined ? forceCat : (rocketCount % 2 === 0 || Math.random() > 0.45);

      rockets.push({
        x,
        y: height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        targetY,
        color,
        trail: [],
        isCatRocket: isCat,
      });
      rocketCount++;
    };

    const explode = (x: number, y: number, color: string, isCat: boolean) => {
      if (isCat) {
        // Cat Face Fireworks! (NO AUDIO - VISUAL ONLY)
        catBursts.push({
          x,
          y,
          scale: mode === 'foreground' ? 0.3 : 0.25,
          alpha: 1,
          color,
          rotation: (Math.random() - 0.5) * 0.15,
        });

        // Form outline of cute cat head with sparkling particles
        const count = mode === 'foreground' ? 56 : 46;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 2;
          let r = 42 + Math.sin(t * 5) * 2;

          // Cat ears deformation on top
          const isLeftEar = t >= 1.9 && t <= 2.6;
          const isRightEar = t >= 0.5 && t <= 1.2;

          if (isLeftEar) {
            r += Math.sin(((t - 1.9) / 0.7) * Math.PI) * 30;
          } else if (isRightEar) {
            r += Math.sin(((t - 0.5) / 0.7) * Math.PI) * 30;
          }

          const px = Math.cos(t) * r;
          const py = -Math.sin(t) * r;
          const speed = (mode === 'foreground' ? 2.6 : 2.2) + Math.random() * 0.7;

          particles.push({
            x,
            y,
            vx: (px / r) * speed,
            vy: (py / r) * speed,
            color: Math.random() > 0.3 ? color : '#FFE36E',
            alpha: 1,
            decay: 0.012 + Math.random() * 0.007,
            size: mode === 'foreground' ? 3.8 : 3.2,
            gravity: 0.035,
            flicker: true,
          });
        }

        // Whiskers and glitter sparks shooting outward
        const whiskerCount = mode === 'foreground' ? 28 : 20;
        for (let j = 0; j < whiskerCount; j++) {
          const angle = (Math.random() - 0.5) * Math.PI * 2;
          const spd = 3.2 + Math.random() * 3.8;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            alpha: 1,
            decay: 0.016 + Math.random() * 0.01,
            size: 3,
            gravity: 0.045,
            flicker: true,
          });
        }
      } else {
        // Grand Radial Sparkle Star Fireworks (NO AUDIO)
        const pCount = (mode === 'foreground' ? 75 : 55) + Math.floor(Math.random() * 25);
        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (mode === 'foreground' ? 3 : 2.4) + Math.random() * 5.6;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: Math.random() > 0.35 ? color : PALETTE[Math.floor(Math.random() * PALETTE.length)],
            alpha: 1,
            decay: 0.011 + Math.random() * 0.01,
            size: (mode === 'foreground' ? 3.5 : 2.8) + Math.random() * 2,
            gravity: 0.055,
            flicker: Math.random() > 0.25,
          });
        }
      }
    };

    // Initial volley
    if (mode === 'foreground') {
      createRocket(true); // Cat rocket first
      setTimeout(() => createRocket(false), 220);
      setTimeout(() => createRocket(true), 550);
      setTimeout(() => createRocket(false), 900);
    } else {
      createRocket(false);
      setTimeout(() => createRocket(true), 350);
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();
      const isStillSpawning = spawnDuration <= 0 || now - startTime < spawnDuration;
      const launchInterval = mode === 'foreground' ? 520 : 750;
      const maxConcurrent = mode === 'foreground' ? 6 : 4;

      if (isStillSpawning && now - lastLaunchTime > launchInterval && rockets.length < maxConcurrent) {
        createRocket();
        lastLaunchTime = now;
      }

      // If finished spawning and all items completed, clear and finish
      if (!isStillSpawning && rockets.length === 0 && particles.length === 0 && catBursts.length === 0) {
        return;
      }

      // 1. Update & Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y, alpha: 0.85 });
        if (r.trail.length > 9) r.trail.shift();

        // Draw rocket spark trail
        for (let tIdx = 0; tIdx < r.trail.length; tIdx++) {
          const pt = r.trail[tIdx];
          const trAlpha = (tIdx / r.trail.length) * 0.7;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 235, 170, ${trAlpha})`;
          ctx.fill();
        }

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.045; // slight gravity deceleration

        // Rocket head spark
        ctx.beginPath();
        ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (r.y <= r.targetY || r.vy >= -1) {
          explode(r.x, r.y, r.color, r.isCatRocket);
          rockets.splice(i, 1);
        }
      }

      // 2. Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.975;
        p.vy *= 0.975;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const currentAlpha = p.flicker ? p.alpha * (0.65 + Math.random() * 0.35) : p.alpha;
        ctx.save();
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Update & Draw Cat Bursts (Kawaii expanding glowing cat face in the sky)
      for (let i = catBursts.length - 1; i >= 0; i--) {
        const cb = catBursts[i];
        cb.scale += 0.024;
        cb.alpha -= 0.016;

        if (cb.alpha <= 0 || cb.scale > 1.45) {
          catBursts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(cb.x, cb.y);
        ctx.rotate(cb.rotation);
        ctx.scale(cb.scale, cb.scale);
        ctx.globalAlpha = Math.max(0, cb.alpha);

        // Cat Head
        ctx.fillStyle = cb.color;
        ctx.strokeStyle = '#2A2350';
        ctx.lineWidth = 3.5;

        // Base head rounded ellipse
        ctx.beginPath();
        ctx.ellipse(0, 4, 34, 27, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Left Ear
        ctx.beginPath();
        ctx.moveTo(-25, -10);
        ctx.lineTo(-34, -36);
        ctx.lineTo(-10, -23);
        ctx.closePath();
        ctx.fillStyle = cb.color;
        ctx.fill();
        ctx.stroke();

        // Right Ear
        ctx.beginPath();
        ctx.moveTo(10, -23);
        ctx.lineTo(34, -36);
        ctx.lineTo(25, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner ears
        ctx.fillStyle = '#FFE36E';
        ctx.beginPath();
        ctx.moveTo(-23, -12);
        ctx.lineTo(-30, -30);
        ctx.lineTo(-13, -21);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(13, -21);
        ctx.lineTo(30, -30);
        ctx.lineTo(23, -12);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#2A2350';
        ctx.beginPath();
        ctx.ellipse(-12, 2, 4.5, 6.5, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 2, 4.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye star sparkles
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-13, 0, 2.2, 0, Math.PI * 2);
        ctx.arc(11, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Pink blush cheeks
        ctx.fillStyle = 'rgba(255, 143, 163, 0.75)';
        ctx.beginPath();
        ctx.ellipse(-19, 9, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(19, 9, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose and mouth
        ctx.strokeStyle = '#2A2350';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 7, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FF8FA3';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-5.5, 10.5);
        ctx.quadraticCurveTo(-2.8, 14, 0, 10.5);
        ctx.quadraticCurveTo(2.8, 14, 5.5, 10.5);
        ctx.stroke();

        // Whiskers
        ctx.beginPath();
        ctx.moveTo(-23, 6);
        ctx.lineTo(-40, 4);
        ctx.moveTo(-23, 11);
        ctx.lineTo(-38, 13);

        ctx.moveTo(23, 6);
        ctx.lineTo(40, 4);
        ctx.moveTo(23, 11);
        ctx.lineTo(38, 13);
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, mode, spawnDuration]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex, width: '100vw', height: '100vh' }}
    />
  );
};
