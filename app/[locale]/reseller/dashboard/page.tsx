import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from "@/lib/db";
import { Users, DollarSign, TrendingUp, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getMessages, createTranslator } from '@/lib/translations';
import WelcomeSummaryModal from '@/components/ui/welcome-summary-modal';
import GoalCalculator from '../_components/goal-calculator';

export const dynamic = 'force-dynamic';

export default async function ResellerDashboard({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const locale = params.locale;
  
  // Fetch reseller's commission settings
  const reseller = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      commissionRate: true,
      currency: true,
    },
  });
  
  // Load messages manually
  const messages = await getMessages(params.locale);
  const t = createTranslator(messages, 'reseller');
  const tc = createTranslator(messages, 'common');

  // Fetch customer statistics
  const totalCustomers = await prisma.customer.count({
    where: { resellerId: userId },
  });

  const leadsCount = await prisma.customer.count({
    where: { resellerId: userId, status: 'LEAD' },
  });

  const activeCount = await prisma.customer.count({
    where: { resellerId: userId, status: 'ACTIVE' },
  });

  const noDealCount = await prisma.customer.count({
    where: { resellerId: userId, status: 'NO_DEAL' },
  });

  // Fetch commission statistics
  const totalCommissionData = await prisma.commission.aggregate({
    where: { resellerId: userId },
    _sum: { amount: true },
  });
  const totalCommission = totalCommissionData._sum?.amount ?? 0;

  const pendingCommissionData = await prisma.commission.aggregate({
    where: { resellerId: userId, status: 'PENDING' },
    _sum: { amount: true },
  });
  const pendingCommission = pendingCommissionData._sum?.amount ?? 0;

  const approvedCommissionData = await prisma.commission.aggregate({
    where: { resellerId: userId, status: 'APPROVED' },
    _sum: { amount: true },
  });
  const approvedCommission = approvedCommissionData._sum?.amount ?? 0;

  const paidCommissionData = await prisma.commission.aggregate({
    where: { resellerId: userId, status: 'PAID' },
    _sum: { amount: true },
  });
  const paidCommission = paidCommissionData._sum?.amount ?? 0;

  const recentCustomers = await prisma.customer.findMany({
    where: { resellerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const recentCommissions = await prisma.commission.findMany({
    where: { resellerId: userId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const stats = [
    {
      name: tc('leads'),
      value: leadsCount,
      icon: UserPlus,
      color: 'bg-yellow-500',
      href: `/${locale}/reseller/customers?status=LEAD`,
    },
    {
      name: tc('active'),
      value: activeCount,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: `/${locale}/reseller/customers?status=ACTIVE`,
    },
    {
      name: tc('no_deal'),
      value: noDealCount,
      icon: XCircle,
      color: 'bg-red-500',
      href: `/${locale}/reseller/customers?status=NO_DEAL`,
    },
    {
      name: tc('total') + ' ' + tc('customers'),
      value: totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
      href: `/${locale}/reseller/customers`,
    },
  ];

  const commissionStats = [
    {
      name: t('pending_commission'),
      value: `€${pendingCommission.toFixed(2)}`,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: t('approved_commission'),
      value: `€${approvedCommission.toFixed(2)}`,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      name: t('paid_commission'),
      value: `€${paidCommission.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-500',
    },
    {
      name: t('total_commission'),
      value: `€${totalCommission.toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WelcomeSummaryModal role="reseller" userName={session?.user?.name || undefined} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('welcome_back')}, {session?.user?.name}!</h1>
        <p className="mt-2 text-gray-600">{t('manage_customers_commissions')}</p>
      </div>

      {/* Customer Stats Grid */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{tc('customers')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Commission Stats Grid */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{tc('commissions')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {commissionStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('recent_customers')}</h2>
          <Link
            href={`/${locale}/reseller/customers`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {tc('view_all')}
          </Link>
        </div>
        {recentCustomers.length > 0 ? (
          <div className="space-y-4">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.companyName}</h3>
                  <p className="text-sm text-gray-600">{customer.contactName}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : customer.status === 'LEAD'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tc(customer.status.toLowerCase())}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{tc('no_customers_yet')}</p>
            <Link
              href="/reseller/customers/new"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Register your first customer
            </Link>
          </div>
        )}
      </div>

      {/* Goal Calculator */}
      <GoalCalculator 
        commissionRate={reseller?.commissionRate ?? 20} 
        currency={reseller?.currency ?? 'EUR'} 
      />
    </div>
  );
}
