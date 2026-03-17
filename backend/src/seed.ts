import { prisma } from './config/database';
import { hashPassword } from './utils/crypto';
import { logger } from './utils/logger';

export async function seedAdmin(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await hashPassword('admin123');
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          username: 'admin',
          isAdmin: true,
        },
      });
      logger.info('Admin user created: admin@example.com / admin123');

      // Add default repository
      await prisma.repository.create({
        data: {
          url: 'https://ipa.cypwn.xyz/cypwn.json',
          name: 'CypWn Repository',
          description: 'Default IPA repository',
          isDefault: true,
        },
      });
      logger.info('Default repository added');
    }
  } catch (error) {
    logger.error('Seed error:', error);
  }
}
