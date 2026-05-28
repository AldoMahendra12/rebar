const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check all users
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Users:", JSON.stringify(users, null, 2));
  
  // Check all orgs
  const orgs = await prisma.organization.findMany({ take: 5 });
  console.log("Orgs:", JSON.stringify(orgs, null, 2));
  
  // Check all projects
  const projects = await prisma.project.findMany({ take: 5 });
  console.log("Projects:", JSON.stringify(projects, null, 2));
}

main().finally(() => prisma.$disconnect());
