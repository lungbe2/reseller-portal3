'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

type ResellerWithStats = User & {
  _count: {
    customers: number;
    referrals: number;
    commissions: number;
  };
  totalCommission: number;
};

interface ResellerTableProps {
  resellers: ResellerWithStats[];
}

export default function ResellerTable({ resellers }: ResellerTableProps) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'customers' | 'commission'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'customers' | 'commission') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredResellers = resellers
    .filter((reseller) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        reseller.name?.toLowerCase()?.includes(searchLower) ||
        reseller.email?.toLowerCase()?.includes(searchLower) ||
        reseller.company?.toLowerCase()?.includes(searchLower)
      );
    })
    .sort((a, b) => {
      let compareValue = 0;
      if (sortField === 'name') {
        compareValue = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'customers') {
        compareValue = (a._count?.customers ?? 0) - (b._count?.customers ?? 0);
      } else if (sortField === 'commission') {
        compareValue = (a.totalCommission ?? 0) - (b.totalCommission ?? 0);
      }
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

  return (
    <div>
      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('search_by_name_email_company')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredResellers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[18%]"
                >
                  <div className="flex items-center gap-1">
                    {tc('name')}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">
                  {tc('email')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                  {tc('company')}
                </th>
                <th
                  onClick={() => handleSort('customers')}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[10%]"
                >
                  <div className="flex items-center gap-1">
                    {tc('customers')}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                  {tc('referrals')}
                </th>
                <th
                  onClick={() => handleSort('commission')}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[12%]"
                >
                  <div className="flex items-center gap-1">
                    {tc('commissions')}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                  {tc('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResellers.map((reseller) => (
                <tr 
                  key={reseller.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/${locale}/admin/resellers/${reseller.id}`}
                >
                  <td className="px-3 py-3 text-sm truncate">
                    <div className="font-semibold text-gray-900 truncate">{reseller.name}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 truncate">{reseller.email}</td>
                  <td className="px-3 py-3 text-sm text-gray-600 truncate">
                    {reseller.company || '-'}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {reseller._count?.customers ?? 0}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {reseller._count?.referrals ?? 0}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      €{(reseller.totalCommission ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/${locale}/admin/resellers/${reseller.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tc('view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>{tc('no_resellers_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
