const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a unique transaction reference
 * Format: TXN-{timestamp}-{random}
 * @returns {string} Unique transaction reference
 */
function generateTransactionReference() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Calculate transaction amount from booking details
 * Amount = room monthly rent × booking duration months
 * @param {Object} booking - Booking object with room details
 * @returns {number} Transaction amount in UGX
 */
function calculateTransactionAmount(booking) {
  if (!booking || !booking.room) {
    throw new Error('Invalid booking: missing room details');
  }
  
  const monthlyRent = booking.room.monthlyRent;
  const durationMonths = booking.durationMonths;
  
  if (!monthlyRent || monthlyRent <= 0) {
    throw new Error('Invalid monthly rent');
  }
  
  if (!durationMonths || durationMonths <= 0) {
    throw new Error('Invalid duration months');
  }
  
  return monthlyRent * durationMonths;
}

/**
 * Validate status transition according to payment workflow rules
 * Valid transitions:
 * - PENDING -> RECEIPT_SUBMITTED
 * - RECEIPT_SUBMITTED -> VERIFIED
 * - RECEIPT_SUBMITTED -> FAILED
 * - FAILED -> RECEIPT_SUBMITTED
 * Invalid transitions:
 * - VERIFIED -> any status (terminal state)
 * - PENDING -> VERIFIED
 * - PENDING -> COMPLETED
 * 
 * @param {string} currentStatus - Current transaction status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} True if transition is valid, false otherwise
 */
function validateStatusTransition(currentStatus, newStatus) {
  // Define valid status values
  const validStatuses = ['PENDING', 'RECEIPT_SUBMITTED', 'VERIFIED', 'FAILED'];
  
  // Check if statuses are valid
  if (!validStatuses.includes(currentStatus) || !validStatuses.includes(newStatus)) {
    return false;
  }
  
  // No transition needed if status is the same
  if (currentStatus === newStatus) {
    return true;
  }
  
  // Define valid transitions
  const validTransitions = {
    'PENDING': ['RECEIPT_SUBMITTED'],
    'RECEIPT_SUBMITTED': ['VERIFIED', 'FAILED'],
    'FAILED': ['RECEIPT_SUBMITTED'],
    'VERIFIED': [] // Terminal state - no transitions allowed
  };
  
  // Check if the transition is valid
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Create a new transaction for a booking
 * @param {string} bookingId - Booking ID
 * @param {string} paymentMethod - Payment method (MOBILE_MONEY_MTN, MOBILE_MONEY_AIRTEL, BANK_TRANSFER, CASH_ON_ARRIVAL)
 * @param {string} studentId - Student ID (for authorization)
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction(bookingId, paymentMethod, studentId) {
  // Validate payment method
  const validPaymentMethods = ['MOBILE_MONEY_MTN', 'MOBILE_MONEY_AIRTEL', 'BANK_TRANSFER', 'CASH_ON_ARRIVAL'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new Error('Invalid payment method');
  }
  
  // Fetch booking with room details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true }
  });
  
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // Validate booking belongs to authenticated student
  if (booking.studentId !== studentId) {
    throw new Error('Unauthorized: Booking does not belong to this student');
  }
  
  // Check if transaction already exists for this booking
  const existingTransaction = await prisma.transaction.findUnique({
    where: { bookingId: bookingId }
  });
  
  if (existingTransaction) {
    throw new Error('Transaction already exists for this booking');
  }
  
  // Calculate transaction amount
  const amount = calculateTransactionAmount(booking);
  
  // Validate amount
  if (amount <= 0) {
    throw new Error('Transaction amount must be greater than zero');
  }
  
  // Generate unique transaction reference
  const transactionRef = generateTransactionReference();
  
  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      transactionRef,
      bookingId,
      studentId: booking.studentId,
      hostelId: booking.hostelId,
      amount,
      paymentMethod,
      status: 'PENDING'
    }
  });
  
  return transaction;
}

/**
 * Upload receipt for a transaction
 * @param {string} transactionId - Transaction ID
 * @param {Object} file - Uploaded file object
 * @param {string} studentId - Student ID (for authorization)
 * @returns {Promise<Object>} Updated transaction
 */
