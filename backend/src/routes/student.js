const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get summary for Student Dashboard
router.get('/dashboard', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId: req.user.userId },
      include: {
        hostel: true,
        room: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const favourites = await prisma.favourite.findMany({
      where: { studentId: req.user.userId },
      include: {
        hostel: {
          include: { rooms: true }
        }
      }
    });

    res.json({ bookings, favourites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// Add to Favourites
router.post('/favourites', authenticate, requireRole(['STUDENT']), async (req, res) => {
  const { hostelId } = req.body;
  try {
    const favourite = await prisma.favourite.create({
      data: {
        studentId: req.user.userId,
        hostelId
      }
    });

    // Get hostel and admin details
    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, include: { owner: true }});
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }});

    if (hostel) {
      // Notify Owner
      await prisma.notification.create({
        data: {
          userId: hostel.ownerId,
          type: 'FAVOURITE',
          title: 'Someone loves your hostel! ❤️',
          body: `A student just added ${hostel.name} to their favourites.`,
        }
      });
      
      // Notify Admins
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'FAVOURITE',
            title: 'Hostel Pinned',
            body: `A student pinned ${hostel.name}.`,
          }
        });
      }
    }

    res.status(201).json(favourite);
  } catch (error) {
    // Check if unique constraint failed
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Hostel is already in favourites' });
    }
    res.status(500).json({ error: 'Failed to add favourite' });
  }
});

// Remove from Favourites
router.delete('/favourites/:hostelId', authenticate, requireRole(['STUDENT']), async (req, res) => {
  const { hostelId } = req.params;
  try {
    await prisma.favourite.deleteMany({
      where: {
        studentId: req.user.userId,
        hostelId
      }
    });
    res.json({ message: 'Removed from favourites' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favourite' });
  }
});

module.exports = router;
