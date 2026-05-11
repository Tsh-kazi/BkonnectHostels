const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hostels = await prisma.hostel.findMany({
    select: { id: true, name: true, category: true }
  });
  console.log("CURRENT HOSTELS:");
  console.log(JSON.stringify(hostels, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
