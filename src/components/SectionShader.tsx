import React, { useEffect, useRef } from 'react';

interface SectionShaderProps {
  id?: string;
  variant?: 'coral' | 'subtle' | 'amber';
  className?: string;
}

/**
 * Lightweight GPU-composited dot-grid & subtle pointer aura background.
 * Replaces the legacy 60fps Canvas 2D loop (which executed thousands of per-frame
 * arc draws & Math.hypot calls) to keep idle CPU usage at 0%.
 */
export const SectionShader: React.FC<SectionShaderProps> = React.memo(({
  id = 'headerShader',
  variant = 'coral',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const parentSection = mountRef.current?.parentElement;
    const auraEl = auraRef.current;
    if (!parentSection || !auraEl) return;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = parentSection.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (auraEl) {
          auraEl.style.opacity = '1';
          auraEl.style.transform = `translate3d(${lastX - 180}px, ${lastY - 180}px, 0)`;
        }
      });
    };

    const handlePointerLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (auraEl) {
        auraEl.style.opacity = '0';
      }
    };

    parentSection.addEventListener('pointermove', handlePointerMove, { passive: true });
    parentSection.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      parentSection.removeEventListener('pointermove', handlePointerMove);
      parentSection.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [variant]);

  const baseStyle: React.CSSProperties =
    variant === 'coral'
      ? {
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px), linear-gradient(135deg, #ff6a4a 0%, #f2593c 50%, #c93f26 100%)',
          backgroundSize: '24px 24px, 100% 100%',
        }
      : variant === 'amber'
      ? {
          backgroundImage: 'radial-gradient(rgba(71, 85, 105, 0.22) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }
      : {
          backgroundImage: 'radial-gradient(rgba(71, 85, 105, 0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        };

  const auraGradient =
    variant === 'coral'
      ? 'radial-gradient(circle, rgba(255,225,205,0.22) 0%, rgba(255,180,150,0.08) 50%, rgba(242,89,60,0) 70%)'
      : variant === 'amber'
      ? 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0.04) 55%, rgba(245,158,11,0) 70%)'
      : 'radial-gradient(circle, rgba(247,81,66,0.11) 0%, rgba(247,81,66,0.03) 55%, rgba(247,81,66,0) 70%)';

  return (
    <div
      id={id}
      ref={mountRef}
      className={`header-shader overflow-hidden ${className}`}
      style={baseStyle}
      aria-hidden="true"
    >
      <div
        ref={auraRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 360,
          height: 360,
          borderRadius: '9999px',
          background: auraGradient,
          opacity: 0,
          transition: 'opacity 220ms ease-out',
          willChange: 'transform, opacity',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

SectionShader.displayName = 'SectionShader';
