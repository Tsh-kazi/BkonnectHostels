const { PrismaClient } = require('@prisma/client');
const {
  createTransaction,
  uploadReceipt,
  verifyReceipt
} = require('./transactionService');

const prisma = new PrismaClient();

/**
 * Integration test for verifyReceipt function
 * Tests the complete workflow: create transaction -> upload receipt -> verify receipt
 * Run with: node src/services/verifyReceipt.integration.test.js
 */

async function setupTestData() {
  console.log('\n=== Setting Up Test Data ===');
  
  // Find or create a student
  let student = await prisma.user.findFirst({
    where: { role: 'STUDENT' }
  });
  
  if (!student) {
    console.log('Creating test student...');
    student = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: `test.student.${Date.now()}@example.com`,
        phone: '0771234567',
        password: 'hashedpassword',
        role: 'STUDENT'
      }
    });
  }
  
  console.log(`✓ Student: ${student.name} (${student.id})`);
  
  // Find or create an owner
  let owner = await prisma.user.findFirst({
    where: { role: 'OWNER' }
  });
  
  if (!owner) {
    console.log('Creating test owner...');
    owner = await prisma.user.create({
      data: {
        name: 'Test Owner',
        email: `test.owner.${Date.now()}@example.com`,
        phone: '0771234568',
        password: 'hashedpassword',
        role: 'OWNER'
      }
    });
  }
  
  console.log(`✓ Owner: ${owner.name} (${owner.id})`);
  
  // Find or create a hostel
  let hostel = await prisma.hostel.findFirst({
    where: { ownerId: owner.id }
  });
  
  if (!hostel) {
    console.log('Creating test hostel...');
    hostel = await prisma.hostel.create({
      data: {
        name: 'Test Hostel',
        location: 'Test Location',
        description: 'Test Description',
        category: 'MIXED',
        ownerId: owner.id
      }
    });
  }
  
  console.log(`✓ Hostel: ${hostel.name} (${hostel.id})`);
  
  // Find or create a room
  let room = await prisma.room.findFirst({
    where: {
      hostelId: hostel.id,
      status: 'AVAILABLE'
    }
  });
  
  if (!room) {
    console.log('Creating test room...');
    room = await prisma.room.create({
      data: {
        hostelId: hostel.id,
        roomType: 'Single',
        monthlyRent: 500000,
        status: 'AVAILABLE'
      }
    });
  }
  
  console.log(`✓ Room: ${room.roomType} - ${room.monthlyRent} UGX (${room.id})`);
  
  // Create a booking
  console.log('Creating test booking...');
  const booking = await prisma.booking.create({
    data: {
      studentId: student.id,
      hostelId: hostel.id,
      roomId: room.id,
      durationMonths: 3,
      status: 'PENDING'
    }
  });
  
  console.log(`✓ Booking created (${booking.id})`);
  
  return { student, owner, hostel, room, booking };
}

async function cleanupTestData(transactionId, bookingId) {
  console.log('\n=== Cleaning Up Test Data ===');
  
  try {
    // Delete receipt history
    await prisma.receiptHistory.deleteMany({
      where: { transactionId }
    });
    console.log('✓ Receipt history deleted');
    
    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    });
    console.log('✓ Transaction deleted');
    
    // Delete booking
    await prisma.booking.delete({
      where: { id: bookingId }
    });
    console.log('✓ Booking deleted');
    
    // Note: We don't delete student, owner, hostel, or room as they might be used by other tests
    
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

