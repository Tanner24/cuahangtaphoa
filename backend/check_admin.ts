import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'super_admin' }
    });
    console.log('Super Admins:', users.map(u => ({ id: u.id, username: u.username })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
