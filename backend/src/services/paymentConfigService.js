const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get payment configuration for a hostel
 * @param {string} hostelId - Hostel ID
 * @returns {Promise<Object|null>} Payment configuration or null if not found
 */
async function getPaymentConfig(hostelId) {
  if (!hostelId) {
    throw new Error('Hostel ID is required');
  }

  const paymentConfig = await prisma.paymentConfig.findUnique({
    where: { hostelId }
  });

  return paymentConfig;
}

/**
 * Update payment configuration for a hostel
 * @param {string} hostelId - Hostel ID
 * @param {string} ownerId - Owner ID (for authorization)
 * @param {Object} configData - Payment configuration data
 * @returns {Promise<Object>} Updated payment configuration
 */
async function updatePaymentConfig(hostelId, ownerId, configData) {
  if (!hostelId) {
    throw new Error('Hostel ID is required');
  }

  if (!ownerId) {
    throw new Error('Owner ID is required');
  }

  // Verify hostel exists and belongs to the owner
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId }
  });

  if (!hostel) {
    throw new Error('Hostel not found');
  }

  if (hostel.ownerId !== ownerId) {
    throw new Error('Unauthorized: You do not own this hostel');
  }

  // Validate payment configuration data
  validatePaymentConfigData(configData);

  // Check if payment config already exists
  const existingConfig = await prisma.paymentConfig.findUnique({
    where: { hostelId }
  });

  let paymentConfig;

  if (existingConfig) {
    // Update existing configuration
    paymentConfig = await prisma.paymentConfig.update({
      where: { hostelId },
      data: {
        mtnMobileMoneyNumber: configData.mtnMobileMoneyNumber || null,
        airtelMoneyNumber: configData.airtelMoneyNumber || null,
        bankAccountName: configData.bankAccountName || null,
        bankAccountNumber: configData.bankAccountNumber || null,
        bankName: configData.bankName || null,
        bankBranch: configData.bankBranch || null,
        cashInstructions: configData.cashInstructions || null
      }
    });
  } else {
    // Create new configuration
    paymentConfig = await prisma.paymentConfig.create({
      data: {
        hostelId,
        mtnMobileMoneyNumber: configData.mtnMobileMoneyNumber || null,
        airtelMoneyNumber: configData.airtelMoneyNumber || null,
        bankAccountName: configData.bankAccountName || null,
        bankAccountNumber: configData.bankAccountNumber || null,
        bankName: configData.bankName || null,
        bankBranch: configData.bankBranch || null,
        cashInstructions: configData.cashInstructions || null
      }
    });
  }

  return paymentConfig;
}

/**
 * Validate payment configuration data
 * @param {Object} configData - Payment configuration data to validate
 * @throws {Error} If validation fails
 */
