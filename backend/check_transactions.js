const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      take: 10,
      include: {
        booking: {
          include: {
            hostel: true,
            student: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nTotal transactions found: ${transactions.length}\n`);
    
    if (transactions.length === 0) {
      console.log('No transactions in database.');
    } else {
      transactions.forEach(tx => {
        console.log(`Transaction: ${tx.transactionRef}`);
        console.log(`  Status: ${tx.status}`);
        console.log(`  Amount: ${tx.amount} UGX`);
        console.log(`  Payment Method: ${tx.paymentMethod}`);
        console.log(`  Student: ${tx.booking?.student?.name || 'N/A'}`);
        console.log(`  Hostel: ${tx.booking?.hostel?.name || 'N/A'}`);
        if (tx.status === 'FAILED') {
          console.log(`  Rejection Reason: ${tx.rejectionReason}`);
        }
        console.log('');
      });
    }
    
    // Count by status
    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('Status breakdown:');
    statusCounts.forEach(s => {
      console.log(`  ${s.status}: ${s._count}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