async function uploadReceipt(transactionId, file, studentId) {
  // Fetch transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  // Verify student owns this transaction
  if (transaction.studentId !== studentId) {
    throw new Error('Unauthorized: Transaction does not belong to this student');
  }
  
  // Validate transaction status (must be PENDING or FAILED)
  if (!['PENDING', 'FAILED'].includes(transaction.status)) {
    throw new Error(`Cannot upload receipt for transaction with status ${transaction.status}`);
  }
  
  // Validate status transition
  if (!validateStatusTransition(transaction.status, 'RECEIPT_SUBMITTED')) {
    throw new Error('Invalid status transition');
  }
  
  // Update transaction with receipt details
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      receiptUrl: file.path,
      receiptType: file.mimetype,
      receiptSubmittedAt: new Date(),
      status: 'RECEIPT_SUBMITTED'
    }
  });
  
  // Create receipt history record
  await prisma.receiptHistory.create({
    data: {
      transactionId,
      receiptUrl: file.path,
      receiptType: file.mimetype,
      status: 'SUBMITTED'
    }
  });
  
  // Create notification for hostel owner
  const booking = await prisma.booking.findUnique({
    where: { id: transaction.bookingId },
    include: { hostel: true, student: true }
  });
  
  if (booking && booking.hostel) {
    await prisma.notification.create({
      data: {
        userId: booking.hostel.ownerId,
        type: 'PAYMENT',
        title: 'Payment Receipt Submitted 💰',
        body: `${booking.student.name} submitted a payment receipt for ${booking.hostel.name}. Transaction: ${transaction.transactionRef}`,
        data: JSON.stringify({ transactionId: transaction.id })
      }
    });
  }
  
  return updatedTransaction;
}

/**
 * Verify a payment receipt
 * @param {string} transactionId - Transaction ID
 * @param {string} ownerId - Owner ID (for authorization)
 * @returns {Promise<Object>} Updated transaction and booking
 */
async function verifyReceipt(transactionId, ownerId) {
  // Fetch transaction with related data
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      hostel: true,
      booking: { include: { room: true, student: true, hostel: true } }
    }
  });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  // Verify owner owns this hostel
  if (transaction.hostel.ownerId !== ownerId) {
    throw new Error('Unauthorized: Transaction does not belong to your hostel');
  }
  
  // Validate transaction status (must be RECEIPT_SUBMITTED)
  if (transaction.status !== 'RECEIPT_SUBMITTED') {
    throw new Error(`Cannot verify transaction with status ${transaction.status}`);
  }
  
  // Validate status transition
  if (!validateStatusTransition(transaction.status, 'VERIFIED')) {
    throw new Error('Invalid status transition');
  }
  
  // Update transaction status to VERIFIED
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: ownerId
    }
  });
  
  // Update booking status to CONFIRMED
  const updatedBooking = await prisma.booking.update({
    where: { id: transaction.bookingId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    }
  });
  
  // Update room status to BOOKED
  await prisma.room.update({
    where: { id: transaction.booking.roomId },
    data: { status: 'BOOKED' }
  });
  
  // Update receipt history
  const latestReceipt = await prisma.receiptHistory.findFirst({
    where: { transactionId },
    orderBy: { submittedAt: 'desc' }
  });
  
  if (latestReceipt) {
    await prisma.receiptHistory.update({
      where: { id: latestReceipt.id },
      data: { status: 'VERIFIED' }
    });
  }
  
  // Create notification for student
  if (transaction.booking && transaction.booking.student) {
    await prisma.notification.create({
      data: {
        userId: transaction.studentId,
        type: 'PAYMENT',
        title: 'Payment Verified ✅',
        body: `Your payment for ${transaction.booking.hostel.name} has been verified. Your booking is now confirmed! Transaction: ${transaction.transactionRef}`,
        data: JSON.stringify({ transactionId: transaction.id, bookingId: transaction.bookingId })
      }
    });
  }
  
  return { transaction: updatedTransaction, booking: updatedBooking };
}

/**
 * Reject a payment receipt
 * @param {string} transactionId - Transaction ID
 * @param {string} ownerId - Owner ID (for authorization)
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated transaction
 */
