// c:\alpha\scripts\promote-user.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userEmailToPromote = 'gabriel@goannasocial.com';

  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmailToPromote },
    });

    if (!user) {
      console.error(`User with email ${userEmailToPromote} not found.`);
      return;
    }

    if (user.role === UserRole.ADMIN) {
      console.log(`User ${userEmailToPromote} is already an ADMIN.`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email: userEmailToPromote },
      data: { role: UserRole.ADMIN },
    });

    console.log(`Successfully promoted user ${updatedUser.email} (ID: ${updatedUser.user_id}) to ADMIN.`);

  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
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
