# Implementation Plan: Payment System Integration

## Overview

This implementation plan transforms the hostel reservation platform from a simple booking system into a comprehensive payment workflow with transaction tracking, receipt management, and verification capabilities. The implementation follows a layered approach: database schema updates, backend API development, file handling infrastructure, and frontend user interfaces for both students and owners.

The implementation uses JavaScript (Node.js/Express) for the backend and React for the frontend, building on the existing codebase structure.

## Tasks

- [x] 1. Set up database schema and payment infrastructure
  - [x] 1.1 Update Prisma schema with Transaction, ReceiptHistory, and PaymentConfig models
    - Add Transaction model with all required fields (transactionRef, amount, status, receipt fields, timestamps)
    - Add ReceiptHistory model for audit trail
    - Add PaymentConfig model for hostel-specific payment details
    - Update Booking model to add one-to-one relation with Transaction
    - Update User model to add transaction relations (StudentTransactions, VerifiedTransactions)
    - Update Hostel model to add transaction and payment config relations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.8_

  - [x] 1.2 Run Prisma migration and verify schema changes
    - Execute `npx prisma migrate dev --name add-payment-system`
    - Verify migration applied successfully
    - Generate Prisma client with `npx prisma generate`
    - _Requirements: 2.1_

  - [x] 1.3 Create file upload infrastructure
    - Create `/backend/uploads/receipts/` directory structure
    - Implement Multer middleware in `/backend/src/middleware/upload.js`
    - Configure file type validation (JPEG, PNG, PDF)
    - Configure file size limit (5MB)
    - Implement filename generation strategy (transactionId_timestamp.ext)
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 2. Implement transaction service and core business logic
  - [x] 2.1 Create transaction service module
    - Create `/backend/src/services/transactionService.js`
    - Implement `generateTransactionReference()` function (format: TXN-{timestamp}-{random})
    - Implement `calculateTransactionAmount(booking)` function
    - Implement `validateStatusTransition(currentStatus, newStatus)` function
    - Implement status transition rules enforcement
    - _Requirements: 2.2, 2.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.1, 13.2, 13.3_

  - [ ]* 2.2 Write property test for transaction reference uniqueness
    - **Property 1: Transaction Reference Uniqueness**
    - **Validates: Requirements 2.2, 11.5**
    - Generate multiple transactions and verify all references are unique
    - Test with concurrent transaction creation

  - [ ]* 2.3 Write property test for transaction amount calculation
    - **Property 3: Transaction Amount Calculation**
    - **Validates: Requirements 2.3, 13.1, 13.3**
    - Test with various room rents and duration combinations
    - Verify amount = monthlyRent × durationMonths

  - [ ]* 2.4 Write property test for status transition validation
    - **Property 13: Invalid Status Transition Prevention (VERIFIED Terminal State)**
    - **Property 14: Invalid Status Transition Prevention (PENDING to VERIFIED)**
    - **Validates: Requirements 8.6, 8.7**
    - Test all invalid status transitions are rejected
    - Test VERIFIED is a terminal state

  - [x] 2.5 Implement transaction creation logic
    - Implement `createTransaction(bookingId, paymentMethod)` function
    - Validate booking exists and belongs to authenticated student
    - Calculate transaction amount from booking details
    - Generate unique transaction reference
    - Create Transaction record with status PENDING
    - Link transaction to booking, student, and hostel
    - Return transaction with payment instructions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 2.6 Write property test for transaction creation
    - **Property 2: Transaction Creation on Booking**
    - **Property 4: Transaction Relationships**
    - **Property 5: Transaction Timestamp Recording**
    - **Validates: Requirements 2.1, 2.5, 2.6, 8.1**
    - Test transaction is created with PENDING status
    - Test all relationships are correctly established

  - [-] 2.7 Implement receipt upload logic
    - Implement `uploadReceipt(transactionId, file, studentId)` function
    - Validate transaction exists and belongs to student
    - Validate transaction status is PENDING or FAILED
    - Save receipt file to filesystem
    - Update transaction with receiptUrl, receiptType, receiptSubmittedAt
    - Transition status to RECEIPT_SUBMITTED
    - Create ReceiptHistory record
    - Trigger owner notification
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 8.2, 8.5, 12.2, 12.5_

  - [ ]* 2.8 Write property test for receipt upload status transition
    - **Property 6: Receipt Upload Status Transition**
    - **Property 7: Receipt Upload Notification**
    - **Validates: Requirements 3.6, 3.8, 8.2, 8.5, 12.3, 12.4, 15.2**
    - Test status transitions from PENDING to RECEIPT_SUBMITTED
    - Test status transitions from FAILED to RECEIPT_SUBMITTED
    - Test owner notification is created

  - [-] 2.9 Implement receipt verification logic
    - Implement `verifyReceipt(transactionId, ownerId)` function
    - Validate transaction exists and belongs to owner's hostel
    - Validate transaction status is RECEIPT_SUBMITTED
    - Update transaction status to VERIFIED
    - Record verifiedAt timestamp and verifiedBy
    - Update booking status to CONFIRMED with confirmedAt timestamp
    - Update room status to BOOKED
    - Trigger student notification
    - _Requirements: 5.2, 5.3, 5.4, 8.3, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 2.10 Write property test for verification workflow
    - **Property 8: Verification Status Transition**
    - **Property 9: Verification Timestamp Recording**
    - **Property 10: Verification Notification**
    - **Property 15: Booking Confirmation on Verification**
    - **Property 16: Room Status Update on Verification**
    - **Validates: Requirements 5.2, 5.3, 5.4, 8.3, 9.1, 9.2, 9.3, 9.4, 15.3**
    - Test complete verification workflow
    - Test booking and room status updates

  - [-] 2.11 Implement receipt rejection logic
    - Implement `rejectReceipt(transactionId, ownerId, reason)` function
    - Validate transaction exists and belongs to owner's hostel
    - Validate transaction status is RECEIPT_SUBMITTED
    - Update transaction status to FAILED
    - Record rejectionReason and rejectedAt timestamp
    - Update ReceiptHistory record with rejection
    - Trigger student notification with rejection reason
    - _Requirements: 5.5, 5.6, 5.7, 8.4, 15.4_

  - [ ]* 2.12 Write property test for rejection workflow
    - **Property 11: Rejection Status Transition**
    - **Property 12: Rejection Notification with Reason**
    - **Validates: Requirements 5.5, 5.7, 8.4, 15.4**
    - Test rejection status transition
    - Test rejection reason is included in notification

  - [ ] 2.13 Implement transaction query functions
    - Implement `getTransactionsByStudent(studentId, filters)` function
    - Implement `getTransactionsByOwner(ownerId, filters)` function
    - Implement `getTransactionById(transactionId, userId, userRole)` function
    - Add filtering by status, payment method, date range
    - Add sorting by creation timestamp (descending)
    - Add pagination support
    - Implement authorization checks (students see only their transactions, owners see only their hostels' transactions)
    - _Requirements: 6.1, 6.9, 6.10, 6.11, 6.12, 7.1, 7.2, 7.10_

  - [ ]* 2.14 Write unit tests for transaction query functions
    - Test student can only access their own transactions
    - Test owner can only access their hostels' transactions
    - Test filtering by status, payment method, date range
    - Test sorting and pagination

- [ ] 3. Checkpoint - Verify transaction service
  - Ensure all transaction service functions are implemented and tested
  - Verify status transition logic works correctly
  - Ask the user if questions arise

- [x] 4. Implement payment configuration management
  - [x] 4.1 Create payment configuration service
    - Create `/backend/src/services/paymentConfigService.js`
    - Implement `getPaymentConfig(hostelId)` function
    - Implement `updatePaymentConfig(hostelId, ownerId, configData)` function
    - Implement `generatePaymentInstructions(paymentMethod, paymentConfig, amount, transactionRef)` function
    - Add validation for payment configuration fields
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 4.2 Write unit tests for payment configuration service
    - Test payment config creation and updates
    - Test payment instructions generation for each method
    - Test authorization (only owner can update their hostel's config)

- [ ] 5. Implement backend API routes
  - [ ] 5.1 Create transaction routes
    - Create `/backend/src/routes/transactions.js`
    - Implement POST `/api/transactions` - Create transaction (STUDENT)
    - Implement GET `/api/transactions` - List transactions (filtered by role)
    - Implement GET `/api/transactions/:id` - Get transaction details
    - Implement POST `/api/transactions/:id/receipt` - Upload receipt (STUDENT)
    - Implement PATCH `/api/transactions/:id/verify` - Verify receipt (OWNER)
    - Implement PATCH `/api/transactions/:id/reject` - Reject receipt (OWNER)
    - Add authentication middleware to all routes
    - Add authorization checks based on user role
    - Implement error handling for all routes
    - _Requirements: 2.1, 3.1, 3.5, 4.1, 5.1, 5.2, 5.5, 6.1, 7.1_

  - [ ]* 5.2 Write integration tests for transaction routes
    - Test transaction creation endpoint
    - Test receipt upload endpoint with file validation
    - Test verification and rejection endpoints
    - Test authorization checks
    - Test error responses

  - [ ] 5.3 Create payment configuration routes
    - Create `/backend/src/routes/payment-config.js`
    - Implement GET `/api/hostels/:hostelId/payment-config` - Get payment config
    - Implement PUT `/api/hostels/:hostelId/payment-config` - Update payment config (OWNER)
    - Add authentication and authorization middleware
    - Implement error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ]* 5.4 Write integration tests for payment configuration routes
    - Test payment config retrieval
    - Test payment config updates
    - Test authorization (only owner can update)

  - [ ] 5.5 Update booking routes to integrate with transactions
    - Modify POST `/api/bookings` in `/backend/src/routes/bookings.js`
    - After booking creation, automatically create transaction
    - Return transaction details with booking response
    - Include payment instructions in response
    - _Requirements: 2.1, 11.1, 11.2_

  - [ ] 5.6 Register new routes in main application
    - Update `/backend/src/index.js` to register transaction routes
    - Update `/backend/src/index.js` to register payment config routes
    - Add static file serving for receipt files with authentication
    - Configure CORS for file uploads

- [ ] 6. Checkpoint - Verify backend API
  - Test all API endpoints with Postman or similar tool
  - Verify authentication and authorization work correctly
  - Verify file uploads work correctly
  - Ask the user if questions arise

- [ ] 7. Implement frontend payment instructions and receipt upload
  - [ ] 7.1 Create PaymentInstructions component
    - Create `/frontend/src/components/PaymentInstructions.jsx`
    - Display payment method-specific instructions
    - Display merchant codes for mobile money
    - Display bank account details for bank transfer
    - Display cash payment instructions
    - Display transaction amount and reference
    - Display hostel contact information
    - Style with Tailwind CSS
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 11.2_

  - [ ] 7.2 Create ReceiptUpload component
    - Create `/frontend/src/components/ReceiptUpload.jsx`
    - Implement drag-and-drop file upload interface
    - Implement file type validation (JPEG, PNG, PDF)
    - Implement file size validation (5MB max)
    - Display upload progress indicator
    - Display preview of uploaded receipt
    - Handle upload success and error states
    - Enable resubmission for FAILED transactions
    - Style with Tailwind CSS and Lucide icons
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.1_

  - [ ] 7.3 Create PaymentTimeline component
    - Create `/frontend/src/components/PaymentTimeline.jsx`
    - Display transaction creation timestamp
    - Display receipt submission timestamp (if applicable)
    - Display verification/rejection timestamp (if applicable)
    - Display current status with visual indicator
    - Display next action required
    - Style with Tailwind CSS
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ] 7.4 Update BookingPage to integrate payment flow
    - Modify `/frontend/src/pages/BookingPage.jsx`
    - After booking creation, display transaction details
    - Display PaymentInstructions component with transaction data
    - Display transaction reference prominently
    - Add link to transaction details page
    - Display PaymentTimeline component
    - _Requirements: 11.1, 11.2, 14.1_

  - [ ]* 7.5 Write unit tests for payment components
    - Test PaymentInstructions renders correctly for each method
    - Test ReceiptUpload validates files correctly
    - Test PaymentTimeline displays correct timeline

