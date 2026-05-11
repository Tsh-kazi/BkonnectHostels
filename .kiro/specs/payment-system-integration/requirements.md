# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive payment system integration for the hostel reservation platform. The current system allows students to select payment methods and create bookings, but lacks actual payment processing, receipt management, and transaction tracking. This feature will add payment instructions, receipt upload/verification, transaction tracking, and a comprehensive transaction dashboard to enable complete payment workflow management.

## Glossary

- **Payment_System**: The software component responsible for managing payment processing, receipt handling, and transaction tracking
- **Transaction**: A record of a payment attempt or completion, including amount, method, status, and associated booking
- **Payment_Receipt**: Digital proof of payment uploaded by a student (image, PDF, or document)
- **Payment_Method**: The mechanism used for payment (MTN Mobile Money, Airtel Money, Bank Transfer, or Cash on Arrival)
- **Payment_Instructions**: Merchant codes, account numbers, or guidance provided to students for completing payment
- **Transaction_Dashboard**: Administrative interface displaying all transactions with filtering and verification capabilities
- **Payment_Status**: Current state of a transaction (PENDING, RECEIPT_SUBMITTED, VERIFIED, COMPLETED, FAILED)
- **Verification**: Process by which a hostel owner confirms that payment has been received
- **Transaction_Reference**: Unique identifier for tracking a specific payment transaction
- **Student**: User with role STUDENT who makes bookings and payments
- **Hostel_Owner**: User with role OWNER who receives payments and verifies receipts
- **Booking**: A reservation record linking a student to a hostel room for a specific duration

## Requirements

### Requirement 1: Payment Instructions Display

**User Story:** As a student, I want to receive specific payment instructions for my chosen payment method, so that I know exactly how to complete my payment.

#### Acceptance Criteria

1. WHEN a student selects MTN Mobile Money as payment method, THE Payment_System SHALL display MTN merchant code and payment instructions
2. WHEN a student selects Airtel Money as payment method, THE Payment_System SHALL display Airtel merchant code and payment instructions
3. WHEN a student selects Bank Transfer as payment method, THE Payment_System SHALL display bank account details including account name, account number, bank name, and branch
4. WHEN a student selects Cash on Arrival as payment method, THE Payment_System SHALL display instructions for in-person payment at the hostel
5. THE Payment_System SHALL display the exact amount to be paid for each payment method
6. THE Payment_System SHALL display the hostel owner's contact information alongside payment instructions

### Requirement 2: Transaction Record Creation

**User Story:** As a system, I want to create a transaction record when a booking is confirmed, so that all payment activities can be tracked.

#### Acceptance Criteria

1. WHEN a booking is created, THE Payment_System SHALL create a Transaction record with status PENDING
2. THE Payment_System SHALL generate a unique Transaction_Reference for each transaction
3. THE Payment_System SHALL record the transaction amount equal to room monthly rent multiplied by duration months
4. THE Payment_System SHALL record the selected Payment_Method in the transaction
5. THE Payment_System SHALL link the transaction to the booking, student, and hostel
6. THE Payment_System SHALL record the transaction creation timestamp

### Requirement 3: Payment Receipt Upload

**User Story:** As a student, I want to upload proof of payment after making a payment, so that the hostel owner can verify my payment.

#### Acceptance Criteria

1. WHEN a student has a pending transaction, THE Payment_System SHALL display an upload interface for Payment_Receipt
2. THE Payment_System SHALL accept image files (JPEG, PNG) as Payment_Receipt
3. THE Payment_System SHALL accept PDF files as Payment_Receipt
4. THE Payment_System SHALL validate that uploaded files are under 5MB in size
5. WHEN a student uploads a Payment_Receipt, THE Payment_System SHALL store the receipt file securely
6. WHEN a Payment_Receipt is uploaded, THE Payment_System SHALL update transaction status to RECEIPT_SUBMITTED
7. WHEN a Payment_Receipt is uploaded, THE Payment_System SHALL record the submission timestamp
8. WHEN a Payment_Receipt is uploaded, THE Payment_System SHALL notify the Hostel_Owner

### Requirement 4: Payment Receipt Viewing

**User Story:** As a hostel owner, I want to view payment receipts submitted by students, so that I can verify payments have been made.

#### Acceptance Criteria

