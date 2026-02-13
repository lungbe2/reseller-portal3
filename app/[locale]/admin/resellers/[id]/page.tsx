import { prisma } from "@/lib/db";
import { notFound } from 'next/navigation';
import { Mail, Phone, Building2, Calendar } from 'lucide-react';
import Link from 'next/link';
import NotesList from '../../_components/notes-list';
import AddNoteForm from '../../_components/add-note-form';


export const dynamic = 'force-dynamic';

interface ResellerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResellerDetailPage({ params }: ResellerDetailPageProps) {
  const resolvedParams = await params;
  const reseller = await prisma.user.findUnique({
    where: { id: resolvedParams.id, role: 'RESELLER' },
    include: {
      customers: {
        orderBy: { createdAt: 'desc' },
      },
      referrals: {
        include: { customer: true },
        orderBy: { referralDate: 'desc' },
      },
      commissions: {
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!reseller) {
    notFound();
  }

  const totalCommission = reseller.commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/resellers"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Resellers
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{reseller.name}</h1>
        <p className="mt-2 text-gray-600">Reseller details and activity</p>
      </div>

      {/* Reseller Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{reseller.email}</p>
            </div>
          </div>
          {reseller.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{reseller.phone}</p>
              </div>
            </div>
          )}
          {reseller.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="text-gray-900">{reseller.company}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-gray-900">{new Date(reseller.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Customers</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{reseller.customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Referrals</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{reseller.referrals.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600">Total Commission</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">€{totalCommission.toFixed(2)}</p>
        </div>
      </div>

      {/* Customers */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customers</h2>
        {reseller.customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reseller.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{customer.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{customer.contactName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        customer.status === 'LEAD' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No customers yet</p>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
        <AddNoteForm resellerId={resolvedParams.id} />
        <div className="mt-6">
          <NotesList notes={reseller.notes} />
        </div>
      </div>
    </div>
  );
}
