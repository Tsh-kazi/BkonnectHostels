const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // The exact names of the 5 university hostels the user specified
  const universityHostelNames = [
    'Bensdorf (Ladies)',
    'Clifford (Ladies)',
    'Annex (Ladies)',
    'Mukasa Hostel (Men)',
    'Seatle (Men)'
  ];

  console.log("Starting category migration...");

  try {
    // 1. Set EVERYTHING to PRIVATE_RENTAL first (clean slate)
    const privateResult = await prisma.hostel.updateMany({
      where: {
        NOT: {
          name: { in: universityHostelNames }
        }
      },
      data: {
        category: 'PRIVATE_RENTAL'
      }
    });
    console.log(`Successfully updated ${privateResult.count} hostels to Private Hostel.`);

    // 2. Set the specific 5 to UNIVERSITY_HOSTEL
    const uniResult = await prisma.hostel.updateMany({
      where: {
        name: { in: universityHostelNames }
      },
      data: {
        category: 'UNIVERSITY_HOSTEL'
      }
    });
    console.log(`Successfully updated ${uniResult.count} hostels to University Hostel.`);

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
