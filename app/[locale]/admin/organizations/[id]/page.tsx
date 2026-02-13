'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Users,
  UserPlus,
  Save,
  Mail,
  Phone,
  Crown,
  Shield,
  User,
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

interface OrgMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationRole: string;
  status: string;
}

interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  commissionRate: number;
  commissionYears: number;
  isOneOffPayment: boolean;
  isTrusted: boolean;
  users: OrgMember[];
  _count: { customers: number; commissions: number };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
}

export default function OrganizationDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setOrganization(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=RESELLER');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // Filter out users already in this organization
      const existingIds = organization?.users.map(u => u.id) || [];
      const available = data.users.filter((u: any) => !existingIds.includes(u.id) && !u.organizationId);
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organization.name,
          email: organization.email,
          phone: organization.phone,
          address: organization.address,
          city: organization.city,
          country: organization.country,
          commissionRate: organization.commissionRate,
          commissionYears: organization.commissionYears,
          isOneOffPayment: organization.isOneOffPayment,
          isTrusted: organization.isTrusted,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success(t('organizations.saved'));
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error(t('organizations.select_user'));
      return;
    }

    setAddingMember(true);
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });

      if (!response.ok) throw new Error('Failed to add member');
      toast.success(t('organizations.member_added'));
      setShowAddMemberDialog(false);
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      fetchOrganization();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('organizations.confirm_remove_member'))) return;

    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');
      toast.success(t('organizations.member_removed'));
      fetchOrganization();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      toast.success(t('organizations.role_updated'));
      fetchOrganization();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'MANAGER': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER': return <Badge className="bg-yellow-100 text-yellow-800">{t('organizations.role_owner')}</Badge>;
      case 'MANAGER': return <Badge className="bg-blue-100 text-blue-800">{t('organizations.role_manager')}</Badge>;
      default: return <Badge variant="secondary">{t('organizations.role_member')}</Badge>;
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

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <p>{t('organizations.not_found')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {organization.name}
          </h1>
          <p className="text-muted-foreground">{t('organizations.edit_organization')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizations.details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('organizations.org_name')}</Label>
              <Input
                value={organization.name}
                onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input
                  type="email"
                  value={organization.email || ''}
                  onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.phone')}</Label>
                <Input
                  value={organization.phone || ''}
                  onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.address')}</Label>
              <Input
                value={organization.address || ''}
                onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.city')}</Label>
                <Input
                  value={organization.city || ''}
                  onChange={(e) => setOrganization({ ...organization, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.country')}</Label>
                <Input
                  value={organization.country || ''}
                  onChange={(e) => setOrganization({ ...organization, country: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('user_management.commission_settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('user_management.commission_rate')} (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={organization.commissionRate}
                  onChange={(e) => setOrganization({ ...organization, commissionRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('user_management.commission_years')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={organization.commissionYears}
                  onChange={(e) => setOrganization({ ...organization, commissionYears: parseInt(e.target.value) || 1 })}
                  disabled={organization.isOneOffPayment}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isOneOffPayment"
                checked={organization.isOneOffPayment}
                onChange={(e) => setOrganization({ ...organization, isOneOffPayment: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isOneOffPayment">{t('user_management.one_off_payment')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTrusted"
                checked={organization.isTrusted}
                onChange={(e) => setOrganization({ ...organization, isTrusted: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isTrusted">{t('trusted_reseller.title')}</Label>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('common.customers')}:</span>
                  <span className="ml-2 font-medium">{organization._count.customers}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('common.commissions')}:</span>
                  <span className="ml-2 font-medium">{organization._count.commissions}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('organizations.team_members')}
              </CardTitle>
              <CardDescription>{t('organizations.team_description')}</CardDescription>
            </div>
            <Button
              onClick={() => {
                fetchAvailableUsers();
                setShowAddMemberDialog(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('organizations.add_member')}
            </Button>
          </CardHeader>
          <CardContent>
            {organization.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('organizations.no_members')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {organization.users.map((member) => (
                  <div key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getRoleIcon(member.organizationRole)}
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      {getRoleBadge(member.organizationRole)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.organizationRole}
                        onValueChange={(value) => handleChangeRole(member.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">{t('organizations.role_owner')}</SelectItem>
                          <SelectItem value="MANAGER">{t('organizations.role_manager')}</SelectItem>
                          <SelectItem value="MEMBER">{t('organizations.role_member')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('organizations.add_member')}</DialogTitle>
            <DialogDescription>{t('organizations.add_member_description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('organizations.select_user')}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('organizations.select_user_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('organizations.no_available_users')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('organizations.role')}</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">{t('organizations.role_owner')}</SelectItem>
                  <SelectItem value="MANAGER">{t('organizations.role_manager')}</SelectItem>
                  <SelectItem value="MEMBER">{t('organizations.role_member')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddMember} disabled={addingMember || !selectedUserId}>
              {addingMember ? t('common.loading') : t('organizations.add_member')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
