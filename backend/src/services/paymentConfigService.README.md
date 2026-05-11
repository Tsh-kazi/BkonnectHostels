# Payment Configuration Service

This service manages payment configuration for hostels and generates payment instructions for students.

## Functions

### `getPaymentConfig(hostelId)`
Retrieves the payment configuration for a specific hostel.

**Parameters:**
- `hostelId` (string): The ID of the hostel

**Returns:** Promise<Object|null> - Payment configuration or null if not found

**Example:**
```javascript
const config = await getPaymentConfig('hostel-123');
```

### `updatePaymentConfig(hostelId, ownerId, configData)`
Creates or updates payment configuration for a hostel. Only the hostel owner can update the configuration.

**Parameters:**
- `hostelId` (string): The ID of the hostel
- `ownerId` (string): The ID of the owner (for authorization)
- `configData` (Object): Payment configuration data

**Configuration Data Fields:**
- `mtnMobileMoneyNumber` (string, optional): MTN Mobile Money number
- `airtelMoneyNumber` (string, optional): Airtel Money number
- `bankAccountName` (string, optional): Bank account name
- `bankAccountNumber` (string, optional): Bank account number
- `bankName` (string, optional): Bank name
- `bankBranch` (string, optional): Bank branch
- `cashInstructions` (string, optional): Instructions for cash payment

**Validation Rules:**
- Phone numbers must be in format: 07XXXXXXXX or 2567XXXXXXXX
- If any bank field is provided, all bank fields are required
- Bank account number must be alphanumeric
- Cash instructions must be 500 characters or less
- At least one payment method must be configured

**Returns:** Promise<Object> - Updated payment configuration

**Example:**
```javascript
const config = await updatePaymentConfig('hostel-123', 'owner-456', {
  mtnMobileMoneyNumber: '0772123456',
  airtelMoneyNumber: '0752123456',
  bankAccountName: 'John Doe Hostels',
  bankAccountNumber: '1234567890',
  bankName: 'Stanbic Bank',
  bankBranch: 'Kampala Road',
  cashInstructions: 'Visit the hostel office during business hours (9 AM - 5 PM)'
});
```

### `validatePaymentConfigData(configData)`
Validates payment configuration data. Throws an error if validation fails.

**Parameters:**
- `configData` (Object): Payment configuration data to validate

**Throws:** Error if validation fails

**Example:**
```javascript
try {
  validatePaymentConfigData(configData);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### `generatePaymentInstructions(paymentMethod, paymentConfig, amount, transactionRef)`
Generates payment instructions based on the payment method and configuration.

**Parameters:**
- `paymentMethod` (string): Payment method (MOBILE_MONEY_MTN, MOBILE_MONEY_AIRTEL, BANK_TRANSFER, CASH_ON_ARRIVAL)
- `paymentConfig` (Object): Payment configuration object
- `amount` (number): Transaction amount in UGX
- `transactionRef` (string): Transaction reference number

**Returns:** Object - Payment instructions with method-specific details

**Instruction Object Structure:**
```javascript
{
  method: 'MOBILE_MONEY_MTN',
  amount: 800000,
  transactionRef: 'TXN-1234567890-ABC123',
  currency: 'UGX',
  title: 'MTN Mobile Money Payment',
  merchantCode: '0772123456',
  steps: [
    'Dial *165# on your MTN phone',
    'Select option 4: Make Payment',
    // ... more steps
  ],
  note: 'Please upload your payment receipt after completing the transaction.'
}
```

**Example:**
```javascript
const instructions = generatePaymentInstructions(
  'MOBILE_MONEY_MTN',
  paymentConfig,
  800000,
  'TXN-1234567890-ABC123'
);
```

## Payment Methods

### MOBILE_MONEY_MTN
Generates instructions for MTN Mobile Money payment with USSD steps.

**Required Config:** `mtnMobileMoneyNumber`

### MOBILE_MONEY_AIRTEL
Generates instructions for Airtel Money payment with USSD steps.

**Required Config:** `airtelMoneyNumber`

### BANK_TRANSFER
Generates instructions for bank transfer with account details.

**Required Config:** `bankAccountName`, `bankAccountNumber`, `bankName`, `bankBranch`

### CASH_ON_ARRIVAL
Generates instructions for cash payment at the hostel.

**Required Config:** `cashInstructions` (optional, uses default if not provided)

## Error Handling

All functions throw descriptive errors for:
- Missing required parameters
- Invalid data formats
- Authorization failures
- Validation failures

Always wrap calls in try-catch blocks:

```javascript
try {
  const config = await updatePaymentConfig(hostelId, ownerId, configData);
} catch (error) {
  console.error('Error updating payment config:', error.message);
  // Handle error appropriately
}
```

## Integration with Transaction Service

This service is designed to work with the transaction service:

```javascript
const { createTransaction } = require('./transactionService');
const { getPaymentConfig, generatePaymentInstructions } = require('./paymentConfigService');

// Create transaction
const transaction = await createTransaction(bookingId, paymentMethod);

// Get payment config
const paymentConfig = await getPaymentConfig(transaction.hostelId);

// Generate instructions
const instructions = generatePaymentInstructions(
  transaction.paymentMethod,
  paymentConfig,
  transaction.amount,
  transaction.transactionRef
);

// Return to student
res.json({ transaction, instructions });
```

## Requirements Validated

This service validates the following requirements:
- 10.1: Configure MTN Mobile Money number
- 10.2: Configure Airtel Money number
- 10.3: Configure bank account name
- 10.4: Configure bank account number
- 10.5: Configure bank name
- 10.6: Configure bank branch
- 10.7: Configure cash payment instructions
- 10.8: Store payment configuration per hostel
- 10.9: Use hostel-specific payment configuration
- 1.1: Display MTN merchant code and instructions
- 1.2: Display Airtel merchant code and instructions
- 1.3: Display bank account details
- 1.4: Display cash payment instructions
- 1.5: Display exact amount to be paid
