import React, { useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // Tilt degrees max (default 6)
  glare?: boolean;
  borderBeam?: boolean;
}

export const Card3DTilt: React.FC<Card3DTiltProps> = ({
  children,
  className,
  intensity = 5,
  glare = true,
  borderBeam = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    // Invert Y for natural perspective tilt
    setRotateX(-percentY * intensity);
    setRotateY(percentX * intensity);

    if (glare) {
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.15,
      });
    }
  };

  const handlePointerLeave = () => {
    setRotateX(0);
    setRotateY(0);
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative rounded-3xl transition-shadow duration-300',
        borderBeam && 'border-beam-container',
        className
      )}
    >
      {/* Dynamic Specular Glare Layer */}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.25) 0%, transparent 65%)`,
            opacity: glarePos.opacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* Card Content Container */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
};
