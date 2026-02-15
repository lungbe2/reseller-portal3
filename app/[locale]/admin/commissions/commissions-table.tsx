'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

interface Commission {
  id: string;
  amount: number;
  status: string;
  period: string;
  createdAt: Date;
  reseller: {
    name: string;
    email: string;
    currency: string;
  };
  customer?: {
    companyName: string;
  } | null;
}

interface CommissionsTableProps {
  commissions: Commission[];
}

export function CommissionsTable({ commissions }: CommissionsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      PAID: 'outline',
      REJECTED: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reseller</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((commission) => (
            <TableRow key={commission.id}>
              <TableCell>
                <div className="font-medium">{commission.reseller.name}</div>
                <div className="text-sm text-muted-foreground">{commission.reseller.email}</div>
              </TableCell>
              <TableCell>{commission.customer?.companyName || '—'}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(commission.amount, commission.reseller.currency as any)}
              </TableCell>
              <TableCell>{commission.period}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(commission.status)}>
                  {commission.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(commission.createdAt), 'MMM d, yyyy')}</TableCell>
            </TableRow>
          ))}
          {commissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No commissions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
