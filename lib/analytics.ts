import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears, format } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  totalCommissions: number;
  paidCommissions: number;
  approvedCommissions: number;
  pendingCommissions: number;
  rejectedCommissions: number;
  totalRevenue: number;
  averageCommission: number;
  conversionRate: number;
  approvalRate: number;
  rejectionRate: number;
}

export interface TrendData {
  label: string;
  value: number;
  date?: Date;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  percentageChange: number;
  trend: 'increase' | 'decrease' | 'no_change';
}

export interface TopPerformer {
  id: string;
  name: string;
  value: number;
  rank: number;
}

/**
 * Get predefined date ranges
 */
export function getDateRange(range: string): DateRange {
  const now = new Date();
  
  switch (range) {
    case 'last_7_days':
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      };
    
    case 'last_30_days':
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      };
    
    case 'last_90_days':
      return {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now
      };
    
    case 'this_month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    
    case 'this_quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now)
      };
    
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter)
      };
    
    case 'this_year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
    
    case 'last_year':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    
    default:
      // Default to last 30 days
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      };
  }
}

/**
 * Calculate comparison data between two values
 */
export function calculateComparison(current: number, previous: number): ComparisonData {
  const change = current - previous;
  const percentageChange = previous === 0 ? (current > 0 ? 100 : 0) : ((change / previous) * 100);
  
  let trend: 'increase' | 'decrease' | 'no_change';
  if (change > 0) trend = 'increase';
  else if (change < 0) trend = 'decrease';
  else trend = 'no_change';
  
  return {
    current,
    previous,
    change,
    percentageChange: Math.round(percentageChange * 100) / 100,
    trend
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend color class for Tailwind
 */
export function getTrendColor(trend: 'increase' | 'decrease' | 'no_change'): string {
  switch (trend) {
    case 'increase':
      return 'text-green-600';
    case 'decrease':
      return 'text-red-600';
    case 'no_change':
      return 'text-gray-600';
  }
}

/**
 * Get trend background color class for Tailwind
 */
export function getTrendBgColor(trend: 'increase' | 'decrease' | 'no_change'): string {
  switch (trend) {
    case 'increase':
      return 'bg-green-50';
    case 'decrease':
      return 'bg-red-50';
    case 'no_change':
      return 'bg-gray-50';
  }
}

/**
 * Group data by month
 */
export function groupByMonth<T extends { createdAt: Date }>(data: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  data.forEach(item => {
    const monthKey = format(new Date(item.createdAt), 'yyyy-MM');
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(item);
  });
  
  return grouped;
}

/**
 * Group data by quarter
 */
export function groupByQuarter<T extends { createdAt: Date }>(data: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  data.forEach(item => {
    const date = new Date(item.createdAt);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const quarterKey = `${date.getFullYear()}-Q${quarter}`;
    if (!grouped.has(quarterKey)) {
      grouped.set(quarterKey, []);
    }
    grouped.get(quarterKey)!.push(item);
  });
  
  return grouped;
}

/**
 * Group data by year
 */
export function groupByYear<T extends { createdAt: Date }>(data: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  data.forEach(item => {
    const yearKey = format(new Date(item.createdAt), 'yyyy');
    if (!grouped.has(yearKey)) {
      grouped.set(yearKey, []);
    }
    grouped.get(yearKey)!.push(item);
  });
  
  return grouped;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(converted: number, total: number): number {
  if (total === 0) return 0;
  return (converted / total) * 100;
}
