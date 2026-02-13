import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from "@/lib/db";
import Link from 'next/link';
import { Plus } from 'lucide-react';
import CustomerList from '../_components/customer-list';


export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const customers = await prisma.customer.findMany({
    where: { resellerId: userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage and view all your customers</p>
        </div>
        <Link
          href="/reseller/customers/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Customer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <CustomerList customers={customers} />
      </div>
    </div>
  );
}
