import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { SkillGap } from '../../lib/schemas';
import { formatLevel } from '../../lib/format';

interface SkillRadarChartProps {
  gaps: SkillGap[];
  maxDisplay?: number;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border-strong)] shadow-xl text-xs space-y-1 font-mono">
        <div className="font-bold text-[var(--text)] font-display text-sm">{data.fullSkill}</div>
        <div className="flex items-center justify-between gap-4 text-[var(--accent-indigo)]">
          <span>Your Level:</span>
          <span className="font-bold">{formatLevel(data.Current)} / 5.0</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[var(--accent-mint)]">
          <span>Benchmark:</span>
          <span className="font-bold">{formatLevel(data.Required)} / 5.0</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[var(--accent-coral)] pt-1 border-t border-[var(--border-subtle)]">
          <span>Net Gap:</span>
          <span className="font-bold">{formatLevel(data.Gap)} pts</span>
        </div>
      </div>
    );
  }
  return null;
};

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  gaps,
  maxDisplay = 8,
  height = 320,
}) => {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elev-1)] rounded-3xl border border-[var(--border)]">
        No skill data available for radar comparison
      </div>
    );
  }

  // Take the most critical skills up to maxDisplay
  const chartData = gaps.slice(0, maxDisplay).map((g) => {
    // Truncate long skill names for clean axis display
    const shortName = g.skill.length > 14 ? `${g.skill.substring(0, 12)}...` : g.skill;
    return {
      skill: shortName,
      fullSkill: g.skill,
      Current: g.current_level,
      Required: g.required_level,
      Gap: g.gap,
    };
  });

  return (
    <div className="w-full flex flex-col p-5 rounded-3xl bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold font-display text-[var(--text)]">
          Skill Competency Radar
        </h4>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Scale: 0.0 — 5.0
        </span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 5]}
              tick={{ fill: 'var(--text-faint)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                paddingTop: '8px',
              }}
            />
            <Radar
              name="Benchmark (Target)"
              dataKey="Required"
              stroke="var(--accent-mint)"
              fill="var(--accent-mint)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Current Level (You)"
              dataKey="Current"
              stroke="var(--accent-indigo)"
              fill="var(--accent-indigo)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
