'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

export default function NewUserPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'RESELLER',
    status: 'ACTIVE',
    phone: '',
    company: '',
    commissionRate: 20,
    commissionYears: 3,
    isOneOffPayment: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error(t('user_management.password_requirements'));
      return;
    }

    if (!formData.company.trim()) {
      toast.error(t('user_management.company_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status,
          phone: formData.phone || null,
          company: formData.company,
          commissionRate: formData.commissionRate,
          commissionYears: formData.commissionYears,
          isOneOffPayment: formData.isOneOffPayment,
        }),
      });

      if (response.ok) {
        toast.success(t('user_management.user_created'));
        router.push('/admin/users');
      } else {
        const error = await response.json();
        toast.error(error.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password, confirmPassword: password });
    setShowPassword(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('user_management.create_user')}</h1>
          <p className="text-muted-foreground">{t('user_management.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('user_management.user_details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('user_management.new_password')} *</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={generatePassword}
                  >
                    {t('user_management.generate_password')}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('user_management.password_requirements')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('user_management.confirm_password')} *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Role and Status */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">{t('common.role')} *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESELLER">{t('common.reseller')}</SelectItem>
                    <SelectItem value="ADMIN">{t('common.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('common.status')} *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
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

            {/* Optional Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('common.company')} *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Commission Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">{t('user_management.commission_rate')} (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
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
                  value={formData.commissionYears}
                  onChange={(e) => setFormData({ ...formData, commissionYears: parseInt(e.target.value) || 1 })}
                  disabled={formData.isOneOffPayment}
                />
                <p className="text-sm text-muted-foreground">{t('user_management.commission_years_help')}</p>
              </div>
            </div>

            {/* One-off Payment Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isOneOffPayment"
                checked={formData.isOneOffPayment}
                onChange={(e) => setFormData({ ...formData, isOneOffPayment: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isOneOffPayment" className="cursor-pointer">
                {t('user_management.one_off_payment')}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground -mt-4 ml-7">
              {t('user_management.one_off_payment_help')}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
