const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get Hostels (Public with Pagination & Filters)
router.get('/', async (req, res) => {
  const { area, university, category, minRent, maxRent, onlyAvailable, page = 1, pageSize = 10 } = req.query;
  
  try {
    const where = { isApproved: true, isActive: true };
    if (area) where.area = area;
    if (university) {
      where.OR = [
        { university: { contains: university } },
        { area: { contains: university } },
        { description: { contains: university } }
      ];
    }
    if (category) where.category = category;
    
    // Simplistic handling for demo purposes
    // A true production system would join rooms to filter by minRent/maxRent
    const hostels = await prisma.hostel.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize),
      include: {
        rooms: true,
      }
    });
    
    res.json({ data: hostels, page, pageSize });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
});

// Get Hostel by ID
router.get('/:id', async (req, res) => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: req.params.id },
      include: {
        rooms: { include: { photos: true } },
        reviews: { where: { isApproved: true } },
      }
    });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    res.json(hostel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hostel details' });
  }
});

// Create Hostel (OWNER only)
router.post('/', authenticate, requireRole(['OWNER']), async (req, res) => {
  if (!req.user.isApproved) return res.status(403).json({ error: 'Owner account pending admin approval' });

  try {
    const owner = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    const hostel = await prisma.hostel.create({
      data: {
        ...req.body,
        contactPhone: req.body.contactPhone || owner.phone,
        whatsappNumber: req.body.whatsappNumber || owner.whatsappNumber || owner.phone,
        ownerId: req.user.userId,
        isApproved: false // Admin must approve
      }
    });
    res.status(201).json(hostel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hostel' });
  }
});

// Add Room to Hostel (OWNER only)
router.post('/:id/rooms', authenticate, requireRole(['OWNER']), async (req, res) => {
  try {
    // Verify ownership
    const hostel = await prisma.hostel.findUnique({ where: { id: req.params.id } });
    if (!hostel || hostel.ownerId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });

    const { photos, beds, monthlyRent, photoUrl, ...roomData } = req.body;

    const room = await prisma.room.create({
      data: {
        ...roomData,
        beds: parseInt(beds),
        monthlyRent: parseInt(monthlyRent),
        hostelId: req.params.id,
        photos: photos && photos.length > 0 ? {
          create: photos.map((url, idx) => ({ url, order: idx }))
        } : undefined
      },
      include: { photos: true }
    });
    res.status(201).json(room);
  } catch (error) {
    console.error("Room creation error:", error);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// Add Review (STUDENT only, must have stayed)
router.post('/:id/reviews', authenticate, requireRole(['STUDENT']), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Verify they have a confirmed booking
    const booking = await prisma.booking.findFirst({
      where: { hostelId: req.params.id, studentId: req.user.userId, status: 'CONFIRMED' }
    });
    
    if (!booking) {
      return res.status(403).json({ error: 'You must have a confirmed stay at this hostel to leave a review.' });
    }

    const review = await prisma.review.create({
      data: {
        hostelId: req.params.id,
        studentId: req.user.userId,
        rating: parseInt(rating),
        comment,
        isApproved: false // Admin must approve
      }
    });
    
    res.status(201).json({ message: 'Review submitted and pending approval.', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
