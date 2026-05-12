const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get summary for Owner Dashboard
router.get('/dashboard', authenticate, requireRole(['OWNER']), async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      where: { ownerId: req.user.userId },
      include: {
        rooms: true,
        enquiries: { where: { status: 'NEW' } },
        bookings: { where: { status: 'PENDING' } }
      }
    });

    const bookings = await prisma.booking.findMany({
      where: { hostel: { ownerId: req.user.userId } },
      include: { room: true, student: true, hostel: true, transaction: true },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      totalHostels: hostels.length,
      totalRooms: hostels.reduce((acc, hostel) => acc + hostel.rooms.length, 0),
      pendingBookings: hostels.reduce((acc, hostel) => acc + hostel.bookings.length, 0),
      newEnquiries: hostels.reduce((acc, hostel) => acc + hostel.enquiries.length, 0),
      hostels,
      bookings
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// Update a Hostel's basic info
router.put('/hostels/:id', authenticate, requireRole(['OWNER']), async (req, res) => {
  try {
    const hostel = await prisma.hostel.findUnique({ where: { id: req.params.id } });
    if (!hostel || hostel.ownerId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

    const updatedHostel = await prisma.hostel.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ message: 'Hostel updated successfully', updatedHostel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hostel' });
  }
});

// Update a Room's info / status / pictures
router.put('/rooms/:roomId', authenticate, requireRole(['OWNER']), async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { id: req.params.roomId }, include: { hostel: true, photos: true } });
    if (!room || room.hostel.ownerId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { photoUrl, ...roomData } = req.body;
    
    // Convert string to ints if provided
    if (roomData.beds) roomData.beds = parseInt(roomData.beds);
    if (roomData.monthlyRent) roomData.monthlyRent = parseInt(roomData.monthlyRent);

    const updatedRoom = await prisma.room.update({
      where: { id: req.params.roomId },
      data: roomData
    });

    if (photoUrl) {
      if (room.photos && room.photos.length > 0) {
        await prisma.roomPhoto.update({
          where: { id: room.photos[0].id },
          data: { url: photoUrl }
        });
      } else {
        await prisma.roomPhoto.create({
          data: { url: photoUrl, roomId: room.id, order: 0 }
        });
      }
    }

    res.json({ message: 'Room updated successfully', updatedRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Mock Photo Upload Endpoint
router.post('/upload-photo', authenticate, requireRole(['OWNER']), async (req, res) => {
  // In a real app, you would use multer and upload to AWS S3 here.
  // For this demo, we simulate upload delay and return a placeholder image.
  setTimeout(() => {
    res.json({ url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 100000)}?w=800&q=80` });
  }, 1000);
});

// Verify or Reject Transaction
router.patch('/transactions/:id/verify', authenticate, requireRole(['OWNER']), async (req, res) => {
  const { action, rejectionReason, feedbackMessage } = req.body; // 'VERIFY' or 'REJECT'
  try {
    const transaction = await prisma.transaction.findUnique({ 
      where: { id: req.params.id },
      include: { hostel: true, booking: true }
    });

    if (!transaction || transaction.hostel.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (action === 'VERIFY') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: req.user.userId
        }
      });
      // Update Booking to CONFIRMED
      await prisma.booking.update({
        where: { id: transaction.bookingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });
      await prisma.room.update({
        where: { id: transaction.booking.roomId },
        data: { status: 'BOOKED' }
      });

      // Notify Student
      await prisma.notification.create({
        data: {
          userId: transaction.studentId,
          type: 'PAYMENT_VERIFIED',
          title: 'Payment Verified! 🎉',
          body: `Your payment for ${transaction.hostel.name} has been verified and your booking is confirmed.` + (feedbackMessage ? ` Owner says: "${feedbackMessage}"` : ''),
        }
      });
    } else if (action === 'REJECT') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason
        }
      });

      // Notify Student
      await prisma.notification.create({
        data: {
          userId: transaction.studentId,
          type: 'PAYMENT_REJECTED',
          title: 'Payment Rejected ❌',
          body: `Your payment for ${transaction.hostel.name} was rejected. Reason: ${rejectionReason || 'Invalid proof'}.` + (feedbackMessage ? ` Owner says: "${feedbackMessage}"` : ''),
        }
      });
    }

    res.json({ message: `Transaction ${action.toLowerCase()}ed successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

module.exports = router;
