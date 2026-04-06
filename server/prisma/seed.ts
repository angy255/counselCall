import bcrypt from "bcrypt";
import { BookingStatus, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

type AttorneySeed = {
  name: string;
  email: string;
  bio: string;
  practiceAreas: string[];
  hourlyRate: number;
  photoUrl: string | null;
};

const attorneys: AttorneySeed[] = [
  {
    name: "Avery Coleman",
    email: "attorney.avery@example.com",
    bio: "Family law attorney helping clients through custody and support matters.",
    practiceAreas: ["Family Law", "Estate Planning"],
    hourlyRate: 220,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-1",
  },
  {
    name: "Jordan Morales",
    email: "attorney.jordan@example.com",
    bio: "Immigration advocate focused on visa and adjustment-of-status applications.",
    practiceAreas: ["Immigration"],
    hourlyRate: 240,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-2",
  },
  {
    name: "Casey Franklin",
    email: "attorney.casey@example.com",
    bio: "Criminal defense lawyer for misdemeanor and felony pretrial representation.",
    practiceAreas: ["Criminal Defense"],
    hourlyRate: 280,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-3",
  },
  {
    name: "Riley Shah",
    email: "attorney.riley@example.com",
    bio: "Employment attorney handling workplace discrimination and wage disputes.",
    practiceAreas: ["Employment"],
    hourlyRate: 260,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-4",
  },
  {
    name: "Taylor Nguyen",
    email: "attorney.taylor@example.com",
    bio: "Real estate counsel for residential closings and title issues.",
    practiceAreas: ["Real Estate", "Business Law"],
    hourlyRate: 230,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-5",
  },
  {
    name: "Quinn Rodriguez",
    email: "attorney.quinn@example.com",
    bio: "Business law advisor for startups, contracts, and operating agreements.",
    practiceAreas: ["Business Law"],
    hourlyRate: 300,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-6",
  },
  {
    name: "Morgan Bennett",
    email: "attorney.morgan@example.com",
    bio: "Estate planning attorney focused on wills, trusts, and probate strategy.",
    practiceAreas: ["Estate Planning", "Family Law"],
    hourlyRate: 210,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-7",
  },
  {
    name: "Drew Patel",
    email: "attorney.drew@example.com",
    bio: "Immigration and employment counsel for work authorization matters.",
    practiceAreas: ["Immigration", "Employment"],
    hourlyRate: 275,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-8",
  },
  {
    name: "Sydney Brooks",
    email: "attorney.sydney@example.com",
    bio: "Real estate litigator handling landlord-tenant and property disputes.",
    practiceAreas: ["Real Estate"],
    hourlyRate: 250,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-9",
  },
  {
    name: "Alex Kim",
    email: "attorney.alex@example.com",
    bio: "Business transactions attorney for vendor contracts and risk management.",
    practiceAreas: ["Business Law", "Employment"],
    hourlyRate: 320,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-10",
  },
  {
    name: "Parker White",
    email: "attorney.parker@example.com",
    bio: "Family and juvenile matters with emphasis on collaborative resolution.",
    practiceAreas: ["Family Law"],
    hourlyRate: 195,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-11",
  },
  {
    name: "Reese Campbell",
    email: "attorney.reese@example.com",
    bio: "Criminal defense trial attorney experienced in evidentiary hearings.",
    practiceAreas: ["Criminal Defense", "Business Law"],
    hourlyRate: 340,
    photoUrl: null,
  },
  {
    name: "Logan Torres",
    email: "attorney.logan@example.com",
    bio: "Employment compliance attorney supporting policy and HR investigations.",
    practiceAreas: ["Employment"],
    hourlyRate: 285,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-13",
  },
  {
    name: "Cameron Price",
    email: "attorney.cameron@example.com",
    bio: "Immigration attorney for family petitions and humanitarian relief.",
    practiceAreas: ["Immigration", "Family Law"],
    hourlyRate: 235,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-14",
  },
  {
    name: "Rowan Griffin",
    email: "attorney.rowan@example.com",
    bio: "Estate planning and elder law attorney with practical tax guidance.",
    practiceAreas: ["Estate Planning"],
    hourlyRate: 265,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-15",
  },
  {
    name: "Hayden Foster",
    email: "attorney.hayden@example.com",
    bio: "Commercial real estate attorney for leases, zoning, and due diligence.",
    practiceAreas: ["Real Estate", "Business Law"],
    hourlyRate: 360,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-16",
  },
  {
    name: "Blake Stewart",
    email: "attorney.blake@example.com",
    bio: "Criminal defense and civil rights advocate focused on case strategy.",
    practiceAreas: ["Criminal Defense", "Employment"],
    hourlyRate: 410,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-17",
  },
  {
    name: "Kendall Wright",
    email: "attorney.kendall@example.com",
    bio: "General practice attorney handling client consults across core legal needs.",
    practiceAreas: ["Family Law", "Real Estate", "Estate Planning"],
    hourlyRate: 205,
    photoUrl: "https://i.pravatar.cc/150?u=attorney-18",
  },
];

const firstNames = [
  "Noah",
  "Liam",
  "Olivia",
  "Emma",
  "Sophia",
  "Mason",
  "Aiden",
  "Lucas",
  "Mia",
  "Ethan",
  "Amelia",
  "Harper",
  "Evelyn",
  "Elijah",
  "Abigail",
  "Benjamin",
  "Charlotte",
  "Henry",
  "Daniel",
  "Scarlett",
];

const lastNames = [
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Martinez",
  "Lopez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
];

function utcDateFromOffset(daysOffset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysOffset,
      0,
      0,
      0,
      0,
    ),
  );
}

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.attorneyProfile.deleteMany();
  await prisma.user.deleteMany();

  const attorneyUsers = [];
  for (const attorney of attorneys) {
    const user = await prisma.user.create({
      data: {
        name: attorney.name,
        email: attorney.email,
        password: hashedPassword,
        role: Role.ATTORNEY,
        attorneyProfile: {
          create: {
            bio: attorney.bio,
            practiceAreas: attorney.practiceAreas,
            hourlyRate: attorney.hourlyRate,
            photoUrl: attorney.photoUrl,
          },
        },
      },
    });
    attorneyUsers.push(user);
  }

  const clientUsers = [];
  for (let i = 0; i < 40; i += 1) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const suffix = i + 1;
    const name = `${firstName} ${lastName}`;
    const email = `client.${suffix.toString().padStart(2, "0")}@example.com`;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.CLIENT,
      },
    });
    clientUsers.push(user);
  }

  const availabilityTemplates = [
    [
      { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "10:00", endTime: "16:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "14:00" },
    ],
    [
      { dayOfWeek: 2, startTime: "08:30", endTime: "12:30" },
      { dayOfWeek: 2, startTime: "13:30", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "15:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "13:00" },
    ],
    [
      { dayOfWeek: 1, startTime: "10:00", endTime: "15:00" },
      { dayOfWeek: 3, startTime: "09:30", endTime: "12:30" },
      { dayOfWeek: 4, startTime: "13:00", endTime: "18:00" },
    ],
    [
      { dayOfWeek: 0, startTime: "11:00", endTime: "14:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
    ],
  ];

  for (let i = 0; i < attorneyUsers.length; i += 1) {
    const template = availabilityTemplates[i % availabilityTemplates.length];
    for (const slot of template) {
      await prisma.availability.create({
        data: {
          attorneyId: attorneyUsers[i].id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      });
    }
  }

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        clientId: clientUsers[0].id,
        attorneyId: attorneyUsers[2].id,
        date: utcDateFromOffset(-14),
        startTime: "10:00",
        endTime: "11:00",
        status: BookingStatus.CONFIRMED,
        notes: "Discuss pretrial strategy.",
      },
    }),
    prisma.booking.create({
      data: {
        clientId: clientUsers[1].id,
        attorneyId: attorneyUsers[5].id,
        date: utcDateFromOffset(-7),
        startTime: "14:00",
        endTime: "14:30",
        status: BookingStatus.CONFIRMED,
        notes: "Review contract terms for startup formation.",
      },
    }),
    prisma.booking.create({
      data: {
        clientId: clientUsers[2].id,
        attorneyId: attorneyUsers[8].id,
        date: utcDateFromOffset(2),
        startTime: "09:30",
        endTime: "10:30",
        status: BookingStatus.PENDING,
        notes: "Landlord dispute consultation.",
      },
    }),
    prisma.booking.create({
      data: {
        clientId: clientUsers[3].id,
        attorneyId: attorneyUsers[11].id,
        date: utcDateFromOffset(5),
        startTime: "15:00",
        endTime: "16:00",
        status: BookingStatus.CANCELLED,
        notes: "Case canceled by client.",
      },
    }),
    prisma.booking.create({
      data: {
        clientId: clientUsers[4].id,
        attorneyId: attorneyUsers[14].id,
        date: utcDateFromOffset(-3),
        startTime: "11:00",
        endTime: "11:30",
        status: BookingStatus.CONFIRMED,
        notes: "Estate planning follow-up.",
      },
    }),
  ]);

  await prisma.review.createMany({
    data: [
      {
        clientId: bookings[0].clientId,
        attorneyId: bookings[0].attorneyId,
        rating: 5,
        comment: "Clear advice and excellent communication throughout the process.",
      },
      {
        clientId: bookings[1].clientId,
        attorneyId: bookings[1].attorneyId,
        rating: 4,
        comment: "Very practical recommendations and quick turnaround on questions.",
      },
      {
        clientId: bookings[4].clientId,
        attorneyId: bookings[4].attorneyId,
        rating: 5,
        comment: "Helped us reach a workable family agreement with confidence.",
      },
    ],
  });

  console.log("Seed complete:");
  console.log(`- Attorneys: ${attorneyUsers.length}`);
  console.log(`- Clients: ${clientUsers.length}`);
  console.log(`- Availability rows: ${attorneyUsers.length * 3} to ${attorneyUsers.length * 4}`);
  console.log("- Bookings: 5");
  console.log("- Reviews: 3");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
