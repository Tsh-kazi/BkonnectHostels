const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Booking (STUDENT only)
router.post('/', authenticate, requireRole(['STUDENT']), async (req, res) => {
  const { hostelId, roomId, startMonth, durationMonths, note } = req.body;

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const booking = await prisma.booking.create({
      data: {
        studentId: req.user.userId,
        hostelId,
        roomId,
        startMonth,
        durationMonths,
        note
      }
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'RESERVED' }
    });

    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }});
    if (hostel) {
      await prisma.notification.create({
        data: {
          userId: hostel.ownerId,
          type: 'BOOKING',
          title: 'New Booking Request! 🎉',
          body: `A student just reserved a room in ${hostel.name}. Please contact them.`,
          data: JSON.stringify({ bookingId: booking.id })
        }
      });
    }

    res.status(201).json({ message: 'Booking pending owner confirmation', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Confirm/Cancel Booking (OWNER only)
router.patch('/:id', authenticate, requireRole(['OWNER']), async (req, res) => {
  const { action } = req.body; // 'CONFIRM' or 'CANCEL'
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
    } else if (action === 'CANCEL') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' }
      });
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'AVAILABLE' }
      });
    }

    res.json({ message: `Booking ${action.toLowerCase()}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

module.exports = router;
