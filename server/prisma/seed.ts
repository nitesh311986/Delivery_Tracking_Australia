import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Driver Profile
  await prisma.user.upsert({
    where: { email: 'driver@velocity.com.au' },
    update: {},
    create: {
      email: 'driver@velocity.com.au',
      passwordHash,
      fullName: 'John Driver',
      subcontractorName: 'Starcrafter Pty Ltd',
      businessName: 'Velocity Taxi Trucks',
      rego: 'XB71DJ',
      yardLocation: 'Willawong',
      role: Role.DRIVER,
    },
  });

  // 2. Seed Admin Profile
  await prisma.user.upsert({
    where: { email: 'admin@velocity.com.au' },
    update: {},
    create: {
      email: 'admin@velocity.com.au',
      passwordHash,
      fullName: 'Chirag Patel',
      businessName: 'Velocity Taxi Trucks',
      role: Role.ADMIN,
    },
  });

  console.log('Database seeded: driver@velocity.com.au / admin@velocity.com.au (Password: Password123!)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });