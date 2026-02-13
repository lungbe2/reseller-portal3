'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, DollarSign, CheckCircle, Building2, FileDown, BarChart3 } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { formatCurrency, formatPercentage, getTrendColor, getTrendBgColor } from '@/lib/analytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalResellers: number;
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
  };
  comparisons: {
    revenue: {
      current: number;
      previous: number;
      change: number;
      percentageChange: number;
      trend: 'increase' | 'decrease' | 'no_change';
    };
    customers: {
      current: number;
      previous: number;
      change: number;
      percentageChange: number;
      trend: 'increase' | 'decrease' | 'no_change';
    };
    commissions: {
      current: number;
      previous: number;
      change: number;
      percentageChange: number;
      trend: 'increase' | 'decrease' | 'no_change';
    };
  };
  trends: {
    commissionTrend: Array<{
      label: string;
      value: number;
      count: number;
    }>;
    customersByStatus: {
      active: number;
      lead: number;
      no_deal: number;
    };
    commissionsByStatus: {
      paid: number;
      approved: number;
      pending: number;
      rejected: number;
    };
  };
  topPerformers: {
    resellers: Array<{
      id: string;
      name: string;
      value: number;
      customerCount: number;
      rank: number;
    }>;
    customers: Array<{
      id: string;
      name: string;
      resellerName: string;
      value: number;
      rank: number;
    }>;
  };
}

export default function AdminAnalyticsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/admin?range=${dateRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/export/customers`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
            <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              {t('common.try_again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
            <p className="text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('analytics.no_data')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const lineChartData = {
    labels: data.trends.commissionTrend.map((d) => d.label),
    datasets: [
      {
        label: t('analytics.total_revenue'),
        data: data.trends.commissionTrend.map((d) => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const customerStatusData = {
    labels: [
      t('common.active'),
      t('common.lead'),
      t('common.no_deal')
    ],
    datasets: [
      {
        data: [
          data.trends.customersByStatus.active,
          data.trends.customersByStatus.lead,
          data.trends.customersByStatus.no_deal
        ],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ]
      }
    ]
  };

  const commissionStatusData = {
    labels: [
      t('common.paid'),
      t('common.approved'),
      t('common.pending'),
      t('commissions.total_rejected')
    ],
    datasets: [
      {
        data: [
          data.trends.commissionsByStatus.paid,
          data.trends.commissionsByStatus.approved,
          data.trends.commissionsByStatus.pending,
          data.trends.commissionsByStatus.rejected
        ],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ]
      }
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('analytics.system_analytics')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">{t('analytics.last_7_days')}</SelectItem>
              <SelectItem value="last_30_days">{t('analytics.last_30_days')}</SelectItem>
              <SelectItem value="last_90_days">{t('analytics.last_90_days')}</SelectItem>
              <SelectItem value="this_month">{t('analytics.this_month')}</SelectItem>
              <SelectItem value="last_month">{t('analytics.last_month')}</SelectItem>
              <SelectItem value="this_quarter">{t('analytics.this_quarter')}</SelectItem>
              <SelectItem value="last_quarter">{t('analytics.last_quarter')}</SelectItem>
              <SelectItem value="this_year">{t('analytics.this_year')}</SelectItem>
              <SelectItem value="last_year">{t('analytics.last_year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={exporting} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            {exporting ? t('common.loading') : t('analytics.export_report')}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.total_revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.metrics.totalRevenue)}
            </div>
            <div className={`flex items-center text-xs mt-1 ${getTrendColor(data.comparisons.revenue.trend)}`}>
              {data.comparisons.revenue.trend === 'increase' ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : data.comparisons.revenue.trend === 'decrease' ? (
                <TrendingDown className="mr-1 h-3 w-3" />
              ) : null}
              {formatPercentage(data.comparisons.revenue.percentageChange)}
              <span className="ml-1 text-muted-foreground">
                {t('analytics.vs_previous_period')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.total_resellers')}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalResellers}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('analytics.active_customers')}: {data.metrics.activeCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.total_customers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalCustomers}
            </div>
            <div className={`flex items-center text-xs mt-1 ${getTrendColor(data.comparisons.customers.trend)}`}>
              {data.comparisons.customers.trend === 'increase' ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : data.comparisons.customers.trend === 'decrease' ? (
                <TrendingDown className="mr-1 h-3 w-3" />
              ) : null}
              {formatPercentage(data.comparisons.customers.percentageChange)}
              <span className="ml-1 text-muted-foreground">
                {t('analytics.vs_previous_period')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('analytics.total_commissions')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalCommissions}
            </div>
            <div className={`flex items-center text-xs mt-1 ${getTrendColor(data.comparisons.commissions.trend)}`}>
              {data.comparisons.commissions.trend === 'increase' ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : data.comparisons.commissions.trend === 'decrease' ? (
                <TrendingDown className="mr-1 h-3 w-3" />
              ) : null}
              {formatPercentage(data.comparisons.commissions.percentageChange)}
              <span className="ml-1 text-muted-foreground">
                {t('analytics.vs_previous_period')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.earnings_trend')}</CardTitle>
            <CardDescription>{t('analytics.by_month')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.commission_by_status')}</CardTitle>
            <CardDescription>{t('analytics.overview')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="w-64 h-64">
                <Doughnut
                  data={commissionStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.top_performers')}</CardTitle>
            <CardDescription>{t('analytics.reseller_performance')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformers.resellers.length > 0 ? (
                data.topPerformers.resellers.map((reseller) => (
                  <div key={reseller.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {reseller.rank}
                      </div>
                      <div>
                        <p className="font-medium">{reseller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {reseller.customerCount} {t('common.customers')}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(reseller.value)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('analytics.no_data_available')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.top_customers')}</CardTitle>
            <CardDescription>{t('analytics.by_revenue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformers.customers.length > 0 ? (
                data.topPerformers.customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {customer.rank}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.resellerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(customer.value)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('analytics.no_data_available')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.customer_by_status')}</CardTitle>
          <CardDescription>{t('analytics.overview')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="w-96 h-96">
              <Doughnut
                data={customerStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.performance_summary')}</CardTitle>
          <CardDescription>{t('analytics.key_metrics')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('analytics.approval_rate')}</p>
              <p className="text-2xl font-bold">{data.metrics.approvalRate.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${data.metrics.approvalRate}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('analytics.rejection_rate')}</p>
              <p className="text-2xl font-bold">{data.metrics.rejectionRate.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${data.metrics.rejectionRate}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('analytics.conversion_rate')}</p>
              <p className="text-2xl font-bold">{data.metrics.conversionRate.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${data.metrics.conversionRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
