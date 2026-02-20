
import { ROLES } from '../init.js';
import prisma from '../prisma/client.js';

export const createRoles = async () => {
    prisma.roles.createMany({
        data: ROLES,
        skipDuplicates: true
    })
    console.log('✅ Roles seeded');
}

