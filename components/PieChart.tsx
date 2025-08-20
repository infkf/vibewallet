import * as React from 'react';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// ---------- Types ----------

export type PieDatum = { key: string; label: string; value: number; color: string };

// ---------- Pie Chart (SVG) ----------

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'L', cx, cy, 'Z'].join(' ');
}

export function PieChart({ data, size = 220 }: { data: PieDatum[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  return (
    <Svg width={size} height={size}>
      <G>
        {data.map((d, idx) => {
          const start = angle;
          const sliceAngle = total === 0 ? 0 : (d.value / total) * 360;
          const end = start + sliceAngle;
          angle = end;
          const path = describeArc(cx, cy, r, start, end);
          // Place label at the middle angle
          const mid = start + sliceAngle / 2;
          const labelPos = polarToCartesian(cx, cy, r * 0.6, mid);
          const percent = total === 0 ? 0 : (d.value / total) * 100;
          return (
            <G key={d.key}>
              <Path d={path} fill={d.color} />
              {percent >= 6 && (
                <SvgText x={labelPos.x} y={labelPos.y} fontSize={12} textAnchor="middle" fill="#fff">
                  {`${Math.round(percent)}%`}
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
}