async function testVerifyReceiptCompleteWorkflow() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Integration Test: Verify Receipt Complete Workflow       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  let transactionId, bookingId;
  
  try {
    // Setup test data
    const { student, owner, hostel, room, booking } = await setupTestData();
    bookingId = booking.id;
    
    // Step 1: Create transaction
    console.log('\n=== Step 1: Create Transaction ===');
    const transaction = await createTransaction(
      booking.id,
      'MOBILE_MONEY_MTN',
      student.id
    );
    transactionId = transaction.id;
    
    console.log(`✓ Transaction created: ${transaction.transactionRef}`);
    console.log(`  Status: ${transaction.status}`);
    console.log(`  Amount: ${transaction.amount} UGX`);
    
    if (transaction.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got ${transaction.status}`);
    }
    
    // Step 2: Upload receipt
    console.log('\n=== Step 2: Upload Receipt ===');
    const mockFile = {
      path: '/uploads/receipts/test-receipt.jpg',
      mimetype: 'image/jpeg'
    };
    
    const updatedTransaction = await uploadReceipt(
      transaction.id,
      mockFile,
      student.id
    );
    
    console.log(`✓ Receipt uploaded`);
    console.log(`  Status: ${updatedTransaction.status}`);
    console.log(`  Receipt URL: ${updatedTransaction.receiptUrl}`);
    console.log(`  Submitted at: ${updatedTransaction.receiptSubmittedAt}`);
    
    if (updatedTransaction.status !== 'RECEIPT_SUBMITTED') {
      throw new Error(`Expected status RECEIPT_SUBMITTED, got ${updatedTransaction.status}`);
    }
    
    // Verify receipt history was created
    const receiptHistory = await prisma.receiptHistory.findFirst({
      where: { transactionId: transaction.id }
    });
    
    if (!receiptHistory) {
      throw new Error('Receipt history not created');
    }
    console.log(`✓ Receipt history created`);
    
    // Verify owner notification was created
    const ownerNotification = await prisma.notification.findFirst({
      where: {
        userId: owner.id,
        type: 'PAYMENT',
        title: { contains: 'Receipt Submitted' }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!ownerNotification) {
      throw new Error('Owner notification not created');
    }
    console.log(`✓ Owner notification created: "${ownerNotification.title}"`);
    
    // Step 3: Verify receipt
    console.log('\n=== Step 3: Verify Receipt ===');
    const result = await verifyReceipt(transaction.id, owner.id);
    
    console.log(`✓ Receipt verified`);
    console.log(`  Transaction status: ${result.transaction.status}`);
    console.log(`  Verified at: ${result.transaction.verifiedAt}`);
    console.log(`  Verified by: ${result.transaction.verifiedBy}`);
    console.log(`  Booking status: ${result.booking.status}`);
    console.log(`  Confirmed at: ${result.booking.confirmedAt}`);
    
    // Verify all requirements
    console.log('\n=== Verifying Requirements ===');
    
    // Requirement 5.2: Transaction status updated to VERIFIED
    if (result.transaction.status !== 'VERIFIED') {
      throw new Error(`Expected transaction status VERIFIED, got ${result.transaction.status}`);
    }
    console.log('✅ Requirement 5.2: Transaction status updated to VERIFIED');
    
    // Requirement 5.3: Verification timestamp recorded
    if (!result.transaction.verifiedAt) {
      throw new Error('verifiedAt timestamp not recorded');
    }
    console.log('✅ Requirement 5.3: Verification timestamp recorded');
    
    // Requirement 8.3: verifiedBy recorded
    if (result.transaction.verifiedBy !== owner.id) {
      throw new Error(`Expected verifiedBy to be ${owner.id}, got ${result.transaction.verifiedBy}`);
    }
    console.log('✅ Requirement 8.3: verifiedBy recorded');
    
    // Requirement 9.1: Booking status updated to CONFIRMED
    if (result.booking.status !== 'CONFIRMED') {
      throw new Error(`Expected booking status CONFIRMED, got ${result.booking.status}`);
    }
    console.log('✅ Requirement 9.1: Booking status updated to CONFIRMED');
    
    // Requirement 9.2: Booking confirmation timestamp recorded
    if (!result.booking.confirmedAt) {
      throw new Error('confirmedAt timestamp not recorded');
    }
    console.log('✅ Requirement 9.2: Booking confirmation timestamp recorded');
    
    // Requirement 9.3: Room status updated to BOOKED
    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id }
    });
    if (updatedRoom.status !== 'BOOKED') {
      throw new Error(`Expected room status BOOKED, got ${updatedRoom.status}`);
    }
    console.log('✅ Requirement 9.3: Room status updated to BOOKED');
    
    // Requirement 5.4 & 9.4: Student notification created
    const studentNotification = await prisma.notification.findFirst({
      where: {
        userId: student.id,
        type: 'PAYMENT',
        title: { contains: 'Payment Verified' }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!studentNotification) {
      throw new Error('Student notification not created');
    }
    
    if (!studentNotification.body.includes(transaction.transactionRef)) {
      throw new Error('Notification does not include transaction reference');
    }
    
    console.log('✅ Requirements 5.4 & 9.4: Student notification created');
    console.log(`   Notification: "${studentNotification.title}"`);
    
    // Verify receipt history was updated
    const updatedReceiptHistory = await prisma.receiptHistory.findFirst({
      where: { transactionId: transaction.id },
      orderBy: { submittedAt: 'desc' }
    });
    
    if (updatedReceiptHistory.status !== 'VERIFIED') {
      throw new Error(`Expected receipt history status VERIFIED, got ${updatedReceiptHistory.status}`);
    }
    console.log('✅ Receipt history updated to VERIFIED');
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL TESTS PASSED - verifyReceipt meets all requirements ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (transactionId && bookingId) {
      await cleanupTestData(transactionId, bookingId);
    }
    await prisma.$disconnect();
  }
}

async function testVerifyReceiptValidationErrors() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Integration Test: Verify Receipt Validation Errors       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  let transactionId, bookingId;
  
  try {
    // Setup test data
    const { student, owner, hostel, room, booking } = await setupTestData();
    bookingId = booking.id;
    
    // Create transaction
    const transaction = await createTransaction(
      booking.id,
      'MOBILE_MONEY_MTN',
      student.id
    );
    transactionId = transaction.id;
    
    console.log(`✓ Test transaction created: ${transaction.transactionRef}`);
    
    // Test 1: Cannot verify PENDING transaction
    console.log('\n=== Test 1: Cannot verify PENDING transaction ===');
    try {
      await verifyReceipt(transaction.id, owner.id);
      throw new Error('Should have thrown error for PENDING status');
    } catch (error) {
      if (!error.message.includes('Cannot verify transaction with status PENDING')) {
        throw error;
      }
      console.log('✅ Correctly rejects verification of PENDING transaction');
    }
    
    // Upload receipt to change status to RECEIPT_SUBMITTED
    const mockFile = {
      path: '/uploads/receipts/test-receipt.jpg',
      mimetype: 'image/jpeg'
    };
    await uploadReceipt(transaction.id, mockFile, student.id);
    console.log('✓ Receipt uploaded, status now RECEIPT_SUBMITTED');
    
    // Test 2: Unauthorized owner cannot verify
    console.log('\n=== Test 2: Unauthorized owner cannot verify ===');
    try {
      await verifyReceipt(transaction.id, 'wrong-owner-id');
      throw new Error('Should have thrown authorization error');
    } catch (error) {
      if (!error.message.includes('Unauthorized')) {
        throw error;
      }
      console.log('✅ Correctly rejects unauthorized owner');
    }
    
    // Test 3: Verify successfully
    console.log('\n=== Test 3: Successful verification ===');
    const result = await verifyReceipt(transaction.id, owner.id);
    console.log(`✅ Receipt verified successfully, status: ${result.transaction.status}`);
    
    // Test 4: Cannot verify already VERIFIED transaction (terminal state)
    console.log('\n=== Test 4: Cannot re-verify VERIFIED transaction ===');
    try {
      await verifyReceipt(transaction.id, owner.id);
      throw new Error('Should have thrown error for already VERIFIED status');
    } catch (error) {
      if (!error.message.includes('Cannot verify transaction with status VERIFIED')) {
        throw error;
      }
      console.log('✅ Correctly rejects re-verification of VERIFIED transaction');
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL VALIDATION TESTS PASSED                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (transactionId && bookingId) {
      await cleanupTestData(transactionId, bookingId);
    }
    await prisma.$disconnect();
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  verifyReceipt Integration Test Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await testVerifyReceiptCompleteWorkflow();
  await testVerifyReceiptValidationErrors();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  All Integration Tests Complete                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testVerifyReceiptCompleteWorkflow,
  testVerifyReceiptValidationErrors
};
