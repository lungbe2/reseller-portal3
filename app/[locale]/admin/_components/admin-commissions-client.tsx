'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Download, Filter, Check, X, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type Commission = any;

interface AdminCommissionsClientProps {
  commissions: Commission[];
  stats: {
    pendingCount: number;
    approvedCount: number;
    paidCount: number;
    rejectedCount: number;
    totalPending: number;
    totalApproved: number;
    totalPaid: number;
  };
}

export default function AdminCommissionsClient({ commissions: initialCommissions, stats }: AdminCommissionsClientProps) {
  const t = useTranslations('commissions');
  const tc = useTranslations('common');
  const tAuto = useTranslations('auto_approval');
  const router = useRouter();
  const [commissions, setCommissions] = useState(initialCommissions);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'APPROVE' | 'REJECT' | 'MARK_PAID' | null;
  }>({ open: false, action: null });
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'mark_paid' | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Get unique periods
  const periods = Array.from(new Set(commissions.map((c: any) => c.period))).sort().reverse();

  const filteredCommissions = commissions.filter((commission: any) => {
    const matchesStatus = statusFilter === 'ALL' || commission.status === statusFilter;
    const matchesPeriod = periodFilter === 'ALL' || commission.period === periodFilter;
    return matchesStatus && matchesPeriod;
  });

  const openActionDialog = (commission: Commission, action: 'APPROVE' | 'REJECT' | 'MARK_PAID') => {
    setSelectedCommission(commission);
    setActionDialog({ open: true, action });
    setActionNotes('');
    setRejectionReason('');
    setPaymentReference('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, action: null });
    setSelectedCommission(null);
    setActionNotes('');
    setRejectionReason('');
    setPaymentReference('');
  };

  const handleAction = async () => {
    if (!selectedCommission || !actionDialog.action) return;

    setLoading(true);
    try {
      const body: any = {
        action: actionDialog.action,
        notes: actionNotes,
      };

      if (actionDialog.action === 'REJECT') {
        if (!rejectionReason.trim()) {
          toast.error('Rejection reason is required');
          return;
        }
        body.rejectionReason = rejectionReason;
      } else if (actionDialog.action === 'MARK_PAID') {
        body.paymentReference = paymentReference;
      }

      const response = await fetch(`/api/commissions/${selectedCommission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions((prev) =>
          prev.map((c) => (c.id === data.commission.id ? data.commission : c))
        );
        
        if (actionDialog.action === 'APPROVE') {
          toast.success(t('request_approved'));
        } else if (actionDialog.action === 'REJECT') {
          toast.success(t('request_rejected'));
        } else if (actionDialog.action === 'MARK_PAID') {
          toast.success(t('marked_as_paid'));
        }
        
        closeActionDialog();
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/bulk-operations/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionIds: selectedIds,
          action: bulkAction,
          rejectionReason: bulkAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedIds([]);
        setBulkAction(null);
        setShowBulkDialog(false);
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCommissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCommissions.map((c: any) => c.id));
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (periodFilter !== 'ALL') params.append('period', periodFilter);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('commission_management')}</h1>
        <p className="mt-2 text-gray-600">Review and manage commission requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('pending_requests')}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            <p className="text-sm text-gray-500">€{stats.totalPending.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('approved_commissions')}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-blue-600">{stats.approvedCount}</p>
            <p className="text-sm text-gray-500">€{stats.totalApproved.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('paid_commissions')}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
            <p className="text-sm text-gray-500">€{stats.totalPaid.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">{t('rejected_commissions')}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
        </Card>
      </div>

      {/* Commission List */}
      <Card>
        {/* Filters and Export */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4">
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
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="block px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">{t('all_periods')}</option>
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export_statement')}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {tc('selected_count', { count: selectedIds.length })}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                >
                  {tc('deselect_all')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setBulkAction('approve');
                    setShowBulkDialog(true);
                  }}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {tc('bulk_approve')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setBulkAction('reject');
                    setShowBulkDialog(true);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {tc('bulk_reject')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setBulkAction('mark_paid');
                    setShowBulkDialog(true);
                  }}
                  disabled={loading}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredCommissions.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredCommissions.length && filteredCommissions.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reseller
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommissions.map((commission: any) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(commission.id)}
                        onChange={() => toggleSelection(commission.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{commission.reseller.name}</div>
                      <div className="text-xs text-gray-500">{commission.reseller.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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
                      <div className="flex flex-col gap-1">
                        <Badge className={getStatusColor(commission.status)}>
                          {commission.status}
                        </Badge>
                        {commission.autoApproved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <Zap className="h-3 w-3 mr-1" />
                            {tAuto('auto_approved')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {commission.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => openActionDialog(commission, 'APPROVE')}
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => openActionDialog(commission, 'REJECT')}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {commission.status === 'APPROVED' && (
                          <Button
                            onClick={() => openActionDialog(commission, 'MARK_PAID')}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        )}
                      </div>
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

      {/* Action Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && closeActionDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === 'APPROVE' && t('approve')}
              {actionDialog.action === 'REJECT' && t('reject')}
              {actionDialog.action === 'MARK_PAID' && t('mark_as_paid')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCommission && (
                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {t('amount')}: €{selectedCommission.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('period')}: {selectedCommission.period}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reseller: {selectedCommission.reseller.name}
                    </p>
                  </div>

                  {actionDialog.action === 'REJECT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('rejection_reason')} *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                  )}

                  {actionDialog.action === 'MARK_PAID' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('payment_reference')}
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter payment reference..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('notes')}
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeActionDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'approve' && tc('confirm_bulk_approve', { count: selectedIds.length })}
              {bulkAction === 'reject' && tc('confirm_bulk_reject', { count: selectedIds.length })}
              {bulkAction === 'mark_paid' && `Mark ${selectedIds.length} commission(s) as paid?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-4">
                {bulkAction === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('rejection_reason')} *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  This action will affect {selectedIds.length} commission(s).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowBulkDialog(false);
              setBulkAction(null);
              setRejectionReason('');
            }}>
              {tc('no_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkOperation} disabled={loading}>
              {loading ? 'Processing...' : tc('yes_continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
