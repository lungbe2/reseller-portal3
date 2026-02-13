import { prisma } from '@/lib/prisma';
import { ResellersTable } from './resellers-table';

export default async function ResellersPage() {
  const resellers = await prisma.user.findMany({
    where: { role: 'RESELLER' },
    include: {
      _count: {
        select: {
          customers: true,
          commissions: true
        }
      },
      commissions: {
        select: {
          amount: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate total commission amount for each reseller
  const resellersWithStats = resellers.map(reseller => {
    const totalCommission = reseller.commissions.reduce((sum, comm) => sum + comm.amount, 0);
    return {
      ...reseller,
      _count: {
        ...reseller._count,
        totalCommission
      }
    };
  });

  return <ResellersTable resellers={resellersWithStats} />;
}
