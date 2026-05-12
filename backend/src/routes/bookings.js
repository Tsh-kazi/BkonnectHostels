const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Booking (STUDENT only)
router.post('/', authenticate, requireRole(['STUDENT']), async (req, res) => {
  const { hostelId, roomId, startMonth, durationMonths, paymentMethod, note, paymentCompleted } = req.body;

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const bookingStatus = paymentCompleted ? 'CONFIRMED' : 'PENDING';

    const booking = await prisma.booking.create({
      data: {
        studentId: req.user.userId,
        hostelId,
        roomId,
        startMonth,
        durationMonths,
        status: bookingStatus,
        confirmedAt: paymentCompleted ? new Date() : null,
        note
      }
    });

    const amount = room.monthlyRent * durationMonths;
    const pMethod = paymentMethod || 'CASH_ON_ARRIVAL';
    const transactionRef = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const transaction = await prisma.transaction.create({
      data: {
        transactionRef,
        bookingId: booking.id,
        studentId: req.user.userId,
        hostelId,
        amount,
        paymentMethod: pMethod,
        status: paymentCompleted ? 'VERIFIED' : 'PENDING',
        verifiedAt: paymentCompleted ? new Date() : null,
        verifiedBy: paymentCompleted ? 'SYSTEM' : null
      }
    });

    const roomNewStatus = paymentCompleted ? 'BOOKED' : (pMethod === 'CASH_ON_ARRIVAL' ? 'AVAILABLE' : 'RESERVED');
    await prisma.room.update({
      where: { id: roomId },
      data: { status: roomNewStatus }
    });

    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }});
    if (hostel) {
      await prisma.notification.create({
        data: {
          userId: hostel.ownerId,
          type: paymentCompleted ? 'PAYMENT_VERIFIED' : 'BOOKING',
          title: paymentCompleted ? 'New Confirmed Booking! 🎉' : 'New Booking Request! 🎉',
          body: paymentCompleted 
            ? `A student has booked and paid for a room in ${hostel.name} via ${pMethod.replace(/_/g, ' ')}.`
            : `A student just reserved a room in ${hostel.name}. They selected ${pMethod.replace(/_/g, ' ')}.`,
          data: JSON.stringify({ bookingId: booking.id })
        }
      });
    }

    res.status(201).json({ message: 'Booking processed successfully', booking, transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Confirm/Cancel Booking (OWNER only)
router.patch('/:id', authenticate, requireRole(['OWNER']), async (req, res) => {
  const { action, feedbackMessage } = req.body; // 'CONFIRM' or 'CANCEL'
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { hostel: true } });
    if (!booking || booking.hostel.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (action === 'CONFIRM') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'BOOKED' }
      });
      
      await prisma.notification.create({
        data: {
          userId: booking.studentId,
          type: 'BOOKING_CONFIRMED',
          title: 'Reservation Confirmed! 🎉',
          body: `Your reservation at ${booking.hostel.name} is confirmed.` + (feedbackMessage ? ` Owner says: "${feedbackMessage}"` : ''),
        }
      });
    } else if (action === 'CANCEL') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' }
      });
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'AVAILABLE' }
      });

      await prisma.notification.create({
        data: {
          userId: booking.studentId,
          type: 'BOOKING_CANCELLED',
          title: 'Reservation Declined ❌',
          body: `Your reservation at ${booking.hostel.name} was declined.` + (feedbackMessage ? ` Reason: "${feedbackMessage}"` : ''),
        }
      });
    }

    res.json({ message: `Booking ${action.toLowerCase()}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

// Archive Booking (STUDENT only)
router.put('/:id/archive', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.studentId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' }
    });

    // Make room available again
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'AVAILABLE' }
    });

    res.json({ message: 'Booking archived successfully' });
  } catch (error) {
    console.error('Error archiving booking:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
