'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Plus, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommissionRequestForm from './commission-request-form';

type Commission = any;

interface CommissionsClientProps {
  commissions: Commission[];
  stats: {
    totalAmount: number;
    paidAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CommissionsClient({ commissions: initialCommissions, stats }: CommissionsClientProps) {
  const t = useTranslations('commissions');
  const tc = useTranslations('common');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // Get unique years from commissions
  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    commissions.forEach((c: any) => {
      const year = c.period?.substring(0, 4);
      if (year) yearsSet.add(parseInt(year));
    });
    // Add current year and a few surrounding years
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      yearsSet.add(y);
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [commissions]);

  // Get unique periods
  const periods = Array.from(new Set(commissions.map((c: any) => c.period))).sort().reverse();

  // Filter commissions based on view mode and filters
  const filteredCommissions = useMemo(() => {
    return commissions.filter((commission: any) => {
      const matchesStatus = statusFilter === 'ALL' || commission.status === statusFilter;
      
      let matchesPeriod = true;
      if (viewMode === 'yearly') {
        // Match by year only
        matchesPeriod = commission.period?.startsWith(String(selectedYear));
      } else if (viewMode === 'monthly') {
        // Match by year and month
        const monthStr = String(selectedMonth + 1).padStart(2, '0');
        matchesPeriod = commission.period?.startsWith(`${selectedYear}-${monthStr}`);
      }
      
      return matchesStatus && matchesPeriod;
    });
  }, [commissions, statusFilter, viewMode, selectedYear, selectedMonth]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const total = filteredCommissions.reduce((sum: number, c: any) => sum + c.amount, 0);
    const paid = filteredCommissions.filter((c: any) => c.status === 'PAID').reduce((sum: number, c: any) => sum + c.amount, 0);
    const approved = filteredCommissions.filter((c: any) => c.status === 'APPROVED').reduce((sum: number, c: any) => sum + c.amount, 0);
    const pending = filteredCommissions.filter((c: any) => c.status === 'PENDING').reduce((sum: number, c: any) => sum + c.amount, 0);
    const rejected = filteredCommissions.filter((c: any) => c.status === 'REJECTED').reduce((sum: number, c: any) => sum + c.amount, 0);
    return { total, paid, approved, pending, rejected };
  }, [filteredCommissions]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (viewMode === 'yearly') params.append('year', String(selectedYear));
      if (viewMode === 'monthly') {
        params.append('year', String(selectedYear));
        params.append('month', String(selectedMonth + 1));
      }

      const response = await fetch(`/api/commissions/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commission-statement-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting commissions:', error);
    }
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'monthly') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else if (viewMode === 'yearly') {
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'monthly') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else if (viewMode === 'yearly') {
      setSelectedYear(selectedYear + 1);
    }
  };

  const refreshCommissions = async () => {
    try {
      const response = await fetch('/api/commissions');
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions);
      }
    } catch (error) {
      console.error('Error refreshing commissions:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('request_commission')}
        </Button>
      </div>

      {/* Period View Tabs */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'monthly' | 'yearly')} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('all_time')}
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  {t('monthly')}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex items-center gap-2">
                  {t('yearly')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Period Navigation */}
            {viewMode !== 'all' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevPeriod}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-4 py-2 font-medium min-w-[120px] text-center">
                  {viewMode === 'monthly' 
                    ? `${MONTHS[selectedMonth]} ${selectedYear}`
                    : selectedYear
                  }
                </div>
                <Button variant="outline" size="icon" onClick={handleNextPeriod}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Month Selector (for monthly view) */}
          {viewMode === 'monthly' && (
            <div className="mt-4 flex flex-wrap gap-2">
              {MONTHS.map((month, idx) => (
                <Button
                  key={month}
                  variant={selectedMonth === idx ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMonth(idx)}
                  className="min-w-[60px]"
                >
                  {month}
                </Button>
              ))}
            </div>
          )}

          {/* Year Selector (for yearly view) */}
          {viewMode === 'yearly' && (
            <div className="mt-4 flex flex-wrap gap-2">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Commission Summary - shows filtered stats when not viewing all */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">
            {viewMode === 'all' ? t('total_earned') : t('period_total')}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            €{(viewMode === 'all' ? stats.totalAmount : filteredStats.total).toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('total_paid')}</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            €{(viewMode === 'all' ? stats.paidAmount : filteredStats.paid).toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('total_approved')}</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            €{(viewMode === 'all' ? stats.approvedAmount : filteredStats.approved).toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('total_pending')}</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">
            €{(viewMode === 'all' ? stats.pendingAmount : filteredStats.pending).toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('total_rejected')}</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            €{(viewMode === 'all' ? stats.rejectedAmount : filteredStats.rejected).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Commission List */}
      <Card>
        {/* Status Filter and Export */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">{t('all_status')}</option>
                <option value="PENDING">{tc('pending')}</option>
                <option value="APPROVED">{tc('approved')}</option>
                <option value="PAID">{tc('paid')}</option>
                <option value="REJECTED">{tc('rejected')}</option>
              </select>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export_statement')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredCommissions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('requested_at')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('period')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission: any) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(commission.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {commission.customer?.companyName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-600 truncate">{commission.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {commission.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        €{commission.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(commission.status)}>
                        {commission.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {commission.approvedAt && (
                        <div className="text-xs text-gray-500">
                          Approved: {new Date(commission.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                      {commission.paidAt && (
                        <div className="text-xs text-gray-500">
                          Paid: {new Date(commission.paidAt).toLocaleDateString()}
                        </div>
                      )}
                      {commission.rejectedAt && commission.rejectionReason && (
                        <div className="text-xs text-red-600">
                          {commission.rejectionReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>{t('no_commissions_found')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Commission Request Form Modal */}
      {showRequestForm && (
        <CommissionRequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={refreshCommissions}
        />
      )}
    </div>
  );
}
