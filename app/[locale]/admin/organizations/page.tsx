'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Search,
  Users,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commissionRate: number;
  commissionYears: number;
  isOneOffPayment: boolean;
  isTrusted: boolean;
  users: Array<{ id: string; name: string; email: string; organizationRole: string }>;
  _count: { customers: number; commissions: number };
}

export default function OrganizationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    email: '',
    phone: '',
    commissionRate: 20,
    commissionYears: 3,
    isOneOffPayment: false,
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newOrg.name.trim()) {
      toast.error(t('organizations.name_required'));
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });

      if (!response.ok) throw new Error('Failed to create');
      
      toast.success(t('organizations.created'));
      setShowCreateDialog(false);
      setNewOrg({ name: '', email: '', phone: '', commissionRate: 20, commissionYears: 3, isOneOffPayment: false });
      fetchOrganizations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('organizations.confirm_delete'))) return;

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      toast.success(t('organizations.deleted'));
      fetchOrganizations();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {t('organizations.title')}
          </h1>
          <p className="text-muted-foreground">{t('organizations.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('organizations.create')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('organizations.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrgs.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{org.name}</CardTitle>
                {org.isTrusted && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t('trusted_reseller.title')}
                  </Badge>
                )}
              </div>
              {org.email && <p className="text-sm text-muted-foreground">{org.email}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{org.users.length} {t('organizations.members')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('common.customers')}:</span> {org._count.customers}
                </div>
                <div>
                  <span className="text-muted-foreground">{t('user_management.commission_rate')}:</span> {org.commissionRate}%
                </div>
                <div>
                  <span className="text-muted-foreground">{t('user_management.commission_years')}:</span> {org.commissionYears}
                </div>
              </div>

              {org.isOneOffPayment && (
                <Badge variant="outline">{t('user_management.one_off_payment')}</Badge>
              )}

              <div className="flex gap-2 pt-2">
                <Link href={`/${locale}/admin/organizations/${org.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    {t('common.view')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(org.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrgs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('organizations.no_organizations')}</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('organizations.create')}</DialogTitle>
            <DialogDescription>{t('organizations.create_description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('organizations.org_name')} *</Label>
              <Input
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                placeholder={t('organizations.org_name_placeholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input
                  type="email"
                  value={newOrg.email}
                  onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.phone')}</Label>
                <Input
                  value={newOrg.phone}
                  onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('user_management.commission_rate')} (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newOrg.commissionRate}
                  onChange={(e) => setNewOrg({ ...newOrg, commissionRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('user_management.commission_years')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newOrg.commissionYears}
                  onChange={(e) => setNewOrg({ ...newOrg, commissionYears: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isOneOffPayment"
                checked={newOrg.isOneOffPayment}
                onChange={(e) => setNewOrg({ ...newOrg, isOneOffPayment: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isOneOffPayment">{t('user_management.one_off_payment')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
