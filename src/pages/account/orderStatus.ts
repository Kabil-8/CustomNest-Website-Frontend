import type { OrderStatus } from '../../types';

export function statusTone(status: OrderStatus): 'rose' | 'charcoal' | 'success' | 'warning' | 'ivory' {
  switch (status) {
    case 'Delivered':
      return 'success';
    case 'Cancelled':
      return 'warning';
    case 'Pending':
      return 'ivory';
    default:
      return 'rose';
  }
}
