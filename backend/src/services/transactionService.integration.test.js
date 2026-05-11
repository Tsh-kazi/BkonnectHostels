const { PrismaClient } = require('@prisma/client');
const { createTransaction } = require('./transactionService');

const prisma = new PrismaClient();

/**
 * Integration test for transaction creation with test data
 * Run with: node src/services/transactionService.integration.test.js
 */

async function setupTestData() {
  console.log('Setting up test data...');
  
  // Create test student
  const student = await prisma.user.create({
    data: {
      role: 'STUDENT',
      name: 'Test Student',
      phone: '0771234567',
      email: 'test.student@example.com',
      passwordHash: 'test-hash'
    }
  });
  console.log(`✓ Created test student: ${student.name}`);
  
  // Create test owner
  const owner = await prisma.user.create({
    data: {
      role: 'OWNER',
      name: 'Test Owner',
      phone: '0772345678',
      email: 'test.owner@example.com',
      passwordHash: 'test-hash'
    }
  });
  console.log(`✓ Created test owner: ${owner.name}`);
  
  // Create test hostel
  const hostel = await prisma.hostel.create({
    data: {
      ownerId: owner.id,
      name: 'Test Hostel',
      streetAddress: '123 Test Street',
      area: 'Test Area',
      category: 'HOSTEL',
      contactPhone: '0773456789',
      isApproved: true
    }
  });
  console.log(`✓ Created test hostel: ${hostel.name}`);
  
  // Create test room
  const room = await prisma.room.create({
    data: {
      hostelId: hostel.id,
      roomType: 'Single',
      beds: 1,
      monthlyRent: 500000,
      amenities: 'WiFi, Water',
      status: 'AVAILABLE'
    }
  });
  console.log(`✓ Created test room: ${room.roomType} - ${room.monthlyRent} UGX/month`);
  
  // Create test booking
  const booking = await prisma.booking.create({
    data: {
      studentId: student.id,
      hostelId: hostel.id,
      roomId: room.id,
      startMonth: '2024-02',
      durationMonths: 3,
      status: 'PENDING'
    }
  });
  console.log(`✓ Created test booking: ${booking.durationMonths} months`);
  
  return { student, owner, hostel, room, booking };
}

