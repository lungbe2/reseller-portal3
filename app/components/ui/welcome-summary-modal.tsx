'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, DollarSign, CheckCircle, Clock, TrendingUp, X } from 'lucide-react';

interface SummaryData {
  newLeads?: number;
  newCustomers?: number;
  pendingCommissions?: number;
  paidCommissions?: number;
  totalPendingAmount?: number;
  totalPaidAmount?: number;
  recentActivity?: string;
}

interface WelcomeSummaryModalProps {
  role: 'admin' | 'reseller';
  userName?: string;
}

export default function WelcomeSummaryModal({ role, userName }: WelcomeSummaryModalProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we should show the modal (once per session)
    const sessionKey = `welcome_shown_${role}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (!alreadyShown) {
      fetchSummary();
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [role]);

  const fetchSummary = async () => {
    try {
      const endpoint = role === 'admin' ? '/api/admin/summary' : '/api/reseller/summary';
      const response = await fetch(endpoint);
      if (response.ok) {
        const summaryData = await response.json();
        setData(summaryData);
        setOpen(true);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {t('welcome_back')}{userName ? `, ${userName}` : ''}!
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">{t('heres_your_summary')}</p>
          
          <div className="space-y-3">
            {/* New Leads */}
            {data.newLeads !== undefined && data.newLeads > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <UserPlus className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {data.newLeads} {t('new_leads')}
                  </p>
                  <p className="text-xs text-yellow-600">{t('since_last_login')}</p>
                </div>
              </div>
            )}

            {/* New Customers */}
            {data.newCustomers !== undefined && data.newCustomers > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {data.newCustomers} {t('new_customers')}
                  </p>
                  <p className="text-xs text-green-600">{t('deals_closed')}</p>
                </div>
              </div>
            )}

            {/* Pending Commissions */}
            {data.pendingCommissions !== undefined && data.pendingCommissions > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">
                    {data.pendingCommissions} {t('pending_commissions')}
                  </p>
                  <p className="text-xs text-orange-600">
                    €{(data.totalPendingAmount || 0).toFixed(2)} {t('awaiting_approval')}
                  </p>
                </div>
              </div>
            )}

            {/* Paid Commissions */}
            {data.paidCommissions !== undefined && data.paidCommissions > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    {data.paidCommissions} {t('commissions_paid')}
                  </p>
                  <p className="text-xs text-blue-600">
                    €{(data.totalPaidAmount || 0).toFixed(2)} {t('recently_paid')}
                  </p>
                </div>
              </div>
            )}

            {/* No updates */}
            {!data.newLeads && !data.newCustomers && !data.pendingCommissions && !data.paidCommissions && (
              <div className="text-center py-4 text-gray-500">
                <p>{t('no_new_updates')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            {t('got_it')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
