import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from "@/lib/db";
import CommissionsClient from '../_components/commissions-client';


export const dynamic = 'force-dynamic';

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const commissions = await prisma.commission.findMany({
    where: { resellerId: userId },
    include: { 
      customer: true,
      approvedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  });

  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidAmount = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);
  const approvedAmount = commissions
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingAmount = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);
  const rejectedAmount = commissions
    .filter((c) => c.status === 'REJECTED')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <CommissionsClient 
      commissions={commissions}
      stats={{
        totalAmount,
        paidAmount,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
      }}
    />
  );
}
