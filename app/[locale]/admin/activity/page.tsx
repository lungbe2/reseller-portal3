'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Users, Clock, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  metadata?: string;
}

interface RecentLogin {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string;
  role: string;
}

interface ActivityData {
  recentActivity: ActivityLog[];
  pendingApprovals: number;
  recentLogins: RecentLogin[];
  activeUsers: number;
  stats: {
    totalUsers: number;
    totalCustomers: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
}

export default function AdminActivityDashboard() {
  const t = useTranslations();
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity');
      if (response.ok) {
        const activityData = await response.json();
        setData(activityData);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchActivity, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getActionIcon = (action: string) => {
    if (action.includes('APPROVED') || action.includes('ACTIVATED')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (action.includes('REJECTED') || action.includes('SUSPENDED')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else if (action.includes('CREATED')) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    // Convert action to translation key
    const key = action.toLowerCase();
    return t(key) || action.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('no_data')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('activity_dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('system_activity')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {t('auto_refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivity}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh_activity')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('last')} 24 {t('hours')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending_approvals')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/en/admin/commissions" className="text-blue-600 hover:underline">
                {t('view_all')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_resellers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('active')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_customers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {t('all_time')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recent_activity')}</CardTitle>
            <CardDescription>
              {t('system_activity')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('no_recent_activity')}</p>
              ) : (
                data.recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {getActionLabel(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('performed_by')}: {log.performedBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.entityType}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link href="/en/admin/audit-logs">
                <Button variant="outline" size="sm" className="w-full">
                  {t('view_all_activity')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logins */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recent_logins')}</CardTitle>
            <CardDescription>
              {t('latest_user_logins')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentLogins.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('no_recent_logins')}</p>
              ) : (
                data.recentLogins.map((login) => (
                  <div key={login.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{login.name}</p>
                      <p className="text-xs text-muted-foreground">{login.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={login.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                        {login.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {login.lastLoginAt && formatDistanceToNow(new Date(login.lastLoginAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin_tools')}</CardTitle>
          <CardDescription>
            {t('quick_access_to_admin_features')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/en/admin/resellers">
              <Button variant="outline" className="w-full h-24 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span>{t('user_management')}</span>
              </Button>
            </Link>
            <Link href="/en/admin/commissions">
              <Button variant="outline" className="w-full h-24 flex flex-col">
                <AlertCircle className="h-6 w-6 mb-2" />
                <span>{t('pending_approvals')}</span>
                {data.pendingApprovals > 0 && (
                  <Badge className="mt-1">{data.pendingApprovals}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/en/admin/audit-logs">
              <Button variant="outline" className="w-full h-24 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>{t('audit_logs')}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
