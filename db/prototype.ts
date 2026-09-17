import { sql } from "drizzle-orm";
import { dbClient, dbConn } from "@db/client.js";
import {
  teams,
  users,
  categories,
  locations,
  tickets,
  ticketComments,
  ticketAttachments,
  ticketEvents,
  feedback,
} from "@db/schema.js";

async function seed() {
  console.log("Seeding Faculty Issue Reporting System database...");

  // 1. Teams (3 teams)
  console.log("Seeding teams...");
  await dbClient
    .insert(teams)
    .values([
      {
        name: "IT Support",
        description:
          "Technical support for hardware, software, and campus network infrastructure",
      },
      {
        name: "Facility Management",
        description:
          "Maintenance, custodial services, electrical, and plumbing repairs",
      },
      {
        name: "Audiovisual Support",
        description:
          "Assistance with classroom projectors, sound equipment, and media systems",
      },
    ])
    .onConflictDoUpdate({
      target: teams.name,
      set: {
        description: sql`EXCLUDED.description`,
        updatedAt: new Date(),
      },
    });

  const allTeams = await dbClient.query.teams.findMany();
  const teamMap = new Map(allTeams.map((t) => [t.name, t.id]));

  // 2. Users (1 ADMIN, 2 STAFF, 2 REPORTER)
  console.log("Seeding users...");
  const itSupportId = teamMap.get("IT Support");
  const avSupportId = teamMap.get("Audiovisual Support");
  const facilityMgmtId = teamMap.get("Facility Management");

  const usersData = [
    {
      googleId: "google-admin-001",
      email: "admin@faculty.example.edu",
      fullName: "Dr. Alice Admin",
      role: "ADMIN" as const,
      teamId: null,
      passwordHash: null,
      avatarUrl: "https://placehold.co/100x100?text=AA",
    },
    {
      googleId: "google-staff-001",
      email: "bob.staff@faculty.example.edu",
      fullName: "Bob Technician",
      role: "STAFF" as const,
      teamId: itSupportId,
      passwordHash: null,
      avatarUrl: "https://placehold.co/100x100?text=BT",
    },
    {
      googleId: "google-staff-002",
      email: "carol.staff@faculty.example.edu",
      fullName: "Carol Specialist",
      role: "STAFF" as const,
      teamId: avSupportId,
      passwordHash: null,
      avatarUrl: "https://placehold.co/100x100?text=CS",
    },
    {
      googleId: "google-rep-001",
      email: "dave.reporter@faculty.example.edu",
      fullName: "Dave Student",
      role: "REPORTER" as const,
      teamId: null,
      passwordHash: null,
      avatarUrl: "https://placehold.co/100x100?text=DS",
    },
    {
      googleId: "google-rep-002",
      email: "emma.reporter@faculty.example.edu",
      fullName: "Emma Lecturer",
      role: "REPORTER" as const,
      teamId: null,
      passwordHash: null,
      avatarUrl: "https://placehold.co/100x100?text=EL",
    },
    // Email + Password user (no Google OAuth)
    {
      googleId: null,
      email: "frank.reporter@faculty.example.edu",
      fullName: "Frank Student",
      role: "REPORTER" as const,
      teamId: null,
      // Pre-generated bcrypt hash placeholder (cost 10)
      passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6FeE2W/g9Qx6o7r9e",
      avatarUrl: "https://placehold.co/100x100?text=FS",
    },
    // Linked login user (both Google OAuth and Email/Password)
    {
      googleId: "google-staff-003",
      email: "grace.staff@faculty.example.edu",
      fullName: "Grace Coordinator",
      role: "STAFF" as const,
      teamId: facilityMgmtId,
      // Pre-generated bcrypt hash placeholder (cost 10)
      passwordHash: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQmG6FeE2W/g9Qx6o7r9e",
      avatarUrl: "https://placehold.co/100x100?text=GC",
    },
  ];

  await dbClient
    .insert(users)
    .values(usersData)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        googleId: sql`EXCLUDED.google_id`,
        fullName: sql`EXCLUDED.full_name`,
        passwordHash: sql`EXCLUDED.password_hash`,
        teamId: sql`EXCLUDED.team_id`,
        role: sql`EXCLUDED.role`,
        avatarUrl: sql`EXCLUDED.avatar_url`,
        updatedAt: new Date(),
      },
    });

  const allUsers = await dbClient.query.users.findMany();
  const userMap = new Map(allUsers.map((u) => [u.email, u.id]));

  // 3. Categories (5 categories)
  console.log("Seeding categories...");

  const categoriesData = [
    {
      name: "Wi-Fi / Internet",
      description: "Wireless connection, network drops, and bandwidth issues",
      defaultTeamId: itSupportId,
    },
    {
      name: "Computer and Software",
      description:
        "Lab desktop issues, OS errors, and licensed software installations",
      defaultTeamId: itSupportId,
    },
    {
      name: "Projector / AV Equipment",
      description:
        "Ceiling projectors, smart boards, microphones, and audio consoles",
      defaultTeamId: avSupportId,
    },
    {
      name: "Classroom Facility",
      description: "Desks, chairs, whiteboards, podiums, and door locks",
      defaultTeamId: facilityMgmtId,
    },
    {
      name: "Building Maintenance",
      description:
        "Air conditioning, lighting, plumbing, and structural issues",
      defaultTeamId: facilityMgmtId,
    },
  ];

  await dbClient
    .insert(categories)
    .values(categoriesData)
    .onConflictDoUpdate({
      target: categories.name,
      set: {
        description: sql`EXCLUDED.description`,
        defaultTeamId: sql`EXCLUDED.default_team_id`,
        updatedAt: new Date(),
      },
    });

  const allCategories = await dbClient.query.categories.findMany();
  const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

  // 4. Locations (5 locations)
  console.log("Seeding locations...");
  const locationsData = [
    {
      name: "Engineering Hall - Room 301",
      building: "Engineering Hall",
      floor: "3",
      room: "301",
      latitude: "13.7563000",
      longitude: "100.5018000",
    },
    {
      name: "Science Building - Lab 102",
      building: "Science Building",
      floor: "1",
      room: "102",
      latitude: "13.7565000",
      longitude: "100.5020000",
    },
    {
      name: "Main Library - Auditorium A",
      building: "Main Library",
      floor: "2",
      room: "Auditorium A",
      latitude: "13.7570000",
      longitude: "100.5015000",
    },
    {
      name: "Administration Complex - Room 405",
      building: "Administration Complex",
      floor: "4",
      room: "405",
      latitude: "13.7558000",
      longitude: "100.5025000",
    },
    {
      name: "Faculty Center - Meeting Room B",
      building: "Faculty Center",
      floor: "1",
      room: "Meeting Room B",
      latitude: "13.7561000",
      longitude: "100.5030000",
    },
  ];

  for (const loc of locationsData) {
    const existing = await dbClient.query.locations.findFirst({
      where: (l, { and, eq }) =>
        and(eq(l.building, loc.building), eq(l.name, loc.name)),
    });
    if (!existing) {
      await dbClient.insert(locations).values(loc);
    }
  }

  const allLocations = await dbClient.query.locations.findMany();
  const locationMap = new Map(allLocations.map((l) => [l.name, l.id]));

  // 5. Tickets (3 sample tickets)
  console.log("Seeding tickets...");
  const ticketsData = [
    {
      ticketNumber: "FAC-2026-0001",
      title: "Wi-Fi disconnecting intermittently in Room 301",
      description:
        "Students are losing internet connection during online quiz sessions on laptops.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      reporterId: userMap.get("dave.reporter@faculty.example.edu")!,
      assigneeId: userMap.get("bob.staff@faculty.example.edu")!,
      teamId: teamMap.get("IT Support")!,
      categoryId: categoryMap.get("Wi-Fi / Internet")!,
      locationId: locationMap.get("Engineering Hall - Room 301")!,
    },
    {
      ticketNumber: "FAC-2026-0002",
      title: "Projector lamp flickering in Auditorium A",
      description:
        "The ceiling projector exhibits flickering colors and dims randomly every few minutes.",
      status: "OPEN" as const,
      priority: "MEDIUM" as const,
      reporterId: userMap.get("emma.reporter@faculty.example.edu")!,
      assigneeId: null,
      teamId: teamMap.get("Audiovisual Support")!,
      categoryId: categoryMap.get("Projector / AV Equipment")!,
      locationId: locationMap.get("Main Library - Auditorium A")!,
    },
    {
      ticketNumber: "FAC-2026-0003",
      title: "Air conditioner leaking water in Lab 102",
      description:
        "Water dripping onto the floor near workbench 3, causing a slip hazard.",
      status: "RESOLVED" as const,
      priority: "URGENT" as const,
      reporterId: userMap.get("dave.reporter@faculty.example.edu")!,
      assigneeId: userMap.get("bob.staff@faculty.example.edu")!,
      teamId: teamMap.get("Facility Management")!,
      categoryId: categoryMap.get("Building Maintenance")!,
      locationId: locationMap.get("Science Building - Lab 102")!,
      resolvedAt: new Date(),
    },
  ];

  await dbClient
    .insert(tickets)
    .values(ticketsData)
    .onConflictDoUpdate({
      target: tickets.ticketNumber,
      set: {
        status: sql`EXCLUDED.status`,
        priority: sql`EXCLUDED.priority`,
        assigneeId: sql`EXCLUDED.assignee_id`,
        resolvedAt: sql`EXCLUDED.resolved_at`,
        updatedAt: new Date(),
      },
    });

  const allTickets = await dbClient.query.tickets.findMany();
  const ticketMap = new Map(allTickets.map((t) => [t.ticketNumber, t.id]));

  const t1Id = ticketMap.get("FAC-2026-0001")!;
  const t2Id = ticketMap.get("FAC-2026-0002")!;
  const t3Id = ticketMap.get("FAC-2026-0003")!;
  const bobId = userMap.get("bob.staff@faculty.example.edu")!;
  const daveId = userMap.get("dave.reporter@faculty.example.edu")!;
  const emmaId = userMap.get("emma.reporter@faculty.example.edu")!;
  const aliceId = userMap.get("admin@faculty.example.edu")!;

  // 6. Comments
  console.log("Seeding ticket comments...");
  const existingComments = await dbClient.query.ticketComments.findMany({
    where: (tc, { inArray }) => inArray(tc.ticketId, [t1Id, t3Id]),
  });

  if (existingComments.length === 0) {
    await dbClient.insert(ticketComments).values([
      {
        ticketId: t1Id,
        userId: bobId,
        message:
          "I will inspect the wireless access point on floor 3 this afternoon.",
      },
      {
        ticketId: t1Id,
        userId: daveId,
        message: "Thank you, it happened again during the 1 PM lecture.",
      },
      {
        ticketId: t3Id,
        userId: bobId,
        message:
          "Drain line cleared and tested. AC unit is operating normally now.",
      },
    ]);
  }

  // 7. Attachments metadata
  console.log("Seeding ticket attachments...");
  const existingAttachments = await dbClient.query.ticketAttachments.findMany({
    where: (ta, { inArray }) => inArray(ta.ticketId, [t1Id, t3Id]),
  });

  if (existingAttachments.length === 0) {
    await dbClient.insert(ticketAttachments).values([
      {
        ticketId: t1Id,
        uploadedById: daveId,
        fileName: "wifi-error-screenshot.png",
        fileUrl:
          "https://storage.example.edu/attachments/fac-2026-0001/wifi-error.png",
        mimeType: "image/png",
        fileSize: 245120,
      },
      {
        ticketId: t3Id,
        uploadedById: daveId,
        fileName: "leakage-photo.jpg",
        fileUrl:
          "https://storage.example.edu/attachments/fac-2026-0003/leakage.jpg",
        mimeType: "image/jpeg",
        fileSize: 1548200,
      },
    ]);
  }

  // 8. Ticket Events
  console.log("Seeding ticket events...");
  const existingEvents = await dbClient.query.ticketEvents.findMany({
    where: (te, { inArray }) => inArray(te.ticketId, [t1Id, t2Id, t3Id]),
  });

  if (existingEvents.length === 0) {
    await dbClient.insert(ticketEvents).values([
      {
        ticketId: t1Id,
        actorId: daveId,
        eventType: "TICKET_CREATED",
        oldValue: null,
        newValue: "OPEN",
        note: "Ticket submitted via portal",
      },
      {
        ticketId: t1Id,
        actorId: aliceId,
        eventType: "ASSIGNED",
        oldValue: null,
        newValue: "Bob Technician",
        note: "Assigned ticket to IT support tech",
      },
      {
        ticketId: t1Id,
        actorId: bobId,
        eventType: "STATUS_CHANGED",
        oldValue: "OPEN",
        newValue: "IN_PROGRESS",
        note: "Investigating AP channel interference",
      },
      {
        ticketId: t2Id,
        actorId: emmaId,
        eventType: "TICKET_CREATED",
        oldValue: null,
        newValue: "OPEN",
        note: "Submitted classroom projector malfunction report",
      },
      {
        ticketId: t3Id,
        actorId: daveId,
        eventType: "TICKET_CREATED",
        oldValue: null,
        newValue: "OPEN",
        note: "Urgent ticket submitted for AC water leak",
      },
      {
        ticketId: t3Id,
        actorId: bobId,
        eventType: "STATUS_CHANGED",
        oldValue: "IN_PROGRESS",
        newValue: "RESOLVED",
        note: "AC condensate pipe unclogged and tested",
      },
    ]);
  }

  // 9. Feedback
  console.log("Seeding feedback...");
  await dbClient
    .insert(feedback)
    .values([
      {
        ticketId: t3Id,
        rating: 5,
        comment:
          "Water leak was addressed very promptly. Excellent response time!",
      },
    ])
    .onConflictDoNothing({ target: feedback.ticketId });

  console.log("Faculty Issue Reporting System seed completed successfully!");
  await dbConn.end();
}

seed().catch((err) => {
  console.error("Error during seeding:", err);
  dbConn.end();
  process.exit(1);
});
