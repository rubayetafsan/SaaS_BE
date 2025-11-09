import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { encrypt } from '../src/utils/encryption';
import { SERVICE_TIERS } from '../src/config/services.config';
import { config } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  // ============================================
  // 1. Create Services
  // ============================================
  console.log('📦 Creating services...');
  
  const services = [];
  
  for (const [key, tier] of Object.entries(SERVICE_TIERS)) {
    const service = await prisma.service.upsert({
      where: { name: tier.name },
      update: {
        description: tier.description,
        price: tier.price,
        allowedAlgorithms: JSON.stringify(tier.allowedAlgorithms),
        rateLimit: tier.rateLimit,
        ratePeriod: tier.ratePeriod,
        stripePriceId: tier.stripePriceId,
        isActive: true,
      },
      create: {
        name: tier.name,
        description: tier.description,
        price: tier.price,
        allowedAlgorithms: JSON.stringify(tier.allowedAlgorithms),
        rateLimit: tier.rateLimit,
        ratePeriod: tier.ratePeriod,
        stripePriceId: tier.stripePriceId,
        isActive: true,
      },
    });
    
    services.push(service);
    console.log(`  ✅ ${service.name} - $${service.price}/mo`);
  }
  
  console.log(`\n✅ Created ${services.length} services\n`);
  
  // ============================================
  // 2. Create Owner Account
  // ============================================
  console.log('👤 Creating owner account...');
  
  const hashedPassword = await hashPassword(config.OWNER_PASSWORD);
  const encryptedEmail = encrypt(config.OWNER_EMAIL);
  
  const owner = await prisma.user.upsert({
    where: { email: config.OWNER_EMAIL },
    update: {
      username: config.OWNER_USERNAME,
      password: hashedPassword,
      role: 'OWNER',
      isEmailVerified: true,
    },
    create: {
      username: config.OWNER_USERNAME,
      email: config.OWNER_EMAIL,
      encryptedEmail,
      password: hashedPassword,
      role: 'OWNER',
      isEmailVerified: true,
    },
  });
  
  console.log(`  ✅ Owner: ${owner.username} (${owner.email})`);
  console.log(`  ⚠️  Password: ${config.OWNER_PASSWORD}`);
  console.log(`  🔐 Role: ${owner.role}\n`);
  
  // ============================================
  // 3. Create Sample Users (Optional)
  // ============================================
  console.log('👥 Creating sample users...');
  
  // Admin user
  const adminPassword = await hashPassword('Admin123!@#');
  const adminEmail = 'admin@onesaas.de';
  const adminEncryptedEmail = encrypt(adminEmail);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      username: 'admin',
      email: adminEmail,
      encryptedEmail: adminEncryptedEmail,
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  
  console.log(`  ✅ Admin: ${admin.username} (${admin.email})`);
  
  // Test guest user
  const guestPassword = await hashPassword('Guest123!@#');
  const guestEmail = 'guest@onesaas.de';
  const guestEncryptedEmail = encrypt(guestEmail);
  const fiveHoursFromNow = new Date(Date.now() + 5 * 60 * 60 * 1000);
  
  const guest = await prisma.user.upsert({
    where: { email: guestEmail },
    update: {},
    create: {
      username: 'guest',
      email: guestEmail,
      encryptedEmail: guestEncryptedEmail,
      password: guestPassword,
      role: 'GUEST',
      isEmailVerified: true,
      guestAccessExpiresAt: fiveHoursFromNow,
    },
  });
  
  console.log(`  ✅ Guest: ${guest.username} (${guest.email})`);
  console.log(`     Expires: ${fiveHoursFromNow.toISOString()}\n`);
  
  // ============================================
  // 4. Summary
  // ============================================
  console.log('📊 Seeding Summary:\n');
  console.log(`Services Created: ${services.length}`);
  console.log(`Users Created: 3 (Owner, Admin, Guest)\n`);
  
  console.log('🔐 Login Credentials:\n');
  console.log('Owner Account:');
  console.log(`  Email: ${config.OWNER_EMAIL}`);
  console.log(`  Password: ${config.OWNER_PASSWORD}`);
  console.log(`  Role: OWNER (Full Access)\n`);
  
  console.log('Admin Account:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: Admin123!@#`);
  console.log(`  Role: ADMIN\n`);
  
  console.log('Guest Account:');
  console.log(`  Email: ${guestEmail}`);
  console.log(`  Password: Guest123!@#`);
  console.log(`  Role: GUEST (Limited Access, Expires in 5 hours)\n`);
  
  console.log('⚠️  IMPORTANT: Change these passwords in production!\n');
  
  console.log('✅ Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });