import React from 'react';
import { Check, X } from 'lucide-react';
import type { OrderStatus } from '../types';
import { classNames } from '../lib/utils';

const STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

interface OrderTimelineProps {
  status?: OrderStatus;
  currentStatus?: OrderStatus;
}

export function OrderTimeline({ status, currentStatus }: OrderTimelineProps) {
  const activeStatus = (status || currentStatus || 'Pending') as OrderStatus;

  if (activeStatus === 'Cancelled' || activeStatus === 'cancelled' as OrderStatus) {
    return (
      <div className="flex items-center gap-3 bg-danger/10 text-danger rounded-xl px-4 py-3">
        <X size={18} />
        <span className="text-sm font-semibold">This order has been cancelled.</span>
      </div>
    );
  }

  // Normalize status string case
  const normalized = activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1).toLowerCase();
  const currentIndex = STEPS.findIndex((step) => step.toLowerCase() === activeStatus.toLowerCase());

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step} className={classNames('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className={classNames(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  done ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-line text-muted'
                )}
              >
                {done ? <Check size={14} /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <span className={classNames('text-[0.68rem] font-medium text-center w-20', done ? 'text-charcoal' : 'text-muted')}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={classNames('h-[2px] flex-1 mx-1 -mt-5', i < currentIndex ? 'bg-rose-500' : 'bg-line')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
