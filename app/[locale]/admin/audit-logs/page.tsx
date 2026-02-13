'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Download, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  changes: string | null;
  metadata: string | null;
}

export default function AuditLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [limit] = useState(25);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      
      if (actionFilter && actionFilter !== 'ALL') params.append('action', actionFilter);
      if (entityTypeFilter && entityTypeFilter !== 'ALL') params.append('entityType', entityTypeFilter);
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityTypeFilter]);

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/export/audit-logs');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entityType.toLowerCase().includes(searchLower) ||
      log.performedBy.name.toLowerCase().includes(searchLower) ||
      log.performedBy.email.toLowerCase().includes(searchLower)
    );
  });

  const getActionLabel = (action: string) => {
    const key = action.toLowerCase();
    return t(key) || action.replace(/_/g, ' ');
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('ACTIVATED') || action.includes('CREATED')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('DELETED')) {
      return 'bg-red-100 text-red-800';
    } else if (action.includes('UPDATED')) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('audit_logs')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('view_all_system_actions')}
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('export_audit_logs')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search_audit_logs')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('filter_by_action')}</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('all_actions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('all_actions')}</SelectItem>
                  <SelectItem value="USER_CREATED">{t('user_created')}</SelectItem>
                  <SelectItem value="USER_UPDATED">{t('user_updated')}</SelectItem>
                  <SelectItem value="USER_SUSPENDED">{t('user_suspended')}</SelectItem>
                  <SelectItem value="USER_ACTIVATED">{t('user_activated')}</SelectItem>
                  <SelectItem value="COMMISSION_APPROVED">{t('commission_approved')}</SelectItem>
                  <SelectItem value="COMMISSION_REJECTED">{t('commission_rejected')}</SelectItem>
                  <SelectItem value="CUSTOMER_STATUS_UPDATED">{t('customer_status_updated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('filter_by_entity')}</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('all_entities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('all_entities')}</SelectItem>
                  <SelectItem value="User">{t('user')}</SelectItem>
                  <SelectItem value="Commission">{t('commission')}</SelectItem>
                  <SelectItem value="Customer">{t('customer')}</SelectItem>
                  <SelectItem value="Document">{t('document')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timestamp')}</TableHead>
                <TableHead>{t('action')}</TableHead>
                <TableHead>{t('entity_type')}</TableHead>
                <TableHead>{t('performed_by')}</TableHead>
                <TableHead>{t('ip_address')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground font-medium mb-2">{t('no_audit_logs')}</p>
                    <p className="text-sm text-muted-foreground">
                      {search || actionFilter !== 'ALL' || entityTypeFilter !== 'ALL' 
                        ? t('try_adjusting_filters')
                        : t('audit_logs_will_appear_here')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.performedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{log.performedBy.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('showing_results', {
            from: page * limit + 1,
            to: Math.min((page + 1) * limit, total),
            total,
          })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            {t('previous_page')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * limit >= total}
          >
            {t('next_page')}
          </Button>
        </div>
      </div>
    </div>
  );
}
