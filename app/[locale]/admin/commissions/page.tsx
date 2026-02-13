import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from "@/lib/db";
import AdminCommissionsClient from '../_components/admin-commissions-client';

export const dynamic = 'force-dynamic';

export default async function AdminCommissionsPage() {
  const session = await getServerSession(authOptions);

  const commissions = await prisma.commission.findMany({
    include: {
      customer: true,
      reseller: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  });

  const pendingCount = commissions.filter((c) => c.status === 'PENDING').length;
  const approvedCount = commissions.filter((c) => c.status === 'APPROVED').length;
  const paidCount = commissions.filter((c) => c.status === 'PAID').length;
  const rejectedCount = commissions.filter((c) => c.status === 'REJECTED').length;

  const totalPending = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalApproved = commissions
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <AdminCommissionsClient
      commissions={commissions}
      stats={{
        pendingCount,
        approvedCount,
        paidCount,
        rejectedCount,
        totalPending,
        totalApproved,
        totalPaid,
      }}
    />
  );
}
