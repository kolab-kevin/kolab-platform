import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '@kolab/auth';

const prisma = new PrismaClient();

const DEV_USERS = [
  { email: 'user@kolab.test', password: 'User1234', role: Role.USER },
  { email: 'creator@kolab.test', password: 'Creator1234', role: Role.CREATOR },
  { email: 'moderator@kolab.test', password: 'Moderator1234', role: Role.MODERATOR },
  { email: 'admin@kolab.test', password: 'Admin1234', role: Role.ADMIN },
];

async function main() {
  for (const user of DEV_USERS) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      create: { email: user.email, passwordHash, role: user.role },
      update: { passwordHash, role: user.role },
    });
    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
