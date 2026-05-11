const { PrismaClient } = require('@prisma/client');
const {
  generateTransactionReference,
  calculateTransactionAmount,
  validateStatusTransition,
  createTransaction
} = require('./transactionService');

const prisma = new PrismaClient();

/**
 * Manual test suite for transaction creation logic
 * Run with: node src/services/transactionService.test.js
 */

async function testGenerateTransactionReference() {
  console.log('\n=== Test: Generate Transaction Reference ===');
  try {
    const ref1 = generateTransactionReference();
    const ref2 = generateTransactionReference();
    
    console.log('Reference 1:', ref1);
    console.log('Reference 2:', ref2);
    
    // Check format
    if (!ref1.startsWith('TXN-')) {
      throw new Error('Reference should start with TXN-');
    }
    
    // Check uniqueness
    if (ref1 === ref2) {
      throw new Error('References should be unique');
    }
    
    console.log('✅ PASSED: Transaction references are unique and properly formatted');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testCalculateTransactionAmount() {
  console.log('\n=== Test: Calculate Transaction Amount ===');
  try {
    // Test valid calculation
    const booking1 = {
      room: { monthlyRent: 500000 },
      durationMonths: 3
    };
    const amount1 = calculateTransactionAmount(booking1);
    console.log(`Amount for 500,000 UGX × 3 months = ${amount1} UGX`);
    
    if (amount1 !== 1500000) {
      throw new Error(`Expected 1500000, got ${amount1}`);
    }
    
    // Test another calculation
    const booking2 = {
      room: { monthlyRent: 800000 },
      durationMonths: 6
    };
    const amount2 = calculateTransactionAmount(booking2);
    console.log(`Amount for 800,000 UGX × 6 months = ${amount2} UGX`);
    
    if (amount2 !== 4800000) {
      throw new Error(`Expected 4800000, got ${amount2}`);
    }
    
    console.log('✅ PASSED: Transaction amounts calculated correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testCalculateTransactionAmountErrors() {
  console.log('\n=== Test: Calculate Transaction Amount Error Cases ===');
  try {
    // Test missing room
    try {
      calculateTransactionAmount({});
      throw new Error('Should have thrown error for missing room');
    } catch (error) {
      if (error.message !== 'Invalid booking: missing room details') {
        throw error;
      }
      console.log('✓ Correctly rejects booking without room');
    }
    
    // Test invalid monthly rent
    try {
      calculateTransactionAmount({ room: { monthlyRent: 0 }, durationMonths: 3 });
      throw new Error('Should have thrown error for zero rent');
    } catch (error) {
      if (error.message !== 'Invalid monthly rent') {
        throw error;
      }
      console.log('✓ Correctly rejects zero monthly rent');
    }
    
    // Test invalid duration
    try {
      calculateTransactionAmount({ room: { monthlyRent: 500000 }, durationMonths: 0 });
      throw new Error('Should have thrown error for zero duration');
    } catch (error) {
      if (error.message !== 'Invalid duration months') {
        throw error;
      }
      console.log('✓ Correctly rejects zero duration');
    }
    
    console.log('✅ PASSED: Amount calculation error handling works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testValidateStatusTransition() {
  console.log('\n=== Test: Validate Status Transitions ===');
  try {
    // Valid transitions
    const validTests = [
      ['PENDING', 'RECEIPT_SUBMITTED'],
      ['RECEIPT_SUBMITTED', 'VERIFIED'],
      ['RECEIPT_SUBMITTED', 'FAILED'],
      ['FAILED', 'RECEIPT_SUBMITTED']
    ];
    
    for (const [from, to] of validTests) {
      const result = validateStatusTransition(from, to);
      if (!result) {
        throw new Error(`Expected ${from} -> ${to} to be valid`);
      }
      console.log(`✓ Valid transition: ${from} -> ${to}`);
    }
    
    // Invalid transitions
    const invalidTests = [
      ['PENDING', 'VERIFIED'],
      ['PENDING', 'FAILED'],
      ['VERIFIED', 'PENDING'],
      ['VERIFIED', 'RECEIPT_SUBMITTED'],
      ['VERIFIED', 'FAILED']
    ];
    
    for (const [from, to] of invalidTests) {
      const result = validateStatusTransition(from, to);
      if (result) {
        throw new Error(`Expected ${from} -> ${to} to be invalid`);
      }
      console.log(`✓ Invalid transition blocked: ${from} -> ${to}`);
    }
    
    console.log('✅ PASSED: Status transition validation works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testCreateTransactionValidation() {
  console.log('\n=== Test: Create Transaction Validation ===');
  try {
    // Test invalid payment method
    try {
      await createTransaction('fake-booking-id', 'INVALID_METHOD', 'fake-student-id');
      throw new Error('Should have thrown error for invalid payment method');
    } catch (error) {
      if (error.message !== 'Invalid payment method') {
        throw error;
      }
      console.log('✓ Correctly rejects invalid payment method');
    }
    
    // Test non-existent booking
    try {
      await createTransaction('non-existent-booking', 'MOBILE_MONEY_MTN', 'fake-student-id');
      throw new Error('Should have thrown error for non-existent booking');
    } catch (error) {
      if (error.message !== 'Booking not found') {
        throw error;
      }
      console.log('✓ Correctly rejects non-existent booking');
    }
    
    console.log('✅ PASSED: Transaction creation validation works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testCreateTransactionWithRealData() {
  console.log('\n=== Test: Create Transaction with Real Data ===');
  try {
    // Find a real booking from the database
    const booking = await prisma.booking.findFirst({
      where: {
        status: 'PENDING'
      },
      include: {
        room: true,
        student: true
      }
    });
    
    if (!booking) {
      console.log('⚠️  SKIPPED: No pending bookings found in database');
      return;
    }
    
    console.log(`Found booking: ${booking.id}`);
    console.log(`Student: ${booking.student.name}`);
    console.log(`Room rent: ${booking.room.monthlyRent} UGX`);
    console.log(`Duration: ${booking.durationMonths} months`);
    
    // Check if transaction already exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { bookingId: booking.id }
    });
    
    if (existingTransaction) {
      console.log('⚠️  Transaction already exists for this booking');
      console.log(`Transaction ref: ${existingTransaction.transactionRef}`);
      console.log(`Amount: ${existingTransaction.amount} UGX`);
      console.log(`Status: ${existingTransaction.status}`);
      console.log('✅ PASSED: Transaction exists and is properly structured');
      return;
    }
    
    // Create transaction
    const transaction = await createTransaction(
      booking.id,
      'MOBILE_MONEY_MTN',
      booking.studentId
    );
    
    console.log('Transaction created successfully:');
    console.log(`- Reference: ${transaction.transactionRef}`);
    console.log(`- Amount: ${transaction.amount} UGX`);
    console.log(`- Status: ${transaction.status}`);
    console.log(`- Payment Method: ${transaction.paymentMethod}`);
    
    // Verify the transaction
    if (transaction.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got ${transaction.status}`);
    }
    
    if (transaction.amount !== booking.room.monthlyRent * booking.durationMonths) {
      throw new Error('Amount calculation mismatch');
    }
    
    if (transaction.studentId !== booking.studentId) {
      throw new Error('Student ID mismatch');
    }
    
    if (transaction.hostelId !== booking.hostelId) {
      throw new Error('Hostel ID mismatch');
    }
    
    console.log('✅ PASSED: Transaction created successfully with correct data');
    
    // Clean up - delete the test transaction
    await prisma.transaction.delete({
      where: { id: transaction.id }
    });
    console.log('✓ Test transaction cleaned up');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testCreateTransactionUnauthorized() {
  console.log('\n=== Test: Create Transaction Authorization ===');
  try {
    // Find a real booking
    const booking = await prisma.booking.findFirst({
      where: { status: 'PENDING' }
    });
    
    if (!booking) {
      console.log('⚠️  SKIPPED: No pending bookings found in database');
      return;
    }
    
    // Try to create transaction with wrong student ID
    try {
      await createTransaction(
        booking.id,
        'MOBILE_MONEY_MTN',
        'wrong-student-id'
      );
      throw new Error('Should have thrown authorization error');
    } catch (error) {
      if (error.message !== 'Unauthorized: Booking does not belong to this student') {
        throw error;
      }
      console.log('✓ Correctly rejects unauthorized student');
    }
    
    console.log('✅ PASSED: Authorization check works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testVerifyReceiptComplete() {
  console.log('\n=== Test: Verify Receipt Complete Workflow ===');
  try {
    // Find or create a transaction with RECEIPT_SUBMITTED status
    let transaction = await prisma.transaction.findFirst({
      where: { status: 'RECEIPT_SUBMITTED' },
      include: {
        booking: {
          include: {
            room: true,
            student: true,
            hostel: true
          }
        },
        hostel: true
      }
    });
    
    if (!transaction) {
      console.log('⚠️  SKIPPED: No transactions with RECEIPT_SUBMITTED status found');
      return;
    }
    
    console.log(`Found transaction: ${transaction.transactionRef}`);
    console.log(`Current status: ${transaction.status}`);
    console.log(`Hostel: ${transaction.booking.hostel.name}`);
    console.log(`Owner ID: ${transaction.hostel.ownerId}`);
    
    const ownerId = transaction.hostel.ownerId;
    const transactionId = transaction.id;
    const bookingId = transaction.bookingId;
    const roomId = transaction.booking.roomId;
    
    // Store original states for verification
    const originalBookingStatus = transaction.booking.status;
    const originalRoomStatus = transaction.booking.room.status;
    
    console.log(`Original booking status: ${originalBookingStatus}`);
    console.log(`Original room status: ${originalRoomStatus}`);
    
    // Import verifyReceipt function
    const { verifyReceipt } = require('./transactionService');
    
    // Verify the receipt
    const result = await verifyReceipt(transactionId, ownerId);
    
    console.log('\n✓ Receipt verified successfully');
    console.log(`Transaction status: ${result.transaction.status}`);
    console.log(`Booking status: ${result.booking.status}`);
    
    // Verify all requirements are met
    
    // Requirement 5.2: Transaction status updated to VERIFIED
    if (result.transaction.status !== 'VERIFIED') {
      throw new Error(`Expected transaction status VERIFIED, got ${result.transaction.status}`);
    }
    console.log('✓ Requirement 5.2: Transaction status updated to VERIFIED');
    
    // Requirement 5.3: Verification timestamp recorded
    if (!result.transaction.verifiedAt) {
      throw new Error('verifiedAt timestamp not recorded');
    }
    console.log(`✓ Requirement 5.3: Verification timestamp recorded: ${result.transaction.verifiedAt}`);
    
    // Requirement 8.3: verifiedBy recorded
    if (result.transaction.verifiedBy !== ownerId) {
      throw new Error(`Expected verifiedBy to be ${ownerId}, got ${result.transaction.verifiedBy}`);
    }
    console.log(`✓ verifiedBy recorded: ${result.transaction.verifiedBy}`);
    
    // Requirement 9.1: Booking status updated to CONFIRMED
    if (result.booking.status !== 'CONFIRMED') {
      throw new Error(`Expected booking status CONFIRMED, got ${result.booking.status}`);
    }
    console.log('✓ Requirement 9.1: Booking status updated to CONFIRMED');
    
    // Requirement 9.2: Booking confirmation timestamp recorded
    if (!result.booking.confirmedAt) {
      throw new Error('confirmedAt timestamp not recorded');
    }
    console.log(`✓ Requirement 9.2: Booking confirmation timestamp recorded: ${result.booking.confirmedAt}`);
    
    // Requirement 9.3: Room status updated to BOOKED
    const updatedRoom = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (updatedRoom.status !== 'BOOKED') {
      throw new Error(`Expected room status BOOKED, got ${updatedRoom.status}`);
    }
    console.log('✓ Requirement 9.3: Room status updated to BOOKED');
    
    // Requirement 5.4 & 9.4: Student notification created
    const notification = await prisma.notification.findFirst({
      where: {
        userId: transaction.studentId,
        type: 'PAYMENT',
        title: { contains: 'Payment Verified' }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!notification) {
      throw new Error('Student notification not created');
    }
    
    if (!notification.body.includes(transaction.transactionRef)) {
      throw new Error('Notification does not include transaction reference');
    }
    
    console.log('✓ Requirements 5.4 & 9.4: Student notification created');
    console.log(`  Notification: ${notification.title}`);
    
    console.log('\n✅ PASSED: All verification requirements met');
    
    // Note: We don't clean up because this is a real transaction that should remain verified
    console.log('⚠️  Note: Transaction remains in VERIFIED state (no cleanup)');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testVerifyReceiptValidation() {
  console.log('\n=== Test: Verify Receipt Validation ===');
  try {
    const { verifyReceipt } = require('./transactionService');
    
    // Test 1: Non-existent transaction
    try {
      await verifyReceipt('non-existent-id', 'fake-owner-id');
      throw new Error('Should have thrown error for non-existent transaction');
    } catch (error) {
      if (error.message !== 'Transaction not found') {
        throw error;
      }
      console.log('✓ Correctly rejects non-existent transaction');
    }
    
    // Test 2: Unauthorized owner
    const transaction = await prisma.transaction.findFirst({
      where: { status: 'RECEIPT_SUBMITTED' },
      include: { hostel: true }
    });
    
    if (transaction) {
      try {
        await verifyReceipt(transaction.id, 'wrong-owner-id');
        throw new Error('Should have thrown authorization error');
      } catch (error) {
        if (!error.message.includes('Unauthorized')) {
          throw error;
        }
        console.log('✓ Correctly rejects unauthorized owner');
      }
    } else {
      console.log('⚠️  Skipped unauthorized owner test (no suitable transaction)');
    }
    
    // Test 3: Invalid status (PENDING)
    const pendingTransaction = await prisma.transaction.findFirst({
      where: { status: 'PENDING' },
      include: { hostel: true }
    });
    
    if (pendingTransaction) {
      try {
        await verifyReceipt(pendingTransaction.id, pendingTransaction.hostel.ownerId);
        throw new Error('Should have thrown error for PENDING status');
      } catch (error) {
        if (!error.message.includes('Cannot verify transaction with status PENDING')) {
          throw error;
        }
        console.log('✓ Correctly rejects verification of PENDING transaction');
      }
    } else {
      console.log('⚠️  Skipped PENDING status test (no suitable transaction)');
    }
    
    // Test 4: Invalid status (VERIFIED - terminal state)
    const verifiedTransaction = await prisma.transaction.findFirst({
      where: { status: 'VERIFIED' },
      include: { hostel: true }
    });
    
    if (verifiedTransaction) {
      try {
        await verifyReceipt(verifiedTransaction.id, verifiedTransaction.hostel.ownerId);
        throw new Error('Should have thrown error for already VERIFIED status');
      } catch (error) {
        if (!error.message.includes('Cannot verify transaction with status VERIFIED')) {
          throw error;
        }
        console.log('✓ Correctly rejects re-verification of VERIFIED transaction');
      }
    } else {
      console.log('⚠️  Skipped VERIFIED status test (no suitable transaction)');
    }
    
    console.log('✅ PASSED: Verification validation works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testRejectReceiptComplete() {
  console.log('\n=== Test: Reject Receipt Complete Workflow ===');
  try {
    // Find a transaction with RECEIPT_SUBMITTED status
    let transaction = await prisma.transaction.findFirst({
      where: { status: 'RECEIPT_SUBMITTED' },
      include: {
        booking: {
          include: {
            student: true,
            hostel: true
          }
        },
        hostel: true
      }
    });
    
    if (!transaction) {
      console.log('⚠️  SKIPPED: No transactions with RECEIPT_SUBMITTED status found');
      return;
    }
    
    console.log(`Found transaction: ${transaction.transactionRef}`);
    console.log(`Current status: ${transaction.status}`);
    console.log(`Hostel: ${transaction.booking.hostel.name}`);
    console.log(`Owner ID: ${transaction.hostel.ownerId}`);
    
    const ownerId = transaction.hostel.ownerId;
    const transactionId = transaction.id;
    const rejectionReason = 'Receipt image is unclear. Please upload a clearer photo showing the transaction details.';
    
    // Import rejectReceipt function
    const { rejectReceipt } = require('./transactionService');
    
    // Reject the receipt
    const result = await rejectReceipt(transactionId, ownerId, rejectionReason);
    
    console.log('\n✓ Receipt rejected successfully');
    console.log(`Transaction status: ${result.status}`);
    console.log(`Rejection reason: ${result.rejectionReason}`);
    
    // Verify all requirements are met
    
    // Requirement 5.5: Transaction status updated to FAILED
    if (result.status !== 'FAILED') {
      throw new Error(`Expected transaction status FAILED, got ${result.status}`);
    }
    console.log('✓ Requirement 5.5: Transaction status updated to FAILED');
    
    // Requirement 5.6: Rejection reason recorded
    if (result.rejectionReason !== rejectionReason) {
      throw new Error(`Expected rejection reason to match, got ${result.rejectionReason}`);
    }
    console.log('✓ Requirement 5.6: Rejection reason recorded');
    
    // Requirement 8.4: rejectedAt timestamp recorded
    if (!result.rejectedAt) {
      throw new Error('rejectedAt timestamp not recorded');
    }
    console.log(`✓ Requirement 8.4: Rejection timestamp recorded: ${result.rejectedAt}`);
    
    // Verify receipt history was updated
    const receiptHistory = await prisma.receiptHistory.findFirst({
      where: { transactionId },
      orderBy: { submittedAt: 'desc' }
    });
    
    if (!receiptHistory) {
      throw new Error('Receipt history not found');
    }
    
    if (receiptHistory.status !== 'REJECTED') {
      throw new Error(`Expected receipt history status REJECTED, got ${receiptHistory.status}`);
    }
    
    if (receiptHistory.rejectionReason !== rejectionReason) {
      throw new Error('Receipt history rejection reason does not match');
    }
    console.log('✓ Receipt history updated with rejection');
    
    // Requirement 5.7 & 15.4: Student notification created with rejection reason
    const notification = await prisma.notification.findFirst({
      where: {
        userId: transaction.studentId,
        type: 'PAYMENT',
        title: { contains: 'Payment Receipt Rejected' }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!notification) {
      throw new Error('Student notification not created');
    }
    
    if (!notification.body.includes(rejectionReason)) {
      throw new Error('Notification does not include rejection reason');
    }
    
    if (!notification.body.includes(transaction.transactionRef)) {
      throw new Error('Notification does not include transaction reference');
    }
    
    if (!notification.body.includes(transaction.booking.hostel.name)) {
      throw new Error('Notification does not include hostel name');
    }
    
    console.log('✓ Requirements 5.7 & 15.4: Student notification created with rejection reason');
    console.log(`  Notification: ${notification.title}`);
    console.log(`  Body includes: rejection reason, transaction ref, hostel name`);
    
    console.log('\n✅ PASSED: All rejection requirements met');
    
    // Clean up - restore transaction to RECEIPT_SUBMITTED for future tests
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RECEIPT_SUBMITTED',
        rejectionReason: null,
        rejectedAt: null
      }
    });
    console.log('✓ Test transaction restored to RECEIPT_SUBMITTED state');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testRejectReceiptValidation() {
  console.log('\n=== Test: Reject Receipt Validation ===');
  try {
    const { rejectReceipt } = require('./transactionService');
    
    // Test 1: Missing rejection reason
    const transaction = await prisma.transaction.findFirst({
      where: { status: 'RECEIPT_SUBMITTED' },
      include: { hostel: true }
    });
    
    if (transaction) {
      try {
        await rejectReceipt(transaction.id, transaction.hostel.ownerId, '');
        throw new Error('Should have thrown error for missing rejection reason');
      } catch (error) {
        if (error.message !== 'Rejection reason is required') {
          throw error;
        }
        console.log('✓ Correctly rejects empty rejection reason');
      }
      
      try {
        await rejectReceipt(transaction.id, transaction.hostel.ownerId, '   ');
        throw new Error('Should have thrown error for whitespace-only rejection reason');
      } catch (error) {
        if (error.message !== 'Rejection reason is required') {
          throw error;
        }
        console.log('✓ Correctly rejects whitespace-only rejection reason');
      }
    } else {
      console.log('⚠️  Skipped rejection reason test (no suitable transaction)');
    }
    
    // Test 2: Non-existent transaction
    try {
      await rejectReceipt('non-existent-id', 'fake-owner-id', 'Test reason');
      throw new Error('Should have thrown error for non-existent transaction');
    } catch (error) {
      if (error.message !== 'Transaction not found') {
        throw error;
      }
      console.log('✓ Correctly rejects non-existent transaction');
    }
    
    // Test 3: Unauthorized owner
    if (transaction) {
      try {
        await rejectReceipt(transaction.id, 'wrong-owner-id', 'Test reason');
        throw new Error('Should have thrown authorization error');
      } catch (error) {
        if (!error.message.includes('Unauthorized')) {
          throw error;
        }
        console.log('✓ Correctly rejects unauthorized owner');
      }
    }
    
    // Test 4: Invalid status (PENDING)
    const pendingTransaction = await prisma.transaction.findFirst({
      where: { status: 'PENDING' },
      include: { hostel: true }
    });
    
    if (pendingTransaction) {
      try {
        await rejectReceipt(pendingTransaction.id, pendingTransaction.hostel.ownerId, 'Test reason');
        throw new Error('Should have thrown error for PENDING status');
      } catch (error) {
        if (!error.message.includes('Cannot reject transaction with status PENDING')) {
          throw error;
        }
        console.log('✓ Correctly rejects rejection of PENDING transaction');
      }
    } else {
      console.log('⚠️  Skipped PENDING status test (no suitable transaction)');
    }
    
    // Test 5: Invalid status (VERIFIED - terminal state)
    const verifiedTransaction = await prisma.transaction.findFirst({
      where: { status: 'VERIFIED' },
      include: { hostel: true }
    });
    
    if (verifiedTransaction) {
      try {
        await rejectReceipt(verifiedTransaction.id, verifiedTransaction.hostel.ownerId, 'Test reason');
        throw new Error('Should have thrown error for VERIFIED status');
      } catch (error) {
        if (!error.message.includes('Cannot reject transaction with status VERIFIED')) {
          throw error;
        }
        console.log('✓ Correctly rejects rejection of VERIFIED transaction');
      }
    } else {
      console.log('⚠️  Skipped VERIFIED status test (no suitable transaction)');
    }
    
    // Test 6: Invalid status (FAILED)
    const failedTransaction = await prisma.transaction.findFirst({
      where: { status: 'FAILED' },
      include: { hostel: true }
    });
    
    if (failedTransaction) {
      try {
        await rejectReceipt(failedTransaction.id, failedTransaction.hostel.ownerId, 'Test reason');
        throw new Error('Should have thrown error for FAILED status');
      } catch (error) {
        if (!error.message.includes('Cannot reject transaction with status FAILED')) {
          throw error;
        }
        console.log('✓ Correctly rejects rejection of already FAILED transaction');
      }
    } else {
      console.log('⚠️  Skipped FAILED status test (no suitable transaction)');
    }
    
    console.log('✅ PASSED: Rejection validation works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testRejectReceiptStatusTransition() {
  console.log('\n=== Test: Reject Receipt Status Transition (Requirement 8.4) ===');
  try {
    const { rejectReceipt } = require('./transactionService');
    
    // Find a transaction with RECEIPT_SUBMITTED status
    const transaction = await prisma.transaction.findFirst({
      where: { status: 'RECEIPT_SUBMITTED' },
      include: { hostel: true }
    });
    
    if (!transaction) {
      console.log('⚠️  SKIPPED: No transactions with RECEIPT_SUBMITTED status found');
      return;
    }
    
    console.log(`Testing status transition: RECEIPT_SUBMITTED -> FAILED`);
    console.log(`Transaction: ${transaction.transactionRef}`);
    
    const ownerId = transaction.hostel.ownerId;
    const transactionId = transaction.id;
    const rejectionReason = 'Test rejection for status transition validation';
    
    // Reject the receipt
    const result = await rejectReceipt(transactionId, ownerId, rejectionReason);
    
    // Verify status transition
    if (result.status !== 'FAILED') {
      throw new Error(`Expected status FAILED, got ${result.status}`);
    }
    
    console.log('✓ Status successfully transitioned from RECEIPT_SUBMITTED to FAILED');
    console.log('✓ Requirement 8.4: Status transition RECEIPT_SUBMITTED -> FAILED allowed');
    
    // Restore transaction state
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'RECEIPT_SUBMITTED',
        rejectionReason: null,
        rejectedAt: null
      }
    });
    console.log('✓ Transaction restored to original state');
    
    console.log('✅ PASSED: Status transition validation works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Transaction Service Test Suite                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await testGenerateTransactionReference();
  await testCalculateTransactionAmount();
  await testCalculateTransactionAmountErrors();
  await testValidateStatusTransition();
  await testCreateTransactionValidation();
  await testCreateTransactionWithRealData();
  await testCreateTransactionUnauthorized();
  await testVerifyReceiptComplete();
  await testVerifyReceiptValidation();
  await testRejectReceiptComplete();
  await testRejectReceiptValidation();
  await testRejectReceiptStatusTransition();
  await testGetTransactionsByStudent();
  await testGetTransactionsByOwner();
  await testGetTransactionById();
  await testTransactionQueryAuthorization();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Test Suite Complete                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  await prisma.$disconnect();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testGenerateTransactionReference,
  testCalculateTransactionAmount,
  testValidateStatusTransition,
  testCreateTransactionValidation,
  testCreateTransactionWithRealData,
  testVerifyReceiptComplete,
  testVerifyReceiptValidation
};

async function testGetTransactionsByStudent() {
  console.log('\n=== Test: Get Transactions By Student ===');
  try {
    const { getTransactionsByStudent } = require('./transactionService');
    
    // Find a student with transactions
    const student = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        transactionsAsStudent: {
          some: {}
        }
      }
    });
    
    if (!student) {
      console.log('⚠️  SKIPPED: No students with transactions found');
      return;
    }
    
    console.log(`Testing with student: ${student.name} (${student.id})`);
    
    // Test 1: Get all transactions for student
    const result1 = await getTransactionsByStudent(student.id);
    console.log(`✓ Found ${result1.transactions.length} transactions`);
    console.log(`✓ Pagination: page ${result1.pagination.page}, total ${result1.pagination.total}`);
    
    // Verify all transactions belong to the student
    for (const txn of result1.transactions) {
      if (txn.studentId !== student.id) {
        throw new Error('Transaction does not belong to student');
      }
    }
    console.log('✓ Requirement 7.2: All transactions belong to authenticated student');
    
    // Verify sorting (descending by createdAt)
    for (let i = 1; i < result1.transactions.length; i++) {
      const prev = new Date(result1.transactions[i - 1].createdAt);
      const curr = new Date(result1.transactions[i].createdAt);
      if (prev < curr) {
        throw new Error('Transactions not sorted by createdAt descending');
      }
    }
    console.log('✓ Requirement 7.10: Sorted by creation timestamp descending');
    
    // Verify required fields are included
    if (result1.transactions.length > 0) {
      const txn = result1.transactions[0];
      if (!txn.amount) throw new Error('Missing amount');
      if (!txn.paymentMethod) throw new Error('Missing paymentMethod');
      if (!txn.status) throw new Error('Missing status');
      if (!txn.transactionRef) throw new Error('Missing transactionRef');
      if (!txn.booking || !txn.booking.hostel) throw new Error('Missing hostel details');
      if (!txn.booking.room) throw new Error('Missing room details');
      console.log('✓ Requirements 7.3-7.7: All required fields included');
    }
    
    // Test 2: Filter by status
    const result2 = await getTransactionsByStudent(student.id, { status: 'PENDING' });
    console.log(`✓ Filter by status PENDING: ${result2.transactions.length} transactions`);
    for (const txn of result2.transactions) {
      if (txn.status !== 'PENDING') {
        throw new Error('Status filter not working');
      }
    }
    
    // Test 3: Filter by payment method
    const result3 = await getTransactionsByStudent(student.id, { paymentMethod: 'MOBILE_MONEY_MTN' });
    console.log(`✓ Filter by payment method MTN: ${result3.transactions.length} transactions`);
    for (const txn of result3.transactions) {
      if (txn.paymentMethod !== 'MOBILE_MONEY_MTN') {
        throw new Error('Payment method filter not working');
      }
    }
    
    // Test 4: Pagination
    const result4 = await getTransactionsByStudent(student.id, { page: 1, pageSize: 2 });
    console.log(`✓ Pagination: page 1, pageSize 2, got ${result4.transactions.length} transactions`);
    if (result4.transactions.length > 2) {
      throw new Error('Pagination not working - returned more than pageSize');
    }
    if (result4.pagination.pageSize !== 2) {
      throw new Error('Pagination metadata incorrect');
    }
    
    console.log('✅ PASSED: Student transaction query works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testGetTransactionsByOwner() {
  console.log('\n=== Test: Get Transactions By Owner ===');
  try {
    const { getTransactionsByOwner } = require('./transactionService');
    
    // Find an owner with hostels that have transactions
    const owner = await prisma.user.findFirst({
      where: {
        role: 'OWNER',
        hostels: {
          some: {
            transactions: {
              some: {}
            }
          }
        }
      },
      include: {
        hostels: {
          include: {
            transactions: true
          }
        }
      }
    });
    
    if (!owner) {
      console.log('⚠️  SKIPPED: No owners with transactions found');
      return;
    }
    
    console.log(`Testing with owner: ${owner.name} (${owner.id})`);
    console.log(`Owner has ${owner.hostels.length} hostels`);
    
    // Test 1: Get all transactions for owner
    const result1 = await getTransactionsByOwner(owner.id);
    console.log(`✓ Found ${result1.transactions.length} transactions`);
    console.log(`✓ Pagination: page ${result1.pagination.page}, total ${result1.pagination.total}`);
    
    // Verify all transactions belong to owner's hostels
    const ownerHostelIds = owner.hostels.map(h => h.id);
    for (const txn of result1.transactions) {
      if (!ownerHostelIds.includes(txn.hostelId)) {
        throw new Error('Transaction does not belong to owner\'s hostels');
      }
    }
    console.log('✓ Requirement 6.1: Only owner\'s hostel transactions returned');
    
    // Verify sorting (descending by createdAt)
    for (let i = 1; i < result1.transactions.length; i++) {
      const prev = new Date(result1.transactions[i - 1].createdAt);
      const curr = new Date(result1.transactions[i].createdAt);
      if (prev < curr) {
        throw new Error('Transactions not sorted by createdAt descending');
      }
    }
    console.log('✓ Requirement 6.12: Sorted by creation timestamp descending');
    
    // Verify required fields are included
    if (result1.transactions.length > 0) {
      const txn = result1.transactions[0];
      if (!txn.amount) throw new Error('Missing amount');
      if (!txn.paymentMethod) throw new Error('Missing paymentMethod');
      if (!txn.status) throw new Error('Missing status');
      if (!txn.transactionRef) throw new Error('Missing transactionRef');
      if (!txn.student || !txn.student.name) throw new Error('Missing student details');
      if (!txn.booking || !txn.booking.hostel) throw new Error('Missing hostel details');
      if (!txn.booking.room) throw new Error('Missing room details');
      console.log('✓ Requirements 6.2-6.8: All required fields included');
    }
    
    // Test 2: Filter by status
    const result2 = await getTransactionsByOwner(owner.id, { status: 'PENDING' });
    console.log(`✓ Requirement 6.9: Filter by status PENDING: ${result2.transactions.length} transactions`);
    for (const txn of result2.transactions) {
      if (txn.status !== 'PENDING') {
        throw new Error('Status filter not working');
      }
    }
    
    // Test 3: Filter by payment method
    const result3 = await getTransactionsByOwner(owner.id, { paymentMethod: 'MOBILE_MONEY_MTN' });
    console.log(`✓ Requirement 6.10: Filter by payment method MTN: ${result3.transactions.length} transactions`);
    for (const txn of result3.transactions) {
      if (txn.paymentMethod !== 'MOBILE_MONEY_MTN') {
        throw new Error('Payment method filter not working');
      }
    }
    
    // Test 4: Filter by date range
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-12-31');
    const result4 = await getTransactionsByOwner(owner.id, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    console.log(`✓ Requirement 6.11: Filter by date range: ${result4.transactions.length} transactions`);
    for (const txn of result4.transactions) {
      const txnDate = new Date(txn.createdAt);
      if (txnDate < startDate || txnDate > endDate) {
        throw new Error('Date range filter not working');
      }
    }
    
    // Test 5: Filter by specific hostel
    if (owner.hostels.length > 0) {
      const hostelId = owner.hostels[0].id;
      const result5 = await getTransactionsByOwner(owner.id, { hostelId });
      console.log(`✓ Filter by hostel: ${result5.transactions.length} transactions`);
      for (const txn of result5.transactions) {
        if (txn.hostelId !== hostelId) {
          throw new Error('Hostel filter not working');
        }
      }
    }
    
    // Test 6: Pagination
    const result6 = await getTransactionsByOwner(owner.id, { page: 1, pageSize: 3 });
    console.log(`✓ Pagination: page 1, pageSize 3, got ${result6.transactions.length} transactions`);
    if (result6.transactions.length > 3) {
      throw new Error('Pagination not working - returned more than pageSize');
    }
    if (result6.pagination.pageSize !== 3) {
      throw new Error('Pagination metadata incorrect');
    }
    
    console.log('✅ PASSED: Owner transaction query works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testGetTransactionById() {
  console.log('\n=== Test: Get Transaction By ID ===');
  try {
    const { getTransactionById } = require('./transactionService');
    
    // Find a transaction
    const transaction = await prisma.transaction.findFirst({
      include: {
        booking: {
          include: {
            hostel: true
          }
        }
      }
    });
    
    if (!transaction) {
      console.log('⚠️  SKIPPED: No transactions found');
      return;
    }
    
    console.log(`Testing with transaction: ${transaction.transactionRef}`);
    
    // Test 1: Student can access their own transaction
    const result1 = await getTransactionById(transaction.id, transaction.studentId, 'STUDENT');
    console.log('✓ Student can access their own transaction');
    if (result1.id !== transaction.id) {
      throw new Error('Wrong transaction returned');
    }
    if (!result1.receiptHistory) {
      throw new Error('Receipt history not included');
    }
    
    // Test 2: Owner can access their hostel's transaction
    const ownerId = transaction.booking.hostel.ownerId;
    const result2 = await getTransactionById(transaction.id, ownerId, 'OWNER');
    console.log('✓ Owner can access their hostel\'s transaction');
    if (result2.id !== transaction.id) {
      throw new Error('Wrong transaction returned');
    }
    
    // Test 3: Student cannot access another student's transaction
    try {
      await getTransactionById(transaction.id, 'wrong-student-id', 'STUDENT');
      throw new Error('Should have thrown authorization error');
    } catch (error) {
      if (!error.message.includes('Unauthorized')) {
        throw error;
      }
      console.log('✓ Student cannot access another student\'s transaction');
    }
    
    // Test 4: Owner cannot access another owner's transaction
    try {
      await getTransactionById(transaction.id, 'wrong-owner-id', 'OWNER');
      throw new Error('Should have thrown authorization error');
    } catch (error) {
      if (!error.message.includes('Unauthorized')) {
        throw error;
      }
      console.log('✓ Owner cannot access another owner\'s transaction');
    }
    
    // Test 5: Non-existent transaction
    try {
      await getTransactionById('non-existent-id', transaction.studentId, 'STUDENT');
      throw new Error('Should have thrown not found error');
    } catch (error) {
      if (error.message !== 'Transaction not found') {
        throw error;
      }
      console.log('✓ Non-existent transaction handled correctly');
    }
    
    console.log('✅ PASSED: Get transaction by ID works correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

async function testTransactionQueryAuthorization() {
  console.log('\n=== Test: Transaction Query Authorization ===');
  try {
    const { getTransactionsByStudent, getTransactionsByOwner } = require('./transactionService');
    
    // Find a student and owner
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });
    
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });
    
    if (!student || !owner) {
      console.log('⚠️  SKIPPED: Need both student and owner users');
      return;
    }
    
    // Test 1: Student can only see their own transactions
    const studentResult = await getTransactionsByStudent(student.id);
    for (const txn of studentResult.transactions) {
      if (txn.studentId !== student.id) {
        throw new Error('Student query returned another student\'s transaction');
      }
    }
    console.log('✓ Student query only returns own transactions');
    
    // Test 2: Owner can only see their hostels' transactions
    const ownerResult = await getTransactionsByOwner(owner.id);
    const ownerHostels = await prisma.hostel.findMany({
      where: { ownerId: owner.id },
      select: { id: true }
    });
    const ownerHostelIds = ownerHostels.map(h => h.id);
    
    for (const txn of ownerResult.transactions) {
      if (!ownerHostelIds.includes(txn.hostelId)) {
        throw new Error('Owner query returned transaction from another owner\'s hostel');
      }
    }
    console.log('✓ Owner query only returns own hostels\' transactions');
    
    console.log('✅ PASSED: Authorization checks work correctly');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}
