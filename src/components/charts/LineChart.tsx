import type { LineChartConfig, LineSeries, LineAnnotation } from '../../types';
import { ACCENT_HEX, ACCENT_HEX_BG } from './accentMap';

const W = 300;
const H = 160;
const PAD = { top: 20, right: 20, bottom: 20, left: 20 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function toSvgX(x: number, min: number, max: number) {
  return PAD.left + ((x - min) / (max - min)) * INNER_W;
}

function toSvgY(y: number, min: number, max: number) {
  // SVG y=0 is top, so we invert
  return PAD.top + (1 - (y - min) / (max - min)) * INNER_H;
}

function buildPolylinePoints(series: LineSeries, xMin: number, xMax: number, yMin: number, yMax: number) {
  return series.points
    .map(p => `${toSvgX(p.x, xMin, xMax)},${toSvgY(p.y, yMin, yMax)}`)
    .join(' ');
}

function buildAreaPoints(series: LineSeries, xMin: number, xMax: number, yMin: number, yMax: number) {
  const linePoints = buildPolylinePoints(series, xMin, xMax, yMin, yMax);
  const firstX = toSvgX(series.points[0].x, xMin, xMax);
  const lastX  = toSvgX(series.points[series.points.length - 1].x, xMin, xMax);
  const baseY  = toSvgY(yMin, yMin, yMax);
  return `${linePoints} ${lastX},${baseY} ${firstX},${baseY}`;
}

function SeriesPath({
  series, xMin, xMax, yMin, yMax, gradientId,
}: {
  series: LineSeries;
  xMin: number; xMax: number; yMin: number; yMax: number;
  gradientId: string;
}) {
  const hex = ACCENT_HEX[series.accentColor];
  const polyPoints = buildPolylinePoints(series, xMin, xMax, yMin, yMax);
  const areaPoints = buildAreaPoints(series, xMin, xMax, yMin, yMax);
  return (
    <g>
      {series.areaFill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={hex} stopOpacity="0.18" />
              <stop offset="100%" stopColor={hex} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={hex}
        strokeWidth={series.areaFill ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={series.dashed ? '5,3' : undefined}
      />
      {/* endpoint dot for single-series or emphasis */}
      {series.points.length > 0 && (
        <>
          <circle
            cx={toSvgX(series.points[0].x, xMin, xMax)}
            cy={toSvgY(series.points[0].y, yMin, yMax)}
            r="4"
            fill={hex}
          />
          <circle
            cx={toSvgX(series.points[series.points.length - 1].x, xMin, xMax)}
            cy={toSvgY(series.points[series.points.length - 1].y, yMin, yMax)}
            r="5"
            fill={hex}
          />
        </>
      )}
    </g>
  );
}

function AnnotationBand({
  annotation, xMin, xMax,
}: {
  annotation: LineAnnotation;
  xMin: number; xMax: number;
}) {
  const x1 = toSvgX(annotation.x, xMin, xMax);
  const spanPx = annotation.spanYears
    ? (annotation.spanYears / (xMax - xMin)) * INNER_W
    : 2;
  return (
    <g>
      <rect
        x={x1}
        y={PAD.top}
        width={spanPx}
        height={INNER_H}
        fill="rgba(255,255,255,0.04)"
        rx="2"
      />
      <text
        x={x1 + spanPx / 2}
        y={PAD.top - 4}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="8"
        fontWeight="600"
      >
        {annotation.label}
      </text>
    </g>
  );
}

export default function LineChart({ chart }: { chart: LineChartConfig }) {
  const { xAxis, yAxis, series, annotations, callout, note } = chart;

  const formatY = (v: number) =>
    yAxis.format === 'percent' ? `${v}%` : v.toLocaleString();

  return (
    <div className="w-full space-y-4">
      <p className="text-neutral-400 text-xs uppercase tracking-widest text-center mb-4">
        {chart.label}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Baseline */}
        <line
          x1={PAD.left} y1={PAD.top + INNER_H}
          x2={PAD.left + INNER_W} y2={PAD.top + INNER_H}
          stroke="#374151" strokeWidth="1"
        />

        {/* Annotations */}
        {annotations?.map(a => (
          <AnnotationBand key={a.label} annotation={a} xMin={xAxis.min} xMax={xAxis.max} />
        ))}

        {/* Series */}
        {series.map((s, i) => (
          <SeriesPath
            key={s.id}
            series={s}
            xMin={xAxis.min} xMax={xAxis.max}
            yMin={yAxis.min} yMax={yAxis.max}
            gradientId={`grad-${s.id}-${i}`}
          />
        ))}

        {/* Y-axis labels */}
        <text
          x={PAD.left - 2}
          y={PAD.top + INNER_H + 1}
          fill="#6b7280" fontSize="9" textAnchor="end"
        >
          {formatY(yAxis.min)}
        </text>
        <text
          x={PAD.left - 2}
          y={PAD.top + 6}
          fill="#9ca3af" fontSize="10" fontWeight="bold" textAnchor="end"
        >
          {formatY(yAxis.max)}
        </text>

        {/* X-axis labels */}
        <text
          x={PAD.left}
          y={PAD.top + INNER_H + 14}
          fill="#6b7280" fontSize="8"
        >
          {xAxis.min}
        </text>
        <text
          x={PAD.left + INNER_W}
          y={PAD.top + INNER_H + 14}
          fill="#6b7280" fontSize="8" textAnchor="end"
        >
          {xAxis.max}
        </text>

        {/* Legend */}
        {series.length > 1 && series.map((s, i) => {
          const lx = PAD.left + i * 100;
          const ly = 10;
          return (
            <g key={s.id}>
              <line
                x1={lx} y1={ly} x2={lx + 16} y2={ly}
                stroke={ACCENT_HEX[s.accentColor]}
                strokeWidth={s.areaFill ? 2.5 : 2}
                strokeDasharray={s.dashed ? '5,3' : undefined}
              />
              <text x={lx + 20} y={ly + 4} fill="#d1d5db" fontSize="8">
                {s.label}
              </text>
            </g>
          );
        })}

        {/* Auto endpoint label: show last Y value for single-series charts */}
        {series.length === 1 && (() => {
          const s = series[0];
          const lastPt = s.points[s.points.length - 1];
          const cx = toSvgX(lastPt.x, xAxis.min, xAxis.max);
          const cy = toSvgY(lastPt.y, yAxis.min, yAxis.max);
          return (
            <text
              x={cx + 6}
              y={cy + 4}
              fill={ACCENT_HEX_BG[s.accentColor]}
              fontSize="10"
              fontWeight="bold"
            >
              {formatY(lastPt.y)}
            </text>
          );
        })()}
      </svg>

      {note && (
        <p className="text-center text-neutral-400 text-xs italic px-4 leading-relaxed">
          {note}
        </p>
      )}
      {callout?.text && (
        <p className="text-center text-neutral-300 text-sm font-semibold italic">
          {callout.text}
        </p>
      )}
      {callout?.subtext && (
        <p className="text-neutral-500 text-xs italic text-center px-2 border-t border-neutral-700 pt-3">
          {callout.subtext}
        </p>
      )}
    </div>
  );
}
