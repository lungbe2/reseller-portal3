'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Edit, Trash2, ShieldAlert, ShieldCheck, KeyRound, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RESELLER';
  status: 'ACTIVE' | 'SUSPENDED';
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  _count: {
    customers: number;
    commissions: number;
  };
}

export default function UserManagementPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    user: User | null;
    action: 'suspend' | 'activate';
  }>({ open: false, user: null, action: 'suspend' });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      const response = await fetch(`/api/admin/users/${deleteDialog.user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('user_management.user_deleted'));
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('common.error'));
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog.user) return;

    try {
      const newStatus = statusDialog.action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      const response = await fetch(`/api/admin/users/${statusDialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(t('user_management.user_updated'));
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(t('common.error'));
    } finally {
      setStatusDialog({ open: false, user: null, action: 'suspend' });
    }
  };

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('user_management.title')}</h1>
          <p className="text-muted-foreground">{t('user_management.subtitle')}</p>
        </div>
        <Button
          onClick={() => router.push('/admin/users/new')}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {t('user_management.create_user')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('user_management.total_users')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('user_management.active_users')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('user_management.suspended_users')}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('user_management.search_users')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('user_management.suspended')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                <SelectItem value="ADMIN">{t('common.admin')}</SelectItem>
                <SelectItem value="RESELLER">{t('common.reseller')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('user_management.no_users_found')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">{t('common.name')}</th>
                    <th className="text-left p-4 font-medium">{t('common.email')}</th>
                    <th className="text-left p-4 font-medium">{t('common.role')}</th>
                    <th className="text-left p-4 font-medium">{t('common.status')}</th>
                    <th className="text-left p-4 font-medium">{t('user_management.customers_count')}</th>
                    <th className="text-left p-4 font-medium">{t('user_management.last_login')}</th>
                    <th className="text-right p-4 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.company && (
                            <div className="text-sm text-muted-foreground">{user.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{user.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          {user.role === 'RESELLER' && (user as any).isTrusted && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {t('trusted_reseller.trusted_badge')}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
                          className={
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : ''
                          }
                        >
                          {user.status === 'ACTIVE' ? t('common.active') : t('user_management.suspended')}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {user._count.customers} / {user._count.commissions}
                      </td>
                      <td className="p-4 text-sm">
                        {user.lastLoginAt
                          ? format(new Date(user.lastLoginAt), 'PPp')
                          : t('user_management.never_logged_in')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setStatusDialog({ open: true, user, action: 'suspend' })
                              }
                            >
                              <ShieldAlert className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setStatusDialog({ open: true, user, action: 'activate' })
                              }
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, user })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user_management.delete_user')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('user_management.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) => !open && setStatusDialog({ open: false, user: null, action: 'suspend' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog.action === 'suspend'
                ? t('user_management.suspend')
                : t('user_management.activate')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.action === 'suspend'
                ? t('user_management.confirm_suspend')
                : t('user_management.confirm_activate')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