function validatePaymentConfigData(configData) {
  if (!configData || typeof configData !== 'object') {
    throw new Error('Invalid payment configuration data');
  }

  // Validate MTN Mobile Money number format (if provided)
  if (configData.mtnMobileMoneyNumber) {
    if (typeof configData.mtnMobileMoneyNumber !== 'string') {
      throw new Error('MTN Mobile Money number must be a string');
    }
    // Basic phone number validation (Uganda format: 07XX or 256XXX)
    const phoneRegex = /^(0[7][0-9]{8}|256[7][0-9]{8})$/;
    if (!phoneRegex.test(configData.mtnMobileMoneyNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid MTN Mobile Money number format. Use format: 07XXXXXXXX or 2567XXXXXXXX');
    }
  }

  // Validate Airtel Money number format (if provided)
  if (configData.airtelMoneyNumber) {
    if (typeof configData.airtelMoneyNumber !== 'string') {
      throw new Error('Airtel Money number must be a string');
    }
    const phoneRegex = /^(0[7][0-9]{8}|256[7][0-9]{8})$/;
    if (!phoneRegex.test(configData.airtelMoneyNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid Airtel Money number format. Use format: 07XXXXXXXX or 2567XXXXXXXX');
    }
  }

  // Validate bank account details (if any bank field is provided, validate all)
  const bankFields = [
    configData.bankAccountName,
    configData.bankAccountNumber,
    configData.bankName,
    configData.bankBranch
  ];
  const hasBankFields = bankFields.some(field => field && field.trim().length > 0);

  if (hasBankFields) {
    if (!configData.bankAccountName || configData.bankAccountName.trim().length === 0) {
      throw new Error('Bank account name is required when providing bank details');
    }
    if (!configData.bankAccountNumber || configData.bankAccountNumber.trim().length === 0) {
      throw new Error('Bank account number is required when providing bank details');
    }
    if (!configData.bankName || configData.bankName.trim().length === 0) {
      throw new Error('Bank name is required when providing bank details');
    }
    if (!configData.bankBranch || configData.bankBranch.trim().length === 0) {
      throw new Error('Bank branch is required when providing bank details');
    }

    // Validate bank account name length
    if (configData.bankAccountName.length > 100) {
      throw new Error('Bank account name must be 100 characters or less');
    }

    // Validate bank account number format (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(configData.bankAccountNumber)) {
      throw new Error('Bank account number must contain only letters and numbers');
    }

    // Validate bank name length
    if (configData.bankName.length > 100) {
      throw new Error('Bank name must be 100 characters or less');
    }

    // Validate bank branch length
    if (configData.bankBranch.length > 100) {
      throw new Error('Bank branch must be 100 characters or less');
    }
  }

  // Validate cash instructions (if provided)
  if (configData.cashInstructions) {
    if (typeof configData.cashInstructions !== 'string') {
      throw new Error('Cash instructions must be a string');
    }
    if (configData.cashInstructions.length > 500) {
      throw new Error('Cash instructions must be 500 characters or less');
    }
  }

  // Ensure at least one payment method is configured
  const hasAtLeastOneMethod = 
    (configData.mtnMobileMoneyNumber && configData.mtnMobileMoneyNumber.trim().length > 0) ||
    (configData.airtelMoneyNumber && configData.airtelMoneyNumber.trim().length > 0) ||
    hasBankFields ||
    (configData.cashInstructions && configData.cashInstructions.trim().length > 0);

  if (!hasAtLeastOneMethod) {
    throw new Error('At least one payment method must be configured');
  }
}

/**
 * Generate payment instructions based on payment method and configuration
 * @param {string} paymentMethod - Payment method (MOBILE_MONEY_MTN, MOBILE_MONEY_AIRTEL, BANK_TRANSFER, CASH_ON_ARRIVAL)
 * @param {Object} paymentConfig - Payment configuration object
 * @param {number} amount - Transaction amount in UGX
 * @param {string} transactionRef - Transaction reference number
 * @returns {Object} Payment instructions object
 */
function generatePaymentInstructions(paymentMethod, paymentConfig, amount, transactionRef) {
  if (!paymentMethod) {
    throw new Error('Payment method is required');
  }

  if (!amount || amount <= 0) {
    throw new Error('Valid transaction amount is required');
  }

  if (!transactionRef) {
    throw new Error('Transaction reference is required');
  }

  const validPaymentMethods = ['MOBILE_MONEY_MTN', 'MOBILE_MONEY_AIRTEL', 'BANK_TRANSFER', 'CASH_ON_ARRIVAL'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new Error('Invalid payment method');
  }

  // Base instruction object
  const instructions = {
    method: paymentMethod,
    amount,
    transactionRef,
    currency: 'UGX'
  };

  // Generate method-specific instructions
  switch (paymentMethod) {
    case 'MOBILE_MONEY_MTN':
      instructions.title = 'MTN Mobile Money Payment';
      instructions.merchantCode = paymentConfig?.mtnMobileMoneyNumber || 'Not configured';
      instructions.steps = [
        'Dial *165# on your MTN phone',
        'Select option 4: Make Payment',
        'Select option 3: Enter Number',
        `Enter merchant number: ${instructions.merchantCode}`,
        `Enter amount: ${amount.toLocaleString()} UGX`,
        'Enter your PIN to confirm',
        `Use reference: ${transactionRef}`
      ];
      instructions.note = 'Please upload your payment receipt after completing the transaction.';
      break;

    case 'MOBILE_MONEY_AIRTEL':
      instructions.title = 'Airtel Money Payment';
      instructions.merchantCode = paymentConfig?.airtelMoneyNumber || 'Not configured';
      instructions.steps = [
        'Dial *185# on your Airtel phone',
        'Select option 5: Make Payment',
        'Select option 1: Enter Number',
        `Enter merchant number: ${instructions.merchantCode}`,
        `Enter amount: ${amount.toLocaleString()} UGX`,
        'Enter your PIN to confirm',
        `Use reference: ${transactionRef}`
      ];
      instructions.note = 'Please upload your payment receipt after completing the transaction.';
      break;

    case 'BANK_TRANSFER':
      instructions.title = 'Bank Transfer Payment';
      instructions.bankDetails = {
        accountName: paymentConfig?.bankAccountName || 'Not configured',
        accountNumber: paymentConfig?.bankAccountNumber || 'Not configured',
        bankName: paymentConfig?.bankName || 'Not configured',
        bankBranch: paymentConfig?.bankBranch || 'Not configured'
      };
      instructions.steps = [
        'Visit your bank or use mobile/internet banking',
        `Transfer ${amount.toLocaleString()} UGX to the account below:`,
        `Account Name: ${instructions.bankDetails.accountName}`,
        `Account Number: ${instructions.bankDetails.accountNumber}`,
        `Bank: ${instructions.bankDetails.bankName}`,
        `Branch: ${instructions.bankDetails.bankBranch}`,
        `Reference: ${transactionRef}`
      ];
      instructions.note = 'Please upload your bank transfer receipt or confirmation after completing the transaction.';
      break;

    case 'CASH_ON_ARRIVAL':
      instructions.title = 'Cash Payment on Arrival';
      instructions.cashInstructions = paymentConfig?.cashInstructions || 
        'Visit the hostel office to make your payment in person.';
      instructions.steps = [
        'Visit the hostel office in person',
        `Bring ${amount.toLocaleString()} UGX in cash`,
        `Quote your transaction reference: ${transactionRef}`,
        'Collect your payment receipt from the office',
        'Upload the receipt to confirm your payment'
      ];
      instructions.note = instructions.cashInstructions;
      break;

    default:
      throw new Error('Unsupported payment method');
  }

  return instructions;
}

module.exports = {
  getPaymentConfig,
  updatePaymentConfig,
  validatePaymentConfigData,
  generatePaymentInstructions
};