- [ ] 8. Implement frontend transaction dashboards
  - [ ] 8.1 Create ReceiptViewer component
    - Create `/frontend/src/components/ReceiptViewer.jsx`
    - Display image receipts with zoom capability
    - Display PDF receipts with download link
    - Display receipt submission timestamp
    - Display verification actions for owners (Verify/Reject buttons)
    - Implement rejection reason modal
    - Style with Tailwind CSS
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.6_

  - [ ] 8.2 Create TransactionDashboard page for owners
    - Create `/frontend/src/pages/TransactionDashboard.jsx`
    - Display table view of all transactions for owner's hostels
    - Display transaction amount, method, status, student info, hostel/room details
    - Implement filters for status, payment method, date range, hostel
    - Implement sorting by creation timestamp
    - Display summary statistics (total pending, verified, failed)
    - Add action buttons to view receipt, verify, reject
    - Integrate ReceiptViewer component
    - Style with Tailwind CSS
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12_

  - [ ] 8.3 Create TransactionHistory page for students
    - Create `/frontend/src/pages/TransactionHistory.jsx`
    - Display list view of student's transactions
    - Display transaction amount, method, status, hostel/room details, reference
    - Display status badges with color coding
    - Display receipt upload status
    - Display rejection reason for FAILED transactions
    - Add receipt upload button for PENDING/FAILED transactions
    - Integrate ReceiptUpload component
    - Integrate PaymentTimeline component
    - Style with Tailwind CSS
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [ ] 8.4 Create PaymentConfig page for owners
    - Create `/frontend/src/pages/PaymentConfig.jsx`
    - Display form for payment configuration
    - Add fields for MTN Mobile Money number
    - Add fields for Airtel Money number
    - Add fields for bank account details (name, number, bank, branch)
    - Add field for cash payment instructions
    - Implement form validation
    - Implement save functionality
    - Display success/error messages
    - Style with Tailwind CSS
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 8.5 Write unit tests for dashboard components
    - Test TransactionDashboard filters work correctly
    - Test TransactionHistory displays correct data
    - Test ReceiptViewer displays receipts correctly

