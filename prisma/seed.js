import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log(`Prisma Client ready`);

async function main() {
  await prisma.contact.deleteMany();

  await prisma.contact.create({
    data: {
      id: 1,
      email: "alice@example.com",
      phoneNumber: "111111",
      linkPrecedence: "primary",
      createdAt: new Date("2023-04-01T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 2,
      email: "bob@hillvalley.edu",
      phoneNumber: "222222",
      linkPrecedence: "primary",
      createdAt: new Date("2023-04-05T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 3,
      email: "robert@hillvalley.edu",
      phoneNumber: "222222",
      linkPrecedence: "secondary",
      linkedId: 2,
      createdAt: new Date("2023-04-10T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 4,
      email: "charlie@hillvalley.edu",
      phoneNumber: "333333",
      linkPrecedence: "primary",
      createdAt: new Date("2023-04-02T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 5,
      email: "dana@hillvalley.edu",
      phoneNumber: "444444",
      linkPrecedence: "primary",
      createdAt: new Date("2023-04-08T00:00:00Z")
    }
  });

  await prisma.contact.update({
    where: { id: 5 },
    data: {
      linkPrecedence: "secondary",
      linkedId: 4,
      updatedAt: new Date("2023-04-15T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 6,
      email: "george@hillvalley.edu",
      phoneNumber: "555555",
      linkPrecedence: "primary",
      createdAt: new Date("2023-04-03T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 7,
      email: "george.alt@hillvalley.edu",
      phoneNumber: "555555",
      linkPrecedence: "secondary",
      linkedId: 6,
      createdAt: new Date("2023-04-12T00:00:00Z")
    }
  });

  await prisma.contact.create({
    data: {
      id: 8,
      email: "george@hillvalley.edu",
      phoneNumber: "999999",
      linkPrecedence: "secondary",
      linkedId: 6,
      createdAt: new Date("2023-04-18T00:00:00Z")
    }
  });

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Contact"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Contact"), 0) + 1,
      false
    )
  `);
}

main()
  .then(() => {
    console.log("Seed data inserted");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
