import React from 'react';
import type { Plan, Point } from '../types/plan';

interface PlanCanvasProps {
  plan: Plan;
  width?: number;
  height?: number;
}

const PlanCanvas: React.FC<PlanCanvasProps> = ({ plan, width = 800, height = 500 }) => {
  if (!plan || !plan.rooms || plan.rooms.length === 0) {
    return null;
  }

  let maxX = 0;
  let maxY = 0;
  plan.rooms.forEach((r) => {
    maxX = Math.max(maxX, r.p1[0], r.p2[0]);
    maxY = Math.max(maxY, r.p1[1], r.p2[1]);
  });
  maxX = Math.max(maxX, 1);
  maxY = Math.max(maxY, 1);

  const padding = 20;
  const scaleX = (width - padding * 2) / maxX;
  const scaleY = (height - padding * 2) / maxY;
  const scale = Math.min(scaleX, scaleY);

  const toSvg = (p: Point) => [padding + p[0] * scale, padding + p[1] * scale];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-xl border border-gray-200">
      <rect x={0} y={0} width={width} height={height} fill="#f8fafc" />
      {plan.rooms.map((room, idx) => {
        const [x1, y1] = toSvg(room.p1);
        const [x2, y2] = toSvg(room.p2);
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
        return (
          <g key={idx}>
            <rect x={x} y={y} width={w} height={h} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1.5} />
            <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#1f2937">
              {room.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default PlanCanvas;
