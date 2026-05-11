const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const PHOTOS = [
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1c24226133?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
  'https://images.unsplash.com/photo-1583847268964-b28ce8f31586?w=800&q=80',
  'https://images.unsplash.com/photo-1499955085172-a104c9463ece?w=800&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
  'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80'
];

const getPhoto = (i) => PHOTOS[i % PHOTOS.length];

async function main() {
  console.log('Seeding PRODUCTION database with Bugema University specific hostels...')
  
  await prisma.review.deleteMany()
  await prisma.roomPhoto.deleteMany()
  await prisma.room.deleteMany()
  await prisma.hostel.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('admin123', 10)
  const ownerPasswordHash = await bcrypt.hash('owner123', 10)

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Bugema System Admin',
      email: 'admin@kampalahostels.com',
      phone: '+256700000000',
      passwordHash: passwordHash,
      role: 'ADMIN',
      isApproved: true
    }
  })

  // 2. Create Owner
  const owner = await prisma.user.create({
    data: {
      name: 'Bugema Landlord Association',
      email: 'owner@bugemahostels.com',
      phone: '+256770000000',
      passwordHash: ownerPasswordHash,
      whatsappNumber: '+256770000000',
      role: 'OWNER',
      isApproved: true
    }
  })

  // 3. PRIVATE HOSTELS (Around Bugema)
  const privateHostels = ['Perb', 'New Generation', 'Purple Hostel', 'Terrace Wonders'];
  for (let i = 0; i < privateHostels.length; i++) {
    await prisma.hostel.create({
      data: {
        ownerId: owner.id,
        name: privateHostels[i],
        category: 'PRIVATE_UNIVERSITY',
        university: 'Bugema University',
        streetAddress: 'Main Gate Area',
        area: 'Bugema',
        contactPhone: '+256770000001',
        whatsappNumber: '+256770000001',
        isApproved: true,
        rooms: {
          create: [
            { roomType: 'SINGLE', beds: 1, monthlyRent: 450000, status: 'AVAILABLE', amenities: 'Wi-Fi, Security, Self-contained', photos: { create: [{ url: getPhoto(i) }, { url: getPhoto(i+1) }] } },
            { roomType: 'DOUBLE', beds: 2, monthlyRent: 300000, status: 'AVAILABLE', amenities: 'Wi-Fi, Security, Shared Bathroom', photos: { create: [{ url: getPhoto(i+1) }, { url: getPhoto(i+2) }] } }
          ]
        }
      }
    })
  }

  // 4. PUBLIC UNIVERSITY HOSTELS (Ladies)
  const ladiesHostels = ['Clifford', 'Bensdorf', 'Annex'];
  for (let i = 0; i < ladiesHostels.length; i++) {
    await prisma.hostel.create({
      data: {
        ownerId: owner.id,
        name: ladiesHostels[i] + ' (Ladies)',
        category: 'PUBLIC_UNIVERSITY',
        university: 'Bugema University',
        streetAddress: 'Campus Road',
        area: 'Bugema',
        contactPhone: '+256770000002',
        whatsappNumber: '+256770000002',
        isApproved: true,
        description: 'Exclusive ladies hostel with maximum security and great environment.',
        rooms: {
          create: [
            { roomType: 'DOUBLE', beds: 2, monthlyRent: 350000, status: 'AVAILABLE', amenities: 'Security, Reading Room, Water', photos: { create: [{ url: getPhoto(i+2) }, { url: getPhoto(i+3) }] } },
            { roomType: 'SHARED', beds: 4, monthlyRent: 200000, status: 'FULL', amenities: 'Security, Water', photos: { create: [{ url: getPhoto(i+3) }, { url: getPhoto(i+4) }] } }
          ]
        }
      }
    })
  }

  // 5. PUBLIC UNIVERSITY HOSTELS (Men)
  const menHostels = ['Mukasa Hostel', 'Seatle'];
  for (let i = 0; i < menHostels.length; i++) {
    await prisma.hostel.create({
      data: {
        ownerId: owner.id,
        name: menHostels[i] + ' (Men)',
        category: 'PUBLIC_UNIVERSITY',
        university: 'Bugema University',
        streetAddress: 'Valley Road',
        area: 'Bugema',
        contactPhone: '+256770000003',
        whatsappNumber: '+256770000003',
        isApproved: true,
        description: 'Men\'s hostel with great facilities and fast internet.',
        rooms: {
          create: [
            { roomType: 'SINGLE', beds: 1, monthlyRent: 400000, status: 'AVAILABLE', amenities: 'Wi-Fi, TV Room, Security', photos: { create: [{ url: getPhoto(i+4) }, { url: getPhoto(i+0) }] } },
            { roomType: 'SHARED', beds: 2, monthlyRent: 250000, status: 'AVAILABLE', amenities: 'Wi-Fi, Security', photos: { create: [{ url: getPhoto(i) }, { url: getPhoto(i+1) }] } }
          ]
        }
      }
    })
  }

  console.log('Seeding complete! 9 Specific Bugema Hostels created.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
