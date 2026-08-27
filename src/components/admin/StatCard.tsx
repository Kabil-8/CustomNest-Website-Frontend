import React from 'react';
import { CountUp } from '../reactbits/CountUp';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  change?: string;
  /** When true the change badge renders in green, otherwise red */
  isPositive?: boolean;
  /** When true appends "vs last month" after the change text */
  showVsMonth?: boolean;
}

export function StatCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  change,
  isPositive = true,
  showVsMonth = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-line shadow-soft flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
          {label}
        </span>
        <div className="font-display text-2xl sm:text-3xl text-charcoal font-bold">
          <CountUp end={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        {change && (
          <span
            className={`text-[0.7rem] font-bold mt-1 inline-block ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {change}{showVsMonth ? ' vs last month' : ''}
          </span>
        )}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm shrink-0">
        <Icon size={22} />
      </div>
    </div>
  );
}
