'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, KeyRound, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  title?: string;
  company?: string;
  city?: string;
  country?: string;
  isTrusted?: boolean;
  commissionRate?: number;
  commissionYears?: number;
  isOneOffPayment?: boolean;
  // Backup Admin details
  backupAdminName?: string;
  backupAdminEmail?: string;
  backupAdminPhone?: string;
  // Banking details
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  bankCode?: string;
  currency?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: user.phone || null,
          title: user.title || null,
          company: user.company || null,
          city: user.city || null,
          country: user.country || null,
          commissionRate: user.commissionRate,
          commissionYears: user.commissionYears,
          isOneOffPayment: user.isOneOffPayment,
          // Backup Admin details
          backupAdminName: user.backupAdminName || null,
          backupAdminEmail: user.backupAdminEmail || null,
          backupAdminPhone: user.backupAdminPhone || null,
          // Banking details
          bankName: user.bankName || null,
          accountHolder: user.accountHolder || null,
          accountNumber: user.accountNumber || null,
          bankCode: user.bankCode || null,
          currency: user.currency || 'EUR',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      toast.success(t('user_management.user_updated'));
      router.push(`/${locale}/admin/users`);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error(t('user_management.password_requirements'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) throw new Error('Failed to reset password');

      toast.success(t('user_management.password_reset'));
      setShowResetPassword(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleToggleTrusted = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-trusted`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle trusted status');
      }

      const data = await response.json();
      setUser({ ...user, isTrusted: data.isTrusted });
      toast.success(t('trusted_reseller.trusted_status_updated'));
    } catch (error: any) {
      console.error('Error toggling trusted status:', error);
      toast.error(error.message || t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('user_management.no_users_found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/${locale}/admin/users`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('user_management.edit_user')}</h1>
        <p className="text-muted-foreground">{t('user_management.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('user_management.user_details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.name')} *</Label>
                <Input
                  id="name"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t('common.role')} *</Label>
                <Select
                  value={user.role}
                  onValueChange={(value) => setUser({ ...user, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t('common.admin')}</SelectItem>
                    <SelectItem value="RESELLER">{t('common.reseller')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={user.status}
                  onValueChange={(value) => setUser({ ...user, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                    <SelectItem value="SUSPENDED">{t('user_management.suspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phone')}</Label>
                <Input
                  id="phone"
                  value={user.phone || ''}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  placeholder="+31 20 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('common.company')}</Label>
                <Input
                  id="company"
                  value={user.company || ''}
                  onChange={(e) => setUser({ ...user, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
            </div>

            {/* Title/Position - Only show for resellers */}
            {user.role === 'RESELLER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('user_management.title_position')}</Label>
                  <Input
                    id="title"
                    value={user.title || ''}
                    onChange={(e) => setUser({ ...user, title: e.target.value })}
                    placeholder="e.g. Owner, Director, Manager"
                  />
                  <p className="text-sm text-muted-foreground">{t('user_management.title_position_help')}</p>
                </div>
              </div>
            )}

            {/* Backup Admin - Only show for resellers */}
            {user.role === 'RESELLER' && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">{t('user_management.backup_admin')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('user_management.backup_admin_help')}</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="backupAdminName">{t('user_management.backup_admin_name')}</Label>
                    <Input
                      id="backupAdminName"
                      value={user.backupAdminName || ''}
                      onChange={(e) => setUser({ ...user, backupAdminName: e.target.value })}
                      placeholder="Backup contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupAdminEmail">{t('user_management.backup_admin_email')}</Label>
                    <Input
                      id="backupAdminEmail"
                      type="email"
                      value={user.backupAdminEmail || ''}
                      onChange={(e) => setUser({ ...user, backupAdminEmail: e.target.value })}
                      placeholder="backup@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupAdminPhone">{t('user_management.backup_admin_phone')}</Label>
                    <Input
                      id="backupAdminPhone"
                      value={user.backupAdminPhone || ''}
                      onChange={(e) => setUser({ ...user, backupAdminPhone: e.target.value })}
                      placeholder="+31 20 123 4567"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Commission Settings - Only show for resellers */}
            {user.role === 'RESELLER' && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">{t('user_management.commission_settings')}</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">{t('user_management.commission_rate')} (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={user.commissionRate ?? 20}
                      onChange={(e) => setUser({ ...user, commissionRate: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-sm text-muted-foreground">{t('user_management.commission_rate_help')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionYears">{t('user_management.commission_years')}</Label>
                    <Input
                      id="commissionYears"
                      type="number"
                      min="1"
                      max="10"
                      value={user.commissionYears ?? 3}
                      onChange={(e) => setUser({ ...user, commissionYears: parseInt(e.target.value) || 1 })}
                      disabled={user.isOneOffPayment}
                    />
                    <p className="text-sm text-muted-foreground">{t('user_management.commission_years_help')}</p>
                  </div>
                </div>
                
                {/* One-off Payment Option */}
                <div className="flex items-center space-x-3 mt-4">
                  <input
                    type="checkbox"
                    id="isOneOffPayment"
                    checked={user.isOneOffPayment || false}
                    onChange={(e) => setUser({ ...user, isOneOffPayment: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isOneOffPayment" className="cursor-pointer">
                    {t('user_management.one_off_payment')}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  {t('user_management.one_off_payment_help')}
                </p>
              </div>
            )}

            {/* Banking Details - Only show for resellers */}
            {user.role === 'RESELLER' && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">{t('user_management.banking_details')}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">{t('user_management.bank_name')}</Label>
                    <Input
                      id="bankName"
                      value={user.bankName || ''}
                      onChange={(e) => setUser({ ...user, bankName: e.target.value })}
                      placeholder="e.g. ABSA Bank, ING Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">{t('user_management.account_holder')}</Label>
                    <Input
                      id="accountHolder"
                      value={user.accountHolder || ''}
                      onChange={(e) => setUser({ ...user, accountHolder: e.target.value })}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">{t('user_management.account_number')}</Label>
                    <Input
                      id="accountNumber"
                      value={user.accountNumber || ''}
                      onChange={(e) => setUser({ ...user, accountNumber: e.target.value })}
                      placeholder="Account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankCode">{t('user_management.bank_code')}</Label>
                    <Input
                      id="bankCode"
                      value={user.bankCode || ''}
                      onChange={(e) => setUser({ ...user, bankCode: e.target.value })}
                      placeholder="IBAN / Branch code / SWIFT"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('user_management.currency')}</Label>
                    <Select
                      value={user.currency || 'EUR'}
                      onValueChange={(value) => setUser({ ...user, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">{t('user_management.currency_help')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trusted Reseller Toggle - Only show for resellers */}
            {user.role === 'RESELLER' && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-start justify-between p-4 border rounded-lg bg-blue-50/50">
                  <div className="flex items-start gap-3">
                    <Shield className={`h-5 w-5 mt-0.5 ${user.isTrusted ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        {t('trusted_reseller.title')}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {t('trusted_reseller.trusted_hint')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={user.isTrusted || false}
                    onCheckedChange={handleToggleTrusted}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {t('user_management.reset_password')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showResetPassword ? (
              <Button
                variant="outline"
                onClick={() => setShowResetPassword(true)}
              >
                {t('user_management.reset_password')}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('user_management.new_password')}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                    >
                      {t('user_management.generate_password')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('user_management.password_requirements')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetPassword}
                    disabled={saving || !newPassword}
                  >
                    {t('user_management.reset_password')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResetPassword(false);
                      setNewPassword('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/${locale}/admin/users`}>
            <Button variant="outline">{t('common.cancel')}</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