- [ ] 9. Implement API integration and state management
  - [ ] 9.1 Create transaction API functions
    - Update `/frontend/src/api.js` with transaction endpoints
    - Implement `createTransaction(bookingId, paymentMethod)`
    - Implement `getTransactions(filters)`
    - Implement `getTransactionById(transactionId)`
    - Implement `uploadReceipt(transactionId, file)`
    - Implement `verifyReceipt(transactionId)`
    - Implement `rejectReceipt(transactionId, reason)`
    - Add error handling and response parsing

  - [ ] 9.2 Create payment configuration API functions
    - Update `/frontend/src/api.js` with payment config endpoints
    - Implement `getPaymentConfig(hostelId)`
    - Implement `updatePaymentConfig(hostelId, configData)`
    - Add error handling and response parsing

  - [ ] 9.3 Implement React Query hooks for transactions
    - Create custom hooks using TanStack Query
    - Implement `useTransactions(filters)` hook
    - Implement `useTransaction(transactionId)` hook
    - Implement `useCreateTransaction()` mutation hook
    - Implement `useUploadReceipt()` mutation hook
    - Implement `useVerifyReceipt()` mutation hook
    - Implement `useRejectReceipt()` mutation hook
    - Configure cache invalidation strategies

  - [ ] 9.4 Implement React Query hooks for payment config
    - Implement `usePaymentConfig(hostelId)` hook
    - Implement `useUpdatePaymentConfig()` mutation hook
    - Configure cache invalidation

