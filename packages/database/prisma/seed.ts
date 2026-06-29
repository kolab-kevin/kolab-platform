import {
  MembershipStatus,
  OrganizationRole,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  Role,
} from '@prisma/client';
import { hashPassword } from '@kolab/auth';

const prisma = new PrismaClient();

const DEFAULT_ORG = {
  id: 'clseedorg000000000000000000001',
  name: 'KOLAB Dev',
  slug: 'kolab-dev',
  type: OrganizationType.STANDARD,
  status: OrganizationStatus.ACTIVE,
  settings: {},
};

const LEGACY_ROLE_TO_ORG_ROLE: Record<Role, OrganizationRole> = {
  [Role.USER]: OrganizationRole.VIEWER,
  [Role.CREATOR]: OrganizationRole.CREATOR,
  [Role.MODERATOR]: OrganizationRole.MODERATOR,
  [Role.ADMIN]: OrganizationRole.ORG_ADMIN,
  [Role.SUPER_ADMIN]: OrganizationRole.ORG_OWNER,
};

const DEV_USERS = [
  {
    email: 'user@kolab.test',
    password: 'User1234',
    role: Role.USER,
    displayName: 'Dev User',
  },
  {
    email: 'creator@kolab.test',
    password: 'Creator1234',
    role: Role.CREATOR,
    displayName: 'Dev Creator',
  },
  {
    email: 'moderator@kolab.test',
    password: 'Moderator1234',
    role: Role.MODERATOR,
    displayName: 'Dev Moderator',
  },
  {
    email: 'admin@kolab.test',
    password: 'Admin1234',
    role: Role.ADMIN,
    displayName: 'Dev Admin',
    orgRole: OrganizationRole.ORG_OWNER,
  },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG.slug },
    create: {
      id: DEFAULT_ORG.id,
      name: DEFAULT_ORG.name,
      slug: DEFAULT_ORG.slug,
      type: DEFAULT_ORG.type,
      status: DEFAULT_ORG.status,
      settings: DEFAULT_ORG.settings,
    },
    update: {
      name: DEFAULT_ORG.name,
      type: DEFAULT_ORG.type,
      status: DEFAULT_ORG.status,
    },
  });

  console.log(`Seeded organization: ${organization.name} (${organization.slug})`);

  for (const user of DEV_USERS) {
    const passwordHash = await hashPassword(user.password);
    const orgRole = user.orgRole ?? LEGACY_ROLE_TO_ORG_ROLE[user.role];

    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        isSystemAdmin: user.role === Role.SUPER_ADMIN,
      },
      update: {
        passwordHash,
        role: user.role,
        isSystemAdmin: user.role === Role.SUPER_ADMIN,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: seededUser.id },
      create: {
        userId: seededUser.id,
        displayName: user.displayName,
        language: 'en',
        timezone: 'UTC',
      },
      update: {
        displayName: user.displayName,
      },
    });

    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: seededUser.id,
        },
      },
      create: {
        organizationId: organization.id,
        userId: seededUser.id,
        role: orgRole,
        status: MembershipStatus.ACTIVE,
      },
      update: {
        role: orgRole,
        status: MembershipStatus.ACTIVE,
      },
    });

    console.log(`Seeded ${user.role} / ${orgRole}: ${user.email} → ${organization.slug}`);
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
