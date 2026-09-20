import React, { useEffect, useState } from 'react';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  signed?: boolean;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 1,
  duration = 200,
  signed = false,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const change = value - startValue;

    if (Math.abs(change) < 0.001) {
      setDisplayValue(value);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + change * easeProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = displayValue.toFixed(decimals);
  const sign = signed && displayValue > 0 ? '+' : '';
  const minWidthCh = `${(decimals + 3)}ch`;

  return (
    <span
      className={`inline-block font-mono tabular-nums text-right ${className || ''}`}
      style={{ minWidth: minWidthCh }}
    >
      {sign}{formatted}
    </span>
  );
};
