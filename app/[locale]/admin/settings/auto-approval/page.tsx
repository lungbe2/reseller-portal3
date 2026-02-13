'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Edit2, Trash2, Power, PowerOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AutoApprovalRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  maxAmount?: number;
  trustedResellersOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AutoApprovalSettingsPage() {
  const t = useTranslations('auto_approval');
  const tCommon = useTranslations('common');
  const [rules, setRules] = useState<AutoApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoApprovalRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 0,
    maxAmount: '',
    trustedResellersOnly: false,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/auto-approval-rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const url = editingRule
        ? `/api/admin/auto-approval-rules/${editingRule.id}`
        : '/api/admin/auto-approval-rules';
      
      const method = editingRule ? 'PATCH' : 'POST';

      const payload = {
        name: formData.name,
        description: formData.description || null,
        enabled: formData.enabled,
        priority: parseInt(formData.priority.toString()) || 0,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        trustedResellersOnly: formData.trustedResellersOnly,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingRule ? t('rule_updated') : t('rule_created'));
        setDialogOpen(false);
        resetForm();
        fetchRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  };

  const handleDelete = async () => {
    if (!deletingRuleId) return;

    try {
      const response = await fetch(`/api/admin/auto-approval-rules/${deletingRuleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('rule_deleted'));
        setDeleteDialogOpen(false);
        setDeletingRuleId(null);
        fetchRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const openEditDialog = (rule: AutoApprovalRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      priority: rule.priority,
      maxAmount: rule.maxAmount?.toString() || '',
      trustedResellersOnly: rule.trustedResellersOnly,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      priority: 0,
      maxAmount: '',
      trustedResellersOnly: false,
    });
  };

  const openDeleteDialog = (ruleId: string) => {
    setDeletingRuleId(ruleId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-2 text-gray-600">{t('description')}</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {t('create_rule')}
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Power className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">{t('no_rules')}</p>
            <p className="text-gray-600 mb-4">{t('create_first_rule')}</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              {t('create_rule')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{rule.name}</CardTitle>
                      {rule.enabled ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('enabled')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          {tCommon('disabled')}
                        </Badge>
                      )}
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-2">{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">{t('conditions')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount Limit:</span>
                      <span className="ml-2 font-medium">
                        {rule.maxAmount ? `€${rule.maxAmount.toFixed(2)}` : t('no_amount_limit')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reseller Type:</span>
                      <span className="ml-2 font-medium">
                        {rule.trustedResellersOnly ? t('trusted_only') : t('any_reseller')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? t('edit_rule') : t('create_rule')}</DialogTitle>
            <DialogDescription>{t('all_conditions_must_match')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">{t('rule_name')}*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Small Commissions Auto-Approve"
              />
            </div>

            <div>
              <Label htmlFor="description">{t('rule_description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of this rule..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">{t('priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">{t('priority_hint')}</p>
              </div>

              <div>
                <Label htmlFor="maxAmount">{t('max_amount')} (€)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="e.g., 500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('max_amount_hint')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex-1">
                <Label htmlFor="trustedOnly" className="font-medium">
                  {t('trusted_resellers_only')}
                </Label>
                <p className="text-xs text-gray-500 mt-1">{t('trusted_resellers_hint')}</p>
              </div>
              <Switch
                id="trustedOnly"
                checked={formData.trustedResellersOnly}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, trustedResellersOnly: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex-1">
                <Label htmlFor="enabled" className="font-medium">
                  {t('enabled')}
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  {editingRule
                    ? 'Enable or disable this rule'
                    : 'Rule will be active immediately after creation'}
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateOrUpdate} disabled={!formData.name.trim()}>
              {editingRule ? tCommon('save') : tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
            <DialogDescription>{t('delete_warning')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('delete_rule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
