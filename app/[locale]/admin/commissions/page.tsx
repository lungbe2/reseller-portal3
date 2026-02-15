import { prisma } from '@/lib/prisma';
import { CommissionsTable } from './commissions-table';

export default async function AdminCommissionsPage() {
  const commissions = await prisma.commission.findMany({
    include: {
      customer: true,
      reseller: {
        select: {
          id: true,
          name: true,
          email: true,
          // company field doesn't exist - removed
          // commissionRate is available if needed
          commissionRate: true,
          currency: true,
        }
      },
      // approvedBy doesn't exist - removed entirely
    },
    orderBy: {
      createdAt: 'desc'  // Using createdAt instead of requestedAt
    }
  });

  // Transform the data if needed to match what CommissionsTable expects
  const formattedCommissions = commissions.map(comm => ({
    ...comm,
    // Add any computed fields here
    requestedAt: comm.createdAt, // Map createdAt to requestedAt if component expects it
  }));

  return <CommissionsTable commissions={formattedCommissions} />;
}
