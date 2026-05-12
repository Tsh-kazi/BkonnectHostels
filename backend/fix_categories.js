const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hostels = await prisma.hostel.findMany();

  for (const h of hostels) {
    const name = h.name.toLowerCase();
    let isUni = name.includes('annex') || 
                name.includes('mukasa') || 
                name.includes('seatle') || 
                name.includes('bensdorf') || 
                name.includes('clifford');
    
    await prisma.hostel.update({
      where: { id: h.id },
      data: {
        category: isUni ? 'UNIVERSITY_HOSTEL' : 'PRIVATE_RENTAL'
      }
    });
  }

  console.log("Hostel categories updated successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