async function rejectReceipt(transactionId, ownerId, reason) {
  // Validate rejection reason
  if (!reason || reason.trim().length === 0) {
    throw new Error('Rejection reason is required');
  }
  
  // Fetch transaction with related data
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      hostel: true,
      booking: { include: { student: true, hostel: true } }
    }
  });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  // Verify owner owns this hostel
  if (transaction.hostel.ownerId !== ownerId) {
    throw new Error('Unauthorized: Transaction does not belong to your hostel');
  }
  
  // Validate transaction status (must be RECEIPT_SUBMITTED)
  if (transaction.status !== 'RECEIPT_SUBMITTED') {
    throw new Error(`Cannot reject transaction with status ${transaction.status}`);
  }
  
  // Validate status transition
  if (!validateStatusTransition(transaction.status, 'FAILED')) {
    throw new Error('Invalid status transition');
  }
  
  // Update transaction status to FAILED
  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'FAILED',
      rejectionReason: reason,
      rejectedAt: new Date()
    }
  });
  
  // Update receipt history
  const latestReceipt = await prisma.receiptHistory.findFirst({
    where: { transactionId },
    orderBy: { submittedAt: 'desc' }
  });
  
  if (latestReceipt) {
    await prisma.receiptHistory.update({
      where: { id: latestReceipt.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });
  }
  
  // Create notification for student
  if (transaction.booking && transaction.booking.student) {
    await prisma.notification.create({
      data: {
        userId: transaction.studentId,
        type: 'PAYMENT',
        title: 'Payment Receipt Rejected ❌',
        body: `Your payment receipt for ${transaction.booking.hostel.name} was rejected. Reason: ${reason}. Please resubmit a valid receipt. Transaction: ${transaction.transactionRef}`,
        data: JSON.stringify({ transactionId: transaction.id, reason })
      }
    });
  }
  
  return updatedTransaction;
}

/**
 * Get transactions for a student
 * @param {string} studentId - Student ID
 * @param {Object} filters - Filter options (status, paymentMethod, startDate, endDate, page, pageSize)
 * @returns {Promise<Object>} Object containing transactions array and pagination metadata
 */
async function getTransactionsByStudent(studentId, filters = {}) {
  const where = {
    studentId
  };
  
  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }
  
  // Pagination parameters
  const page = parseInt(filters.page) || 1;
  const pageSize = parseInt(filters.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  
  // Get total count for pagination metadata
  const total = await prisma.transaction.count({ where });
  
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      booking: {
        include: {
          hostel: true,
          room: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize
  });
  
  return {
    transactions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Get transactions for an owner
 * @param {string} ownerId - Owner ID
 * @param {Object} filters - Filter options (status, paymentMethod, startDate, endDate, hostelId, page, pageSize)
 * @returns {Promise<Object>} Object containing transactions array and pagination metadata
 */
async function getTransactionsByOwner(ownerId, filters = {}) {
  // First, get all hostels owned by this owner
  const hostels = await prisma.hostel.findMany({
    where: { ownerId },
    select: { id: true }
  });
  
  const hostelIds = hostels.map(h => h.id);
  
  const where = {
    hostelId: { in: hostelIds }
  };
  
  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }
  
  if (filters.hostelId) {
    // Filter by specific hostel if provided
    where.hostelId = filters.hostelId;
  }
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }
  
  // Pagination parameters
  const page = parseInt(filters.page) || 1;
  const pageSize = parseInt(filters.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  
  // Get total count for pagination metadata
  const total = await prisma.transaction.count({ where });
  
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      booking: {
        include: {
          hostel: true,
          room: true
        }
      },
      student: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize
  });
  
  return {
    transactions,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Get a single transaction by ID
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} userRole - User role (STUDENT or OWNER)
 * @returns {Promise<Object>} Transaction details
 */
async function getTransactionById(transactionId, userId, userRole) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      booking: {
        include: {
          hostel: true,
          room: true
        }
      },
      student: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      },
      receiptHistory: {
        orderBy: { submittedAt: 'desc' }
      }
    }
  });
  
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  // Authorization check
  if (userRole === 'STUDENT') {
    if (transaction.studentId !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to this student');
    }
  } else if (userRole === 'OWNER') {
    const hostel = await prisma.hostel.findUnique({
      where: { id: transaction.hostelId }
    });
    if (!hostel || hostel.ownerId !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to your hostel');
    }
  }
  
  return transaction;
}

module.exports = {
  generateTransactionReference,
  calculateTransactionAmount,
  validateStatusTransition,
  createTransaction,
  uploadReceipt,
  verifyReceipt,
  rejectReceipt,
  getTransactionsByStudent,
  getTransactionsByOwner,
  getTransactionById
};
