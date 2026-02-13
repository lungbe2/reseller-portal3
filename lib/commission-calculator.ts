import prisma from '@/lib/db';
import { createNotification } from '@/lib/notifications/notification-service';
import { CommissionStatus } from '@prisma/client';

interface CloseDealParams {
  customerId: string;
  contractValue: number;      // Annual contract value in EUR
  contractDuration: number;   // Contract duration in years
  closedById: string;         // Admin user ID who closed the deal
}

interface CommissionEntry {
  amount: number;
  status: CommissionStatus;
  period: string;
  description: string;
  yearNumber: number;
  contractValue: number;
  commissionRate: number;
  dueDate: Date;
  resellerId: string;
  customerId: string;
}

/**
 * Calculate and create commission entries when a deal is closed.
 * Commission is calculated as: contractValue * (commissionRate / 100)
 * Commission entries are created for each year up to the reseller's commissionYears limit.
 */
export async function closeDealAndCalculateCommissions(params: CloseDealParams) {
  const { customerId, contractValue, contractDuration, closedById } = params;

  // Get customer with reseller info
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      reseller: {
        select: {
          id: true,
          name: true,
          commissionRate: true,
          commissionYears: true,
          isOneOffPayment: true,
        },
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (customer.status === 'ACTIVE') {
    throw new Error('Customer deal is already closed');
  }

  const reseller = customer.reseller;
  const commissionRate = reseller.commissionRate;
  const commissionYears = reseller.commissionYears;
  const isOneOffPayment = reseller.isOneOffPayment;
  
  // Calculate commission amount
  const baseCommission = contractValue * (commissionRate / 100);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Create commission entries
  const commissionEntries: CommissionEntry[] = [];
  
  if (isOneOffPayment) {
    // One-off payment: single commission entry for the total amount
    const totalCommission = baseCommission * Math.min(contractDuration, commissionYears);
    const dueDate = new Date(currentYear, 11, 31); // December 31st of current year
    
    commissionEntries.push({
      amount: totalCommission,
      status: 'PENDING',
      period: `${currentYear}`,
      description: `One-off Commission (total) for ${customer.companyName}`,
      yearNumber: 1,
      contractValue: contractValue,
      commissionRate: commissionRate,
      dueDate: dueDate,
      resellerId: reseller.id,
      customerId: customer.id,
    });
  } else {
    // Annual payments: create entries for each year
    const yearsToPayCommission = Math.min(contractDuration, commissionYears);
    
    for (let year = 1; year <= yearsToPayCommission; year++) {
      const dueDate = new Date(currentYear + year - 1, 11, 31); // December 31st of each year
      
      commissionEntries.push({
        amount: baseCommission,
        status: 'PENDING',
        period: `${currentYear + year - 1}`,
        description: `Commission Year ${year}/${yearsToPayCommission} for ${customer.companyName}`,
        yearNumber: year,
        contractValue: contractValue,
        commissionRate: commissionRate,
        dueDate: dueDate,
        resellerId: reseller.id,
        customerId: customer.id,
      });
    }
  }
  
  // Transaction: Update customer and create commissions
  const result = await prisma.$transaction(async (tx) => {
    // Update customer status to ACTIVE (closed)
    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: {
        status: 'ACTIVE',
        contractValue: contractValue,
        contractDuration: contractDuration,
        closedAt: now,
        closedBy: closedById,
      },
    });
    
    // Create all commission entries
    const createdCommissions = await tx.commission.createMany({
      data: commissionEntries,
    });
    
    const totalCommissionValue = commissionEntries.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      customer: updatedCustomer,
      commissionsCreated: createdCommissions.count,
      totalCommissionValue,
      isOneOffPayment,
    };
  });
  
  // Send notification to reseller
  await createNotification({
    userId: reseller.id,
    type: 'COMMISSION_REQUESTED',
    data: {
      customerName: customer.companyName,
      commissionsCount: commissionEntries.length,
      totalAmount: result.totalCommissionValue.toFixed(2),
      isOneOff: isOneOffPayment,
    },
  });
  
  return result;
}

/**
 * Get commission summary for a reseller
 */
export async function getCommissionSummary(resellerId: string) {
  const commissions = await prisma.commission.findMany({
    where: { resellerId },
    include: {
      customer: {
        select: {
          companyName: true,
          contractValue: true,
        },
      },
    },
  });
  
  const summary = {
    totalEarned: 0,
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    byYear: {} as Record<string, { pending: number; approved: number; paid: number }>,
  };
  
  for (const commission of commissions) {
    const year = commission.period;
    if (!summary.byYear[year]) {
      summary.byYear[year] = { pending: 0, approved: 0, paid: 0 };
    }
    
    summary.totalEarned += commission.amount;
    
    if (commission.status === 'PENDING') {
      summary.totalPending += commission.amount;
      summary.byYear[year].pending += commission.amount;
    } else if (commission.status === 'APPROVED') {
      summary.totalApproved += commission.amount;
      summary.byYear[year].approved += commission.amount;
    } else if (commission.status === 'PAID') {
      summary.totalPaid += commission.amount;
      summary.byYear[year].paid += commission.amount;
    }
  }
  
  return summary;
}
