'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  MessageSquare,
  Calendar,
  ClipboardCheck,
  Share2,
  CheckSquare,
  Square,
  Smartphone
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  mobile?: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  status: string;
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
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const tc = useTranslations('common');
  const tCust = useTranslations('customers');
  const locale = params.locale as string;
  const customerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer');
      const data = await response.json();
      setCustomer({
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: customer.contactName,
          email: customer.email,
          phone: customer.phone,
          mobile: customer.mobile,
          address: customer.address,
          city: customer.city,
          country: customer.country,
          postalCode: customer.postalCode,
          status: customer.status,
          // Secondary contact
          secondaryContactName: customer.secondaryContactName,
          secondaryEmail: customer.secondaryEmail,
          secondaryPhone: customer.secondaryPhone,
          secondaryMobile: customer.secondaryMobile,
          // Follow-up
          followUpDate: customer.followUpDate || null,
          followUpNotes: customer.followUpNotes,
          // Checklist
          contractReceived: customer.contractReceived,
          pendingFinalization: customer.pendingFinalization,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }

      toast.success(tCust('customer_updated'));
      router.push(`/${locale}/reseller/customers`);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error.message || tc('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!customer) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const message = `${tCust('check_out_customer')}: ${customer.companyName}\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(tCust('link_copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'LEAD': return 'bg-yellow-100 text-yellow-800';
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'NO_DEAL': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <p>{tCust('not_found')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tCust('edit_customer')}</h1>
            <p className="text-muted-foreground">{tCust('edit_customer_description')}</p>
          </div>
        </div>
        {/* WhatsApp Share Button */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? tc('copied') : tCust('copy_link')}
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

      {/* Company & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {customer.companyName}
          </CardTitle>
          <CardDescription>
            {tCust('manage_customer_details')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{tCust('company_name')}</Label>
              <Input
                value={customer.companyName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{tCust('field_not_editable')}</p>
            </div>
            <div className="space-y-2">
              <Label>{tc('status')}</Label>
              <Select
                value={customer.status}
                onValueChange={(value) => setCustomer({ ...customer, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('LEAD')}`}>
                      {tc('lead')}
                    </span>
                  </SelectItem>
                  <SelectItem value="PROSPECT">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('PROSPECT')}`}>
                      {tc('prospect')}
                    </span>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('ACTIVE')}`}>
                      {tc('active')}
                    </span>
                  </SelectItem>
                  <SelectItem value="NO_DEAL">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('NO_DEAL')}`}>
                      {tc('no_deal')}
                    </span>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('CANCELLED')}`}>
                      {tc('cancelled')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {tCust('primary_contact')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">{tCust('contact_name')}</Label>
              <Input
                id="contactName"
                value={customer.contactName || ''}
                onChange={(e) => setCustomer({ ...customer, contactName: e.target.value })}
                placeholder={tCust('contact_name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tc('email')}</Label>
              <Input
                id="email"
                type="email"
                value={customer.email || ''}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{tc('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone || ''}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">{tc('mobile')}</Label>
              <Input
                id="mobile"
                type="tel"
                value={customer.mobile || ''}
                onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {tCust('secondary_contact')}
          </CardTitle>
          <CardDescription>
            {tCust('secondary_contact_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="secondaryContactName">{tCust('contact_name')}</Label>
              <Input
                id="secondaryContactName"
                value={customer.secondaryContactName || ''}
                onChange={(e) => setCustomer({ ...customer, secondaryContactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryEmail">{tc('email')}</Label>
              <Input
                id="secondaryEmail"
                type="email"
                value={customer.secondaryEmail || ''}
                onChange={(e) => setCustomer({ ...customer, secondaryEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryPhone">{tc('phone')}</Label>
              <Input
                id="secondaryPhone"
                type="tel"
                value={customer.secondaryPhone || ''}
                onChange={(e) => setCustomer({ ...customer, secondaryPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryMobile">{tc('mobile')}</Label>
              <Input
                id="secondaryMobile"
                type="tel"
                value={customer.secondaryMobile || ''}
                onChange={(e) => setCustomer({ ...customer, secondaryMobile: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {tCust('address_information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">{tCust('address')}</Label>
              <Input
                id="address"
                value={customer.address || ''}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder={tCust('address_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{tCust('city')}</Label>
              <Input
                id="city"
                value={customer.city || ''}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">{tCust('postal_code')}</Label>
              <Input
                id="postalCode"
                value={customer.postalCode || ''}
                onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{tCust('country')}</Label>
              <Input
                id="country"
                value={customer.country || ''}
                onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {tCust('follow_up')}
          </CardTitle>
          <CardDescription>
            {tCust('follow_up_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="followUpDate">{tCust('follow_up_date')}</Label>
              <Input
                id="followUpDate"
                type="date"
                value={customer.followUpDate || ''}
                onChange={(e) => setCustomer({ ...customer, followUpDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="followUpNotes">{tCust('follow_up_notes')}</Label>
            <Textarea
              id="followUpNotes"
              value={customer.followUpNotes || ''}
              onChange={(e) => setCustomer({ ...customer, followUpNotes: e.target.value })}
              placeholder={tCust('follow_up_notes_placeholder')}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {tc('checklist')}
          </CardTitle>
          <CardDescription>
            {tCust('checklist_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="contractReceived"
              checked={customer.contractReceived || false}
              onCheckedChange={(checked) => setCustomer({ ...customer, contractReceived: checked as boolean })}
            />
            <Label htmlFor="contractReceived" className="flex items-center gap-2 cursor-pointer">
              {customer.contractReceived ? (
                <CheckSquare className="h-4 w-4 text-green-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              {tc('contract_received')}
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="pendingFinalization"
              checked={customer.pendingFinalization || false}
              onCheckedChange={(checked) => setCustomer({ ...customer, pendingFinalization: checked as boolean })}
            />
            <Label htmlFor="pendingFinalization" className="flex items-center gap-2 cursor-pointer">
              {customer.pendingFinalization ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
              {tc('pending_finalization')}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {tc('cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? tc('saving') : tc('save')}
        </Button>
      </div>
    </div>
  );
}
