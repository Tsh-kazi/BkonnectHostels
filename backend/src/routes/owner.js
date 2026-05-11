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
      include: { room: true, student: true, hostel: true },
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

// Mock Photo Upload Endpoint
router.post('/upload-photo', authenticate, requireRole(['OWNER']), async (req, res) => {
  // In a real app, you would use multer and upload to AWS S3 here.
  // For this demo, we simulate upload delay and return a placeholder image.
  setTimeout(() => {
    res.json({ url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 100000)}?w=800&q=80` });
  }, 1000);
});

module.exports = router;