- [ ] 10. Update navigation and routing
  - [ ] 10.1 Add transaction routes to application
    - Update `/frontend/src/App.jsx` with new routes
    - Add route for TransactionDashboard (owner)
    - Add route for TransactionHistory (student)
    - Add route for PaymentConfig (owner)
    - Add route for transaction details page
    - Implement role-based route protection

  - [ ] 10.2 Update navigation components
    - Update `/frontend/src/components/Navbar.jsx`
    - Add "Transactions" link for owners (to TransactionDashboard)
    - Add "My Payments" link for students (to TransactionHistory)
    - Add "Payment Settings" link for owners (to PaymentConfig)
    - Update OwnerDashboard to include link to TransactionDashboard
    - Update StudentDashboard to include link to TransactionHistory

- [ ] 11. Implement notification integration
  - [ ] 11.1 Update notification creation for payment events
    - Modify transaction service to create notifications
    - Create notification on transaction creation (to owner)
    - Create notification on receipt submission (to owner)
    - Create notification on verification (to student)
    - Create notification on rejection (to student)
    - Include transaction reference in all notifications
    - Include hostel name and student name in notifications
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

  - [ ]* 11.2 Write unit tests for notification integration
    - Test notifications are created for each payment event
    - Test notification content includes required information

- [ ] 12. Checkpoint - Verify complete payment flow
  - Test complete student flow: booking → payment instructions → receipt upload → notification
  - Test complete owner flow: notification → view receipt → verify/reject → booking confirmation
  - Test resubmission flow: rejection → student notification → resubmit → verification
  - Ask the user if questions arise

