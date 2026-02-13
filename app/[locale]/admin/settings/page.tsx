'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Setting {
  key: string;
  value: string;
  description?: string;
  category: string;
}

export default function SystemSettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    system_name: '',
    support_email: '',
    default_commission_rate: '10',
    min_commission_amount: '100',
    auto_approve_threshold: '500',
    email_notifications_enabled: 'true',
    maintenance_mode: 'false',
    default_language: 'nl',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data: Setting[] = await response.json();
        const settingsMap: Record<string, string> = {};
        data.forEach((setting) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings({ ...settings, ...settingsMap });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value,
            category: getCategoryForKey(key),
          }),
        })
      );

      await Promise.all(promises);
      toast.success(t('system_settings.settings_saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (key.includes('commission')) return 'commission';
    if (key.includes('notification') || key.includes('email')) return 'notification';
    return 'general';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('system_settings.title')}</h1>
          <p className="text-muted-foreground">{t('system_settings.subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('common.saving') : t('system_settings.save_settings')}
        </Button>
      </div>

      {/* Auto-Approval Navigation Card */}
      <Link href={`/${locale}/admin/settings/auto-approval`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('auto_approval.title')}</CardTitle>
                  <CardDescription className="mt-1">{t('auto_approval.description')}</CardDescription>
                </div>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-400" />
            </div>
          </CardHeader>
        </Card>
      </Link>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('system_settings.general_settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="system_name">{t('system_settings.system_name')}</Label>
              <Input
                id="system_name"
                value={settings.system_name}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                placeholder="Reseller Portal"
              />
              <p className="text-sm text-muted-foreground">
                {t('system_settings.system_name_description')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_email">{t('system_settings.support_email')}</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                placeholder="support@example.com"
              />
              <p className="text-sm text-muted-foreground">
                {t('system_settings.support_email_description')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('system_settings.maintenance_mode')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('system_settings.maintenance_mode_description')}
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode === 'true'}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenance_mode: String(checked) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_language">{t('system_settings.default_language')}</Label>
            <Select
              value={settings.default_language}
              onValueChange={(value) => setSettings({ ...settings, default_language: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('system_settings.default_language')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nl">Nederlands</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('system_settings.default_language_description')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('system_settings.commission_settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="default_commission_rate">
                {t('system_settings.default_commission_rate')}
              </Label>
              <div className="relative">
                <Input
                  id="default_commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.default_commission_rate}
                  onChange={(e) =>
                    setSettings({ ...settings, default_commission_rate: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('system_settings.commission_rate_description')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_commission_amount">
                {t('system_settings.min_commission_amount')}
              </Label>
              <div className="relative">
                <Input
                  id="min_commission_amount"
                  type="number"
                  min="0"
                  step="10"
                  value={settings.min_commission_amount}
                  onChange={(e) =>
                    setSettings({ ...settings, min_commission_amount: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">€</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('system_settings.min_commission_description')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto_approve_threshold">
                {t('system_settings.auto_approve_threshold')}
              </Label>
              <div className="relative">
                <Input
                  id="auto_approve_threshold"
                  type="number"
                  min="0"
                  step="10"
                  value={settings.auto_approve_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_approve_threshold: e.target.value })
                  }
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">€</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('system_settings.auto_approve_description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('system_settings.notification_settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('system_settings.email_notifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('system_settings.email_notifications_description')}
              </p>
            </div>
            <Switch
              checked={settings.email_notifications_enabled === 'true'}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_notifications_enabled: String(checked) })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
