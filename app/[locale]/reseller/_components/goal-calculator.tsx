'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface GoalCalculatorProps {
  commissionRate: number; // e.g., 20 for 20%
  currency: string; // EUR or ZAR
}

export default function GoalCalculator({ commissionRate, currency }: GoalCalculatorProps) {
  const t = useTranslations('reseller');
  const tc = useTranslations('common');
  
  const [targetCommission, setTargetCommission] = useState<string>('');
  const [averageDealValue, setAverageDealValue] = useState<string>('');
  const [result, setResult] = useState<{ salesNeeded: number; totalRevenue: number } | null>(null);

  const currencySymbol = currency === 'ZAR' ? 'R' : '€';

  const calculate = () => {
    const target = parseFloat(targetCommission);
    const avgDeal = parseFloat(averageDealValue);
    
    if (!target || !avgDeal || target <= 0 || avgDeal <= 0) {
      setResult(null);
      return;
    }

    // Commission = dealValue * (commissionRate / 100)
    // To get targetCommission, we need: salesNeeded * avgDeal * (commissionRate / 100) = targetCommission
    // So: salesNeeded = targetCommission / (avgDeal * commissionRate / 100)
    const commissionPerDeal = avgDeal * (commissionRate / 100);
    const salesNeeded = Math.ceil(target / commissionPerDeal);
    const totalRevenue = salesNeeded * avgDeal;

    setResult({ salesNeeded, totalRevenue });
  };

  const reset = () => {
    setTargetCommission('');
    setAverageDealValue('');
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('goal_calculator')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('goal_calculator_description')}
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetCommission">
              {t('target_commission')} ({currencySymbol})
            </Label>
            <Input
              id="targetCommission"
              type="number"
              min="0"
              step="100"
              value={targetCommission}
              onChange={(e) => setTargetCommission(e.target.value)}
              placeholder={`e.g. 4000`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="averageDealValue">
              {t('average_deal_value')} ({currencySymbol})
            </Label>
            <Input
              id="averageDealValue"
              type="number"
              min="0"
              step="100"
              value={averageDealValue}
              onChange={(e) => setAverageDealValue(e.target.value)}
              placeholder={`e.g. 5000`}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculate} className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {tc('calculate')}
          </Button>
          <Button variant="outline" onClick={reset}>
            {tc('reset')}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" />
              {t('calculation_result')}
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm text-blue-700">{t('sales_needed')}</p>
                <p className="text-2xl font-bold text-blue-900">{result.salesNeeded}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700">{t('total_revenue_needed')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {currencySymbol}{result.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">{t('your_commission_rate')}</p>
                <p className="text-2xl font-bold text-blue-900">{commissionRate}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-700">
              {t('goal_calculation_explanation', {
                sales: result.salesNeeded,
                avgValue: `${currencySymbol}${parseFloat(averageDealValue).toLocaleString()}`,
                target: `${currencySymbol}${parseFloat(targetCommission).toLocaleString()}`
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