- [ ] 13. Add error handling and edge cases
  - [ ] 13.1 Implement comprehensive error handling
    - Add error boundaries in React components
    - Add user-friendly error messages for all failure scenarios
    - Add retry logic for transient failures
    - Add loading states for all async operations
    - Add validation error display in forms

  - [ ] 13.2 Handle edge cases
    - Handle missing payment configuration (display default instructions)
    - Handle file upload failures (display retry option)
    - Handle network errors (display offline message)
    - Handle concurrent verification attempts
    - Handle deleted bookings or rooms

  - [ ]* 13.3 Write integration tests for error scenarios
    - Test file upload with oversized file
    - Test file upload with invalid file type
    - Test verification of already verified transaction
    - Test unauthorized access attempts

- [ ] 14. Final integration and polish
  - [ ] 14.1 Add receipt history tracking
    - Implement receipt history display in transaction details
    - Show all previous receipt submissions
    - Show rejection reasons for each submission
    - _Requirements: 12.5_

  - [ ]* 14.2 Write property test for receipt history
    - **Property 17: Receipt Replacement on Resubmission**
    - **Property 18: Receipt History Maintenance**
    - **Validates: Requirements 12.2, 12.5**
    - Test receipt history is maintained across resubmissions

  - [ ] 14.3 Optimize performance
    - Add pagination to transaction lists
    - Implement lazy loading for receipt images
    - Add caching for payment configurations
    - Optimize database queries with proper indexes

  - [ ] 14.4 Add accessibility features
    - Add ARIA labels to all interactive elements
    - Ensure keyboard navigation works
    - Add screen reader support for status changes
    - Ensure color contrast meets WCAG standards

  - [ ] 14.5 Final testing and bug fixes
    - Perform end-to-end testing of complete payment flow
    - Test on different browsers and devices
    - Fix any discovered bugs
    - Verify all requirements are met

- [ ] 15. Final checkpoint - Complete verification
  - Ensure all tests pass
  - Verify all requirements are implemented
  - Verify all acceptance criteria are met
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation builds on the existing Express/React/Prisma stack
- File uploads use Multer middleware with local filesystem storage
- Authentication uses existing JWT middleware
- Notifications use existing notification system
- All monetary amounts are in UGX (Ugandan Shillings)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.1"] },
    { "id": 4, "tasks": ["2.6", "2.7", "4.2"] },
    { "id": 5, "tasks": ["2.8", "2.9"] },
    { "id": 6, "tasks": ["2.10", "2.11"] },
    { "id": 7, "tasks": ["2.12", "2.13"] },
    { "id": 8, "tasks": ["2.14", "5.1"] },
    { "id": 9, "tasks": ["5.2", "5.3"] },
    { "id": 10, "tasks": ["5.4", "5.5"] },
    { "id": 11, "tasks": ["5.6", "7.1"] },
    { "id": 12, "tasks": ["7.2", "7.3"] },
    { "id": 13, "tasks": ["7.4", "8.1"] },
    { "id": 14, "tasks": ["7.5", "8.2"] },
    { "id": 15, "tasks": ["8.3", "8.4"] },
    { "id": 16, "tasks": ["8.5", "9.1", "9.2"] },
    { "id": 17, "tasks": ["9.3", "9.4"] },
    { "id": 18, "tasks": ["10.1", "10.2"] },
    { "id": 19, "tasks": ["11.1"] },
    { "id": 20, "tasks": ["11.2", "13.1"] },
    { "id": 21, "tasks": ["13.2"] },
    { "id": 22, "tasks": ["13.3", "14.1"] },
    { "id": 23, "tasks": ["14.2", "14.3", "14.4"] },
    { "id": 24, "tasks": ["14.5"] }
  ]
}
```
