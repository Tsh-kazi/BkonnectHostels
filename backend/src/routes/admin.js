const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get Admin Dashboard Summary
router.get('/dashboard', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const pendingOwners = await prisma.user.findMany({
      where: { role: 'OWNER', isApproved: false }
    });

    const pendingHostels = await prisma.hostel.findMany({
      where: { isApproved: false },
      include: { owner: true }
    });

    const pendingReviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: { student: true, hostel: true }
    });

    res.json({ pendingOwners, pendingHostels, pendingReviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

// Approve Owner
router.patch('/approve/owner/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    res.json({ message: 'Owner approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve owner' });
  }
});

// Approve Hostel
router.patch('/approve/hostel/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.hostel.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    res.json({ message: 'Hostel approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve hostel' });
  }
});

// Approve Review
router.patch('/approve/review/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true }
    });
    res.json({ message: 'Review approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

// Global Bookings (Admin View All)
router.get('/bookings', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { hostel: true, student: true, room: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global bookings' });
  }
});

// Get Universities
router.get('/universities', async (req, res) => {
  try {
    const universities = await prisma.university.findMany({ orderBy: { name: 'asc' }});
    res.json(universities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// Add University
router.post('/universities', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, city, country } = req.body;
    const university = await prisma.university.create({
      data: { name, city, country }
    });
    res.status(201).json(university);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'University already exists' });
    res.status(500).json({ error: 'Failed to add university' });
  }
});

// ==========================================
// SUPER ADMIN GOD MODE CAPABILITIES
// ==========================================

// Get All Users (Students & Owners)
router.get('/users', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['STUDENT', 'OWNER'] } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete/Ban User
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted permanently' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get All Approved Hostels
router.get('/hostels', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: { owner: true, _count: { select: { rooms: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(hostels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hostels' });
  }
});

// Delete Hostel
router.delete('/hostels/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.hostel.delete({ where: { id: req.params.id } });
    res.json({ message: 'Hostel deleted permanently' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hostel' });
  }
});

// Get Global Activity Feed
router.get('/activity', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50 // Get the 50 most recent events
    });
    
    // Also fetch the 10 most recent bookings to supplement the feed
    const recentBookings = await prisma.booking.findMany({
      include: { student: true, hostel: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({ notifications, recentBookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

module.exports = router;
