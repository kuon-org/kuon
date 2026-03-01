import { DISCORD_TEMPLATE, GITHUB_TEMPLATE, ROLES, TWITTER_TEMPLATE } from '../init.js';
import prisma from '../prisma/client.js';
const createRoles = async () => {
    await prisma.roles.createMany({
        data: ROLES,
        skipDuplicates: true,
    });
    console.log('✅ Roles seeded');
};
const createIdpRecords = async () => {
    const templates = [DISCORD_TEMPLATE, TWITTER_TEMPLATE, GITHUB_TEMPLATE];
    for (const tpl of templates) {
        const existing = await prisma.identity_providers.findUnique({
            where: { provider_name: tpl.provider_name },
        });
        if (existing) {
            console.log(`⏭️ ${tpl.provider_name} は既に存在します`);
            continue;
        }
        const provider = await prisma.identity_providers.create({
            data: {
                provider_name: tpl.provider_name,
                display_name: tpl.display_name,
                provider_type: tpl.provider_type,
                description: tpl.description,
                logo_url: tpl.logo_url,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        await prisma.idp_configurations.create({
            data: {
                provider_id: provider.id,
                config: tpl.config,
                button_color: tpl.button_color,
                text_color: tpl.text_color,
                is_active: false,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
        console.log(`✅ ${tpl.provider_name} を作成しました`);
    }
};
export const init = async () => {
    try {
        await createRoles(); // ✅ await を確実につける
        await createIdpRecords();
        console.log('🎉 Initialization completed');
    }
    catch (error) {
        console.error('❌ Initialization failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
};
