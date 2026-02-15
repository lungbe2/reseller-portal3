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

interface Reseller {
  id: string;
  name: string;
  email: string;
  role: string;
  currency: string;
  _count: {
    customers: number;
    commissions: number;
  };
}

interface ResellersTableProps {
  resellers: Reseller[];
}

export function ResellersTable({ resellers }: ResellersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Customers</TableHead>
            <TableHead>Commissions</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resellers.map((reseller) => (
            <TableRow key={reseller.id}>
              <TableCell className="font-medium">{reseller.name}</TableCell>
              <TableCell>{reseller.email}</TableCell>
              <TableCell>{reseller._count.customers}</TableCell>
              <TableCell>{reseller._count.commissions}</TableCell>
              <TableCell>
                <Badge variant={reseller.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {reseller.role}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
