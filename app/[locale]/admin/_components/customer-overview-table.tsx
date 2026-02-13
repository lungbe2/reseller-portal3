'use client';

import { useState, useEffect, useMemo } from 'react';
import { Customer, User } from '@prisma/client';
import { Search, Filter, Eye, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

type CustomerWithReseller = Customer & { reseller: User };

interface CustomerOverviewTableProps {
  customers: CustomerWithReseller[];
}

export default function CustomerOverviewTable({ customers }: CustomerOverviewTableProps) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const tSales = useTranslations('sales');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  
  // Get unique countries from customers
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    customers.forEach(c => {
      if (c.country) countrySet.add(c.country);
    });
    return Array.from(countrySet).sort();
  }, [customers]);
  
  // Read initial status filter from URL
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['ACTIVE', 'LEAD', 'PROSPECT', 'NO_DEAL', 'CANCELLED'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
    const countryParam = searchParams.get('country');
    if (countryParam) {
      setCountryFilter(countryParam);
    }
  }, [searchParams]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.companyName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      customer.contactName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      customer.reseller?.name?.toLowerCase()?.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
    const matchesCountry = countryFilter === 'ALL' || customer.country === countryFilter;

    return matchesSearch && matchesStatus && matchesCountry;
  });

  return (
    <div>
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('search_by_customer_reseller_email')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{tc('all_status')}</option>
              <option value="ACTIVE">{tc('active')}</option>
              <option value="LEAD">{tc('lead')}</option>
              <option value="PROSPECT">{tc('prospect')}</option>
              <option value="NO_DEAL">{tc('no_deal')}</option>
              <option value="CANCELLED">{tc('cancelled')}</option>
            </select>
          </div>
          {countries.length > 0 && (
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">{tc('all_countries')}</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredCustomers.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('company')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('reseller')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('registration_date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {tc('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/${locale}/admin/customers/${customer.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{customer.companyName}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {customer.reseller?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : customer.status === 'LEAD'
                          ? 'bg-yellow-100 text-yellow-800'
                          : customer.status === 'PROSPECT'
                          ? 'bg-blue-100 text-blue-800'
                          : customer.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.status === 'ACTIVE' ? tc('active') :
                       customer.status === 'LEAD' ? tc('lead') :
                       customer.status === 'PROSPECT' ? tc('prospect') :
                       customer.status === 'CANCELLED' ? tc('cancelled') :
                       tc('no_deal')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(customer.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/admin/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-4 w-4" />
                      {tc('view')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>{tc('no_customers_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
