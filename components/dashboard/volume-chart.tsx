"use client";

import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import type { StaffVolumePoint } from "@/lib/dashboard";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const created =
    payload.find((item) => item.dataKey === "created")?.value ?? 0;
  const resolved =
    payload.find((item) => item.dataKey === "resolved")?.value ?? 0;

  return (
    <div className="border-line bg-surface-solid rounded-[9px] border px-2.5 py-2 shadow-[var(--shadow-pop)]">
      <p className="text-label-3 m-0 text-[10px] font-medium tracking-[0.05em] uppercase">
        {label}
      </p>
      <p className="num text-label-2 m-0 mt-1 text-[11px]">
        <span className="bg-accent mr-1 inline-block size-1.5 rounded-full" />
        {created} created
      </p>
      <p className="num text-label-2 m-0 text-[11px]">
        <span className="bg-success mr-1 inline-block size-1.5 rounded-full" />
        {resolved} resolved
      </p>
    </div>
  );
}

export function VolumeChart({
  data,
  height = 190,
  minTickGap = 16,
}: {
  data: StaffVolumePoint[];
  height?: number;
  minTickGap?: number;
}) {
  const reduced = useReducedMotion();
  const animationDuration = reduced ? 0 : 280;

  return (
    <div className="w-full px-1 pt-3 pb-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 12, left: 12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="created-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="resolved-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--separator)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--label-3)", fontSize: 10.5 }}
            minTickGap={minTickGap}
            dy={6}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--line)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="var(--accent)"
            strokeWidth={1.8}
            fill="url(#created-fill)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            animationDuration={animationDuration}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="var(--success)"
            strokeWidth={1.8}
            fill="url(#resolved-fill)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            animationDuration={animationDuration}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="text-label-3 flex items-center gap-3 text-[10.5px]">
      <span className="flex items-center gap-1.5">
        <span className="bg-accent size-1.5 rounded-full" /> Created
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-success size-1.5 rounded-full" /> Resolved
      </span>
    </div>
  );
}
