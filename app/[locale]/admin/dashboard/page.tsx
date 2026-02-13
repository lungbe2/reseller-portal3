import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from "@/lib/db";
import { Users, Building2, DollarSign, UserPlus } from 'lucide-react';
import Link from 'next/link';
import WelcomeSummaryModal from '@/components/ui/welcome-summary-modal';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch statistics
  const totalResellers = await prisma.user.count({
    where: { role: 'RESELLER' },
  });

  // Leads (status = LEAD)
  const totalLeads = await prisma.customer.count({
    where: { status: 'LEAD' },
  });

  // Active customers (status = ACTIVE)
  const totalActiveCustomers = await prisma.customer.count({
    where: { status: 'ACTIVE' },
  });

  const commissionData = await prisma.commission.aggregate({
    _sum: { amount: true },
  });

  const totalCommission = commissionData._sum?.amount ?? 0;

  const stats = [
    {
      name: 'Total Resellers',
      value: totalResellers,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/resellers',
    },
    {
      name: 'Leads',
      value: totalLeads,
      icon: UserPlus,
      color: 'bg-yellow-500',
      href: '/admin/customers?status=LEAD',
    },
    {
      name: 'Total Customers',
      value: totalActiveCustomers,
      icon: Building2,
      color: 'bg-green-500',
      href: '/admin/customers?status=ACTIVE',
    },
    {
      name: 'Total Commissions',
      value: `€${totalCommission.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      href: '/admin/commissions',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WelcomeSummaryModal role="admin" userName={session?.user?.name || undefined} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor and manage all resellers and customers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
