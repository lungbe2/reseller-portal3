import { prisma } from "@/lib/db";
import CustomerOverviewTable from '../_components/customer-overview-table';
import ExportButton from '../_components/export-button';


export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      reseller: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Customers</h1>
          <p className="mt-2 text-gray-600">View customers across all resellers</p>
        </div>
        <ExportButton type="customers" />
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <CustomerOverviewTable customers={customers} />
      </div>
    </div>
  );
}
