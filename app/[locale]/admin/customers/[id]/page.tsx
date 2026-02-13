'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  Globe,
  Users,
  CalendarClock,
  CheckSquare,
  Square,
  ClipboardList,
  Share2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  status: string;
  websiteDomain?: string;
  reviewPlatform?: string;
  industry?: string;
  registrationDate: string;
  // Secondary contact
  secondaryContactName?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  secondaryMobile?: string;
  // Follow-up
  followUpDate?: string;
  followUpNotes?: string;
  // Checklist
  contractReceived?: boolean;
  pendingFinalization?: boolean;
  // Contract
  contractValue?: number;
  contractCurrency?: string;
  contractDuration?: number;
  closedAt?: string;
  reseller: {
    id: string;
    name: string;
    email: string;
    company?: string;
    commissionRate: number;
    commissionYears: number;
    currency: string;
  };
  commissions: Array<{
    id: string;
    amount: number;
    status: string;
    period: string;
    yearNumber?: number;
  }>;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;
  const customerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCloseDealDialog, setShowCloseDealDialog] = useState(false);
  const [closingDeal, setClosingDeal] = useState(false);
  const [contractValue, setContractValue] = useState('');
  const [contractDuration, setContractDuration] = useState('1');
  const [endingContract, setEndingContract] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareWhatsApp = () => {
    if (!customer) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const message = `${t('customers.check_out_customer')}: ${customer.companyName}\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t('customers.link_copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDeal = async () => {
    if (!contractValue || parseFloat(contractValue) <= 0) {
      toast.error(t('sales.enter_contract_value'));
      return;
    }

    setClosingDeal(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/close-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractValue: parseFloat(contractValue),
          contractDuration: parseInt(contractDuration),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to close deal');
      }

      const result = await response.json();
      toast.success(
        `${t('sales.deal_closed_success')} ${result.data.commissionsCreated} ${t('sales.commissions_created')}`
      );
      setShowCloseDealDialog(false);
      fetchCustomer(); // Refresh data
    } catch (error: any) {
      console.error('Error closing deal:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setClosingDeal(false);
    }
  };

  const handleMarkAsNoDeal = async () => {
    if (!confirm(t('sales.confirm_no_deal'))) return;

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NO_DEAL' }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      toast.success(t('sales.marked_as_no_deal'));
      fetchCustomer();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('common.error'));
    }
  };

  const handleEndContract = async () => {
    if (!confirm(t('sales.confirm_end_contract'))) return;

    setEndingContract(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/end-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to end contract');
      }

      const result = await response.json();
      toast.success(t('sales.contract_ended'));
      fetchCustomer();
    } catch (error: any) {
      console.error('Error ending contract:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setEndingContract(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{t('sales.closed_won')}</Badge>;
      case 'LEAD':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />{t('common.lead')}</Badge>;
      case 'NO_DEAL':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />{t('sales.closed_lost')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <p>{t('customers.not_found')}</p>
      </div>
    );
  }

  const expectedCommission = customer.reseller.commissionRate / 100 * (parseFloat(contractValue) || 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {customer.companyName}
              {getStatusBadge(customer.status)}
            </h1>
            <p className="text-muted-foreground">{t('sales.customer_details')}</p>
          </div>
        </div>
        
        {/* Share buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? t('common.copied') : t('customers.copy_link')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareWhatsApp}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end">
        {customer.status === 'LEAD' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAsNoDeal}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('sales.mark_as_lost')}
            </Button>
            <Button onClick={() => setShowCloseDealDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('sales.close_deal')}
            </Button>
          </div>
        )}
        
        {customer.status === 'ACTIVE' && (
          <Button
            variant="destructive"
            onClick={handleEndContract}
            disabled={endingContract}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {endingContract ? t('common.loading') : t('sales.end_contract')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Primary Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('customers.contact_information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{customer.contactName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.mobile && (
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.mobile}</span>
              </div>
            )}
            {(customer.address || customer.city || customer.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {customer.address && <p>{customer.address}</p>}
                  <p>{[customer.postalCode, customer.city, customer.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {customer.websiteDomain && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{customer.websiteDomain}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{t('sales.registered')}: {new Date(customer.registrationDate).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('customers.secondary_contact')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.secondaryContactName ? (
              <>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{customer.secondaryContactName}</span>
                </div>
                {customer.secondaryEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.secondaryEmail}</span>
                  </div>
                )}
                {customer.secondaryPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.secondaryPhone}</span>
                  </div>
                )}
                {customer.secondaryMobile && (
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.secondaryMobile}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t('customers.no_secondary_contact')}</p>
            )}
            
            {/* Follow-up Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4" />
                {t('customers.follow_up')}
              </h4>
              {customer.followUpDate ? (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={new Date(customer.followUpDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                      {new Date(customer.followUpDate).toLocaleDateString()}
                    </span>
                  </div>
                  {customer.followUpNotes && (
                    <p className="text-sm text-muted-foreground mt-2">{customer.followUpNotes}</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">{t('customers.no_follow_up')}</p>
              )}
            </div>

            {/* Checklist Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4" />
                {t('customers.checklist')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {customer.contractReceived ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={customer.contractReceived ? 'text-green-600' : 'text-muted-foreground'}>
                    {t('customers.contract_received')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {customer.pendingFinalization ? (
                    <CheckSquare className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={customer.pendingFinalization ? 'text-yellow-600' : 'text-muted-foreground'}>
                    {t('customers.pending_finalization')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reseller Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('sales.reseller_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{customer.reseller.name}</p>
              <p className="text-sm text-muted-foreground">{customer.reseller.company}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.reseller.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span>{t('sales.commission_rate')}: {customer.reseller.commissionRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{t('sales.commission_years')}: {customer.reseller.commissionYears} {t('sales.years')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contract Info (if closed) */}
        {customer.status === 'ACTIVE' && customer.contractValue && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('sales.contract_details')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.contract_value')}</p>
                  <p className="text-2xl font-bold">€{customer.contractValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t('sales.per_year')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.contract_duration')}</p>
                  <p className="text-2xl font-bold">{customer.contractDuration} {t('sales.years')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.closed_date')}</p>
                  <p className="text-2xl font-bold">
                    {customer.closedAt ? new Date(customer.closedAt).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('sales.annual_commission')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{((customer.contractValue * customer.reseller.commissionRate) / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commissions */}
        {customer.commissions.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('sales.commission_schedule')}</CardTitle>
              <CardDescription>{t('sales.annual_payments')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('sales.year')}</th>
                      <th className="text-left py-2">{t('sales.period')}</th>
                      <th className="text-left py-2">{t('common.amount')}</th>
                      <th className="text-left py-2">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.commissions.map((commission) => (
                      <tr key={commission.id} className="border-b">
                        <td className="py-3">{t('sales.year')} {commission.yearNumber}</td>
                        <td className="py-3">{commission.period}</td>
                        <td className="py-3 font-medium">€{commission.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <Badge variant={commission.status === 'PAID' ? 'default' : 'secondary'}>
                            {t(`common.${commission.status.toLowerCase()}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Close Deal Dialog */}
      <Dialog open={showCloseDealDialog} onOpenChange={setShowCloseDealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sales.close_deal')}</DialogTitle>
            <DialogDescription>
              {t('sales.close_deal_description', { company: customer.companyName })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contractValue">{t('sales.annual_contract_value')} (€)</Label>
              <Input
                id="contractValue"
                type="number"
                min="0"
                step="0.01"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                placeholder="10000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contractDuration">{t('sales.contract_duration')} ({t('sales.years')})</Label>
              <Input
                id="contractDuration"
                type="number"
                min="1"
                max="10"
                value={contractDuration}
                onChange={(e) => setContractDuration(e.target.value)}
              />
            </div>

            {contractValue && parseFloat(contractValue) > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">{t('sales.commission_preview')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{t('sales.commission_rate')}:</span>
                  <span>{customer.reseller.commissionRate}%</span>
                  <span className="text-muted-foreground">{t('sales.annual_commission')}:</span>
                  <span className="font-medium">€{expectedCommission.toLocaleString()}</span>
                  <span className="text-muted-foreground">{t('sales.payment_years')}:</span>
                  <span>{Math.min(parseInt(contractDuration) || 1, customer.reseller.commissionYears)}</span>
                  <span className="text-muted-foreground">{t('sales.total_commission')}:</span>
                  <span className="font-bold text-green-600">
                    €{(expectedCommission * Math.min(parseInt(contractDuration) || 1, customer.reseller.commissionYears)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDealDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCloseDeal} disabled={closingDeal}>
              {closingDeal ? t('common.saving') : t('sales.close_deal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