async function cleanupTestData(testData) {
  console.log('\nCleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    if (testData.booking) {
      // Delete any transactions first
      await prisma.transaction.deleteMany({
        where: { bookingId: testData.booking.id }
      });
      await prisma.booking.delete({ where: { id: testData.booking.id } });
      console.log('✓ Deleted test booking and transactions');
    }
    
    if (testData.room) {
      await prisma.room.delete({ where: { id: testData.room.id } });
      console.log('✓ Deleted test room');
    }
    
    if (testData.hostel) {
      await prisma.hostel.delete({ where: { id: testData.hostel.id } });
      console.log('✓ Deleted test hostel');
    }
    
    if (testData.owner) {
      await prisma.user.delete({ where: { id: testData.owner.id } });
      console.log('✓ Deleted test owner');
    }
    
    if (testData.student) {
      await prisma.user.delete({ where: { id: testData.student.id } });
      console.log('✓ Deleted test student');
    }
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

async function testCreateTransactionComplete() {
  console.log('\n=== Integration Test: Create Transaction ===');
  
  let testData = null;
  
  try {
    // Setup test data
    testData = await setupTestData();
    
    // Test 1: Create transaction successfully
    console.log('\nTest 1: Create transaction with valid data');
    const transaction = await createTransaction(
      testData.booking.id,
      'MOBILE_MONEY_MTN',
      testData.student.id
    );
    
    console.log('Transaction created:');
    console.log(`  - ID: ${transaction.id}`);
    console.log(`  - Reference: ${transaction.transactionRef}`);
    console.log(`  - Amount: ${transaction.amount} UGX`);
    console.log(`  - Status: ${transaction.status}`);
    console.log(`  - Payment Method: ${transaction.paymentMethod}`);
    
    // Verify transaction data
    if (transaction.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got ${transaction.status}`);
    }
    
    const expectedAmount = testData.room.monthlyRent * testData.booking.durationMonths;
    if (transaction.amount !== expectedAmount) {
      throw new Error(`Expected amount ${expectedAmount}, got ${transaction.amount}`);
    }
    
    if (transaction.studentId !== testData.student.id) {
      throw new Error('Student ID mismatch');
    }
    
    if (transaction.hostelId !== testData.hostel.id) {
      throw new Error('Hostel ID mismatch');
    }
    
    if (transaction.bookingId !== testData.booking.id) {
      throw new Error('Booking ID mismatch');
    }
    
    if (!transaction.transactionRef.startsWith('TXN-')) {
      throw new Error('Invalid transaction reference format');
    }
    
    console.log('✅ PASSED: Transaction created with correct data');
    
    // Test 2: Verify transaction is linked to booking
    console.log('\nTest 2: Verify transaction-booking relationship');
    const bookingWithTransaction = await prisma.booking.findUnique({
      where: { id: testData.booking.id },
      include: { transaction: true }
    });
    
    if (!bookingWithTransaction.transaction) {
      throw new Error('Transaction not linked to booking');
    }
    
    if (bookingWithTransaction.transaction.id !== transaction.id) {
      throw new Error('Transaction ID mismatch in booking relationship');
    }
    
    console.log('✅ PASSED: Transaction correctly linked to booking');
    
    // Test 3: Try to create duplicate transaction
    console.log('\nTest 3: Prevent duplicate transaction creation');
    try {
      await createTransaction(
        testData.booking.id,
        'BANK_TRANSFER',
        testData.student.id
      );
      throw new Error('Should have thrown error for duplicate transaction');
    } catch (error) {
      if (error.message !== 'Transaction already exists for this booking') {
        throw error;
      }
      console.log('✅ PASSED: Duplicate transaction prevented');
    }
    
    // Test 4: Try to create transaction with wrong student
    console.log('\nTest 4: Verify authorization check');
    
    // Create another booking for testing
    const anotherBooking = await prisma.booking.create({
      data: {
        studentId: testData.student.id,
        hostelId: testData.hostel.id,
        roomId: testData.room.id,
        startMonth: '2024-03',
        durationMonths: 2,
        status: 'PENDING'
      }
    });
    
    try {
      await createTransaction(
        anotherBooking.id,
        'MOBILE_MONEY_MTN',
        'wrong-student-id'
      );
      throw new Error('Should have thrown authorization error');
    } catch (error) {
      if (error.message !== 'Unauthorized: Booking does not belong to this student') {
        throw error;
      }
      console.log('✅ PASSED: Authorization check works correctly');
    }
    
    // Clean up the extra booking
    await prisma.booking.delete({ where: { id: anotherBooking.id } });
    
    // Test 5: Test different payment methods
    console.log('\nTest 5: Test all payment methods');
    const paymentMethods = [
      'MOBILE_MONEY_MTN',
      'MOBILE_MONEY_AIRTEL',
      'BANK_TRANSFER',
      'CASH_ON_ARRIVAL'
    ];
    
    for (const method of paymentMethods) {
      const testBooking = await prisma.booking.create({
        data: {
          studentId: testData.student.id,
          hostelId: testData.hostel.id,
          roomId: testData.room.id,
          startMonth: '2024-04',
          durationMonths: 1,
          status: 'PENDING'
        }
      });
      
      const testTransaction = await createTransaction(
        testBooking.id,
        method,
        testData.student.id
      );
      
      if (testTransaction.paymentMethod !== method) {
        throw new Error(`Payment method mismatch: expected ${method}, got ${testTransaction.paymentMethod}`);
      }
      
      console.log(`  ✓ ${method} works correctly`);
      
      // Clean up
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
      await prisma.booking.delete({ where: { id: testBooking.id } });
    }
    
    console.log('✅ PASSED: All payment methods work correctly');
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     All Integration Tests Passed! ✅                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up test data
    if (testData) {
      await cleanupTestData(testData);
    }
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCreateTransactionComplete().catch(console.error);
}

module.exports = { testCreateTransactionComplete };
