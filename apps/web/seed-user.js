const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// Ambil semua user dari Clerk
function fetchClerkUsers(secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      path: '/v1/users?limit=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('CLERK_SECRET_KEY tidak ada di env!');
    process.exit(1);
  }

  console.log('Mengambil daftar user dari Clerk...');
  const clerkData = await fetchClerkUsers(secretKey);
  
  if (!clerkData || !Array.isArray(clerkData)) {
    console.error('Response Clerk:', JSON.stringify(clerkData));
    process.exit(1);
  }

  console.log(`Ditemukan ${clerkData.length} user di Clerk:`);
  clerkData.forEach(u => {
    const email = u.email_addresses?.[0]?.email_address ?? '-';
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Owner';
    console.log(`  - ${u.id} | ${name} | ${email}`);
  });

  if (clerkData.length === 0) {
    console.log('Tidak ada user di Clerk.');
    return;
  }

  // Seed semua user yang belum ada di DB
  for (const clerkUser of clerkData) {
    const userId = clerkUser.id;
    const email = clerkUser.email_addresses?.[0]?.email_address ?? '';
    const fullName = `${clerkUser.first_name ?? ''} ${clerkUser.last_name ?? ''}`.trim() || 'Owner';

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser) {
      console.log(`\nUser ${fullName} (${userId}) sudah ada di DB. Skip.`);
      continue;
    }

    console.log(`\nMembuat org + user untuk: ${fullName} (${userId})...`);

    const companyName = 'Perusahaan Saya';
    const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 60);
    const existing = await prisma.organization.findUnique({ where: { slug: slugBase } });
    const slug = existing ? `${slugBase}-${Date.now().toString(36)}` : slugBase;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const org = await prisma.organization.create({
      data: {
        name: companyName,
        slug,
        size: '<10',
        subscriptionTier: 'trial',
        subscriptionStatus: 'trial',
        trialEndsAt,
      },
    });

    const user = await prisma.user.create({
      data: {
        id: userId,
        organizationId: org.id,
        fullName,
        email,
        role: 'owner',
      },
    });

    console.log(`✅ Berhasil! Org ID: ${org.id} | User ID: ${user.id}`);
  }

  console.log('\n✅ Selesai seed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