1. WHEN a Hostel_Owner views a transaction with status RECEIPT_SUBMITTED, THE Payment_System SHALL display the uploaded Payment_Receipt
2. THE Payment_System SHALL render image receipts directly in the interface
3. THE Payment_System SHALL provide a download link for PDF receipts
4. THE Payment_System SHALL display receipt submission timestamp
5. THE Payment_System SHALL display student information alongside the receipt

### Requirement 5: Payment Verification

**User Story:** As a hostel owner, I want to verify or reject payment receipts, so that I can confirm legitimate payments and flag issues.

#### Acceptance Criteria

1. WHEN a Hostel_Owner views a transaction with status RECEIPT_SUBMITTED, THE Payment_System SHALL display verification actions (Verify or Reject)
2. WHEN a Hostel_Owner verifies a receipt, THE Payment_System SHALL update transaction status to VERIFIED
3. WHEN a Hostel_Owner verifies a receipt, THE Payment_System SHALL record the verification timestamp
4. WHEN a Hostel_Owner verifies a receipt, THE Payment_System SHALL notify the Student
5. WHEN a Hostel_Owner rejects a receipt, THE Payment_System SHALL update transaction status to FAILED
6. WHEN a Hostel_Owner rejects a receipt, THE Payment_System SHALL allow entry of a rejection reason
7. WHEN a Hostel_Owner rejects a receipt, THE Payment_System SHALL notify the Student with the rejection reason

### Requirement 6: Transaction Dashboard

**User Story:** As a hostel owner, I want to view all transactions in a dashboard, so that I can manage payments efficiently.

#### Acceptance Criteria

1. THE Payment_System SHALL display a transaction dashboard accessible to Hostel_Owner users
2. THE Payment_System SHALL display transaction amount for each transaction
3. THE Payment_System SHALL display Payment_Method for each transaction
4. THE Payment_System SHALL display Payment_Status for each transaction
5. THE Payment_System SHALL display student name and contact information for each transaction
6. THE Payment_System SHALL display hostel name and room details for each transaction
7. THE Payment_System SHALL display transaction creation timestamp for each transaction
8. THE Payment_System SHALL display Transaction_Reference for each transaction
9. THE Payment_System SHALL provide filtering by Payment_Status
10. THE Payment_System SHALL provide filtering by Payment_Method
11. THE Payment_System SHALL provide filtering by date range
12. THE Payment_System SHALL sort transactions by creation timestamp in descending order by default

### Requirement 7: Student Transaction History

**User Story:** As a student, I want to view my payment history, so that I can track my payments and their status.

#### Acceptance Criteria

1. THE Payment_System SHALL display a transaction history accessible to Student users
2. THE Payment_System SHALL display only transactions belonging to the authenticated Student
3. THE Payment_System SHALL display transaction amount for each transaction
4. THE Payment_System SHALL display Payment_Method for each transaction
5. THE Payment_System SHALL display Payment_Status for each transaction
6. THE Payment_System SHALL display hostel name and room details for each transaction
7. THE Payment_System SHALL display Transaction_Reference for each transaction
8. THE Payment_System SHALL display whether a Payment_Receipt has been uploaded
9. WHEN a transaction status is FAILED, THE Payment_System SHALL display the rejection reason
10. THE Payment_System SHALL sort transactions by creation timestamp in descending order

### Requirement 8: Payment Status Workflow

**User Story:** As a system, I want to enforce a valid payment status workflow, so that transactions progress through proper states.

#### Acceptance Criteria

1. WHEN a transaction is created, THE Payment_System SHALL set initial status to PENDING
2. THE Payment_System SHALL allow status transition from PENDING to RECEIPT_SUBMITTED
3. THE Payment_System SHALL allow status transition from RECEIPT_SUBMITTED to VERIFIED
4. THE Payment_System SHALL allow status transition from RECEIPT_SUBMITTED to FAILED
5. THE Payment_System SHALL allow status transition from FAILED to RECEIPT_SUBMITTED
6. THE Payment_System SHALL prevent status transition from VERIFIED to any other status
7. THE Payment_System SHALL prevent status transition from PENDING to VERIFIED
8. THE Payment_System SHALL prevent status transition from PENDING to COMPLETED

### Requirement 9: Booking Confirmation Integration

**User Story:** As a system, I want to automatically confirm bookings when payments are verified, so that the reservation process is completed.

#### Acceptance Criteria

1. WHEN a transaction status changes to VERIFIED, THE Payment_System SHALL update the associated booking status to CONFIRMED
2. WHEN a transaction status changes to VERIFIED, THE Payment_System SHALL record the booking confirmation timestamp
3. WHEN a transaction status changes to VERIFIED, THE Payment_System SHALL update the associated room status to BOOKED
4. WHEN a booking is confirmed via payment verification, THE Payment_System SHALL notify the Student

### Requirement 10: Payment Method Configuration

**User Story:** As a hostel owner, I want to configure my payment details, so that students receive my correct payment information.

#### Acceptance Criteria

1. THE Payment_System SHALL allow Hostel_Owner to configure MTN Mobile Money number
2. THE Payment_System SHALL allow Hostel_Owner to configure Airtel Money number
3. THE Payment_System SHALL allow Hostel_Owner to configure bank account name
4. THE Payment_System SHALL allow Hostel_Owner to configure bank account number
5. THE Payment_System SHALL allow Hostel_Owner to configure bank name
6. THE Payment_System SHALL allow Hostel_Owner to configure bank branch
7. THE Payment_System SHALL allow Hostel_Owner to configure cash payment instructions
8. THE Payment_System SHALL store payment configuration per hostel
9. WHEN payment instructions are displayed, THE Payment_System SHALL use the hostel-specific payment configuration

### Requirement 11: Transaction Reference Display

**User Story:** As a student, I want to see my transaction reference number, so that I can reference it when making payment or contacting support.

#### Acceptance Criteria

1. WHEN a transaction is created, THE Payment_System SHALL display the Transaction_Reference to the Student
2. THE Payment_System SHALL display the Transaction_Reference on the payment instructions page
3. THE Payment_System SHALL display the Transaction_Reference in the student transaction history
4. THE Payment_System SHALL display the Transaction_Reference in email notifications
5. THE Transaction_Reference SHALL be unique across all transactions

### Requirement 12: Receipt Resubmission

**User Story:** As a student, I want to resubmit a payment receipt if it was rejected, so that I can correct any issues.

#### Acceptance Criteria

1. WHEN a transaction status is FAILED, THE Payment_System SHALL display the receipt upload interface to the Student
2. WHEN a student uploads a new receipt for a FAILED transaction, THE Payment_System SHALL replace the previous receipt
3. WHEN a student uploads a new receipt for a FAILED transaction, THE Payment_System SHALL update status to RECEIPT_SUBMITTED
4. WHEN a receipt is resubmitted, THE Payment_System SHALL notify the Hostel_Owner
5. THE Payment_System SHALL maintain a history of all receipt submissions for a transaction

### Requirement 13: Transaction Amount Validation

**User Story:** As a system, I want to validate transaction amounts, so that payment records are accurate.

#### Acceptance Criteria

1. WHEN a transaction is created, THE Payment_System SHALL calculate amount as room monthly rent multiplied by booking duration months
2. THE Payment_System SHALL validate that transaction amount is greater than zero
3. THE Payment_System SHALL validate that transaction amount matches the booking total
4. THE Payment_System SHALL prevent transaction creation if amount validation fails
5. THE Payment_System SHALL display the calculated amount to the Student before transaction creation

### Requirement 14: Payment Timeline Display

**User Story:** As a student, I want to see the timeline of my payment, so that I understand the payment progress.

#### Acceptance Criteria

1. THE Payment_System SHALL display payment timeline showing transaction creation timestamp
2. WHEN a receipt is submitted, THE Payment_System SHALL display receipt submission timestamp in the timeline
3. WHEN a payment is verified, THE Payment_System SHALL display verification timestamp in the timeline
4. WHEN a payment is rejected, THE Payment_System SHALL display rejection timestamp in the timeline
5. THE Payment_System SHALL display the current Payment_Status prominently in the timeline
6. THE Payment_System SHALL display next action required in the timeline

### Requirement 15: Notification System Integration

**User Story:** As a user, I want to receive notifications about payment events, so that I stay informed about payment status changes.

#### Acceptance Criteria

1. WHEN a transaction is created, THE Payment_System SHALL create a notification for the Hostel_Owner
2. WHEN a receipt is submitted, THE Payment_System SHALL create a notification for the Hostel_Owner
3. WHEN a payment is verified, THE Payment_System SHALL create a notification for the Student
4. WHEN a payment is rejected, THE Payment_System SHALL create a notification for the Student
5. THE Payment_System SHALL include Transaction_Reference in all payment notifications
6. THE Payment_System SHALL include hostel name in all payment notifications
7. THE Payment_System SHALL include student name in all payment notifications to owners
