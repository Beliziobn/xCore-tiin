import React, { useEffect, useRef } from 'react';

interface SectionShaderProps {
  id?: string;
  variant?: 'coral' | 'subtle' | 'amber';
  className?: string;
}

export const SectionShader: React.FC<SectionShaderProps> = ({
  id = 'headerShader',
  variant = 'coral',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let destroyed = false;
    let cleanupShader: (() => void) | null = null;

    const PREFERS_REDUCED_MOTION =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    async function initShader() {
      if (destroyed || !mountRef.current) return;

      // High-fidelity Canvas 2D shader simulation
      // (DotGrid density 46, twinkling, ChromaFlow cursor trail, LinearGradient coral, Ripples)
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      let width = 0;
      let height = 0;

      // Mouse tracking for ChromaFlow trail
      const mouse = { x: -1000, y: -1000, active: false };
      const trailPoints: Array<{ x: number; y: number; age: number; maxAge: number; radius: number }> = [];
      const ripples: Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }> = [];

      const handleResize = () => {
        if (!mountRef.current || !canvas) return;
        const rect = mountRef.current.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const handlePointerMove = (e: PointerEvent) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;

        // Add ChromaFlow trail point
        trailPoints.push({
          x: mouse.x,
          y: mouse.y,
          age: 0,
          maxAge: 45,
          radius: 90,
        });
        if (trailPoints.length > 50) trailPoints.shift();
      };

      const handlePointerLeave = () => {
        mouse.active = false;
      };

      const handleClick = (e: MouseEvent) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        ripples.push({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          radius: 10,
          maxRadius: 180,
          alpha: 0.8,
        });
      };

      const parentSection = mountRef.current.parentElement;
      if (parentSection) {
        parentSection.addEventListener('pointermove', handlePointerMove as any, { passive: true });
        parentSection.addEventListener('pointerleave', handlePointerLeave as any, { passive: true });
        parentSection.addEventListener('click', handleClick as any, { passive: true });
      }

      let time = 0;

      const render = () => {
        if (destroyed || !ctx) return;
        time += 0.02;

        ctx.clearRect(0, 0, width, height);

        if (variant === 'coral') {
          // 1. Base LinearGradient: #ff6a4a (top-left) to #c93f26 (bottom-right)
          const baseGrad = ctx.createLinearGradient(0, 0, width, height);
          baseGrad.addColorStop(0, '#ff6a4a');
          baseGrad.addColorStop(0.5, '#f2593c');
          baseGrad.addColorStop(1, '#c93f26');
          ctx.fillStyle = baseGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Cursor Ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rip = ripples[i];
          rip.radius += 2.5;
          rip.alpha *= 0.94;
          if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
            ripples.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle =
            variant === 'coral'
              ? `rgba(255, 255, 255, ${rip.alpha * 0.45})`
              : variant === 'amber'
              ? `rgba(245, 158, 11, ${rip.alpha * 0.45})`
              : `rgba(247, 81, 66, ${rip.alpha * 0.35})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // 3. Update trail points
        for (let i = trailPoints.length - 1; i >= 0; i--) {
          const pt = trailPoints[i];
          pt.age += 1;
          if (pt.age >= pt.maxAge) {
            trailPoints.splice(i, 1);
          }
        }

        // 4. DotGrid with ChromaFlow mask & twinkling
        const gridSpacing = 24;
        const cols = Math.ceil(width / gridSpacing) + 1;
        const rows = Math.ceil(height / gridSpacing) + 1;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dx = c * gridSpacing;
            const dy = r * gridSpacing;

            // Twinkle factor using harmonic sin
            const twinkle = Math.sin(time * 2 + c * 0.5 + r * 0.7) * 0.5 + 0.5;
            let baseSize = variant === 'coral' ? (0.8 + twinkle * 0.4) : (1.15 + twinkle * 0.45);
            let glowAlpha = variant === 'coral' ? (0.12 + twinkle * 0.08) : (0.16 + twinkle * 0.1);

            // Calculate distance to cursor & trail points (ChromaFlow)
            let trailInfluence = 0;
            if (mouse.active) {
              const distMouse = Math.hypot(dx - mouse.x, dy - mouse.y);
              if (distMouse < 130) {
                trailInfluence = Math.max(trailInfluence, (1 - distMouse / 130) * 1.1);
              }
            }
            for (let i = 0; i < trailPoints.length; i++) {
              const pt = trailPoints[i];
              const distPt = Math.hypot(dx - pt.x, dy - pt.y);
              if (distPt < pt.radius) {
                const lifeRatio = 1 - pt.age / pt.maxAge;
                const pointInf = (1 - distPt / pt.radius) * lifeRatio * 0.9;
                if (pointInf > trailInfluence) trailInfluence = pointInf;
              }
            }

            // If inside cursor flow, illuminate with warm glow trail (#ffd9c4 -> #ffffff)
            if (trailInfluence > 0.01) {
              baseSize += trailInfluence * 2.6;
              glowAlpha = Math.min(1, glowAlpha + trailInfluence * 0.85);

              // Glow circle
              ctx.beginPath();
              ctx.arc(dx, dy, baseSize * 1.8, 0, Math.PI * 2);
              ctx.fillStyle =
                variant === 'coral'
                  ? `rgba(255, 217, 196, ${trailInfluence * 0.5})`
                  : variant === 'amber'
                  ? `rgba(253, 230, 138, ${trailInfluence * 0.55})`
                  : `rgba(247, 81, 66, ${trailInfluence * 0.35})`;
              ctx.fill();

              // Bright core dot
              ctx.beginPath();
              ctx.arc(dx, dy, Math.max(0.5, baseSize), 0, Math.PI * 2);
              ctx.fillStyle =
                variant === 'coral'
                  ? `rgba(255, 255, 255, ${glowAlpha})`
                  : variant === 'amber'
                  ? `rgba(245, 158, 11, ${Math.min(0.95, glowAlpha * 1.35)})`
                  : `rgba(247, 81, 66, ${Math.min(0.9, glowAlpha)})`;
              ctx.fill();
            } else {
              // Idle dot
              ctx.beginPath();
              ctx.arc(dx, dy, baseSize, 0, Math.PI * 2);
              ctx.fillStyle =
                variant === 'coral'
                  ? `rgba(255, 255, 255, ${glowAlpha})`
                  : `rgba(71, 85, 105, ${glowAlpha})`;
              ctx.fill();
            }
          }
        }

        // 5. Subtle ambient glow following the cursor
        if (mouse.active) {
          const auraGrad = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 180);
          if (variant === 'coral') {
            auraGrad.addColorStop(0, 'rgba(255, 225, 205, 0.18)');
            auraGrad.addColorStop(0.5, 'rgba(255, 180, 150, 0.08)');
            auraGrad.addColorStop(1, 'rgba(242, 89, 60, 0)');
          } else if (variant === 'amber') {
            auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.13)');
            auraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.04)');
            auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          } else {
            auraGrad.addColorStop(0, 'rgba(247, 81, 66, 0.09)');
            auraGrad.addColorStop(0.6, 'rgba(247, 81, 66, 0.02)');
            auraGrad.addColorStop(1, 'rgba(247, 81, 66, 0)');
          }
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, width, height);
        }

        if (!PREFERS_REDUCED_MOTION) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      if (!PREFERS_REDUCED_MOTION) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        render();
      }

      cleanupShader = () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (parentSection) {
          parentSection.removeEventListener('pointermove', handlePointerMove as any);
          parentSection.removeEventListener('pointerleave', handlePointerLeave as any);
          parentSection.removeEventListener('click', handleClick as any);
        }
      };
    }

    initShader();

    return () => {
      destroyed = true;
      if (cleanupShader) cleanupShader();
    };
  }, [variant]);

  return (
    <div
      id={id}
      ref={mountRef}
      className={`header-shader ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

