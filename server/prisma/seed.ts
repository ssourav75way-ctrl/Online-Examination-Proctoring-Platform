import dotenv from "dotenv";
dotenv.config();

import { PrismaClient, GlobalRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@platform.com" },
    update: {},
    create: {
      email: "admin@platform.com",
      passwordHash: adminPassword,
      firstName: "Super",
      lastName: "Admin",
      globalRole: GlobalRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`  Created super admin: ${superAdmin.email}`);

  const candidatePassword = await bcrypt.hash("candidate123", 12);
  const candidate = await prisma.user.upsert({
    where: { email: "candidate@platform.com" },
    update: {},
    create: {
      email: "candidate@platform.com",
      passwordHash: candidatePassword,
      firstName: "Jane",
      lastName: "Doe",
      globalRole: GlobalRole.CANDIDATE,
      isActive: true,
    },
  });
  console.log(`  Created candidate: ${candidate.email}`);

  const institution = await prisma.institution.upsert({
    where: { code: "MIT" },
    update: {},
    create: {
      name: "Massachusetts Institute of Technology",
      code: "MIT",
      isActive: true,
    },
  });
  console.log(`  Created institution: ${institution.name}`);

  const csDepartment = await prisma.department.upsert({
    where: {
      institutionId_code: { institutionId: institution.id, code: "CS" },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Computer Science",
      code: "CS",
    },
  });
  console.log(`  Created department: ${csDepartment.name}`);

  const mathDepartment = await prisma.department.upsert({
    where: {
      institutionId_code: { institutionId: institution.id, code: "MATH" },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Mathematics",
      code: "MATH",
    },
  });
  console.log(`  Created department: ${mathDepartment.name}`);

  const examinerPassword = await bcrypt.hash("examiner123", 12);
  const examinerUser = await prisma.user.upsert({
    where: { email: "examiner@platform.com" },
    update: {},
    create: {
      email: "examiner@platform.com",
      passwordHash: examinerPassword,
      firstName: "Prof",
      lastName: "Smith",
      globalRole: GlobalRole.CANDIDATE,
      isActive: true,
    },
  });

  await prisma.institutionMember.upsert({
    where: {
      userId_institutionId: {
        userId: examinerUser.id,
        institutionId: institution.id,
      },
    },
    update: {},
    create: {
      userId: examinerUser.id,
      institutionId: institution.id,
      role: "EXAMINER",
    },
  });
  console.log(`  Created examiner: ${examinerUser.email}`);

  const proctorPassword = await bcrypt.hash("proctor123", 12);
  const proctorUser = await prisma.user.upsert({
    where: { email: "proctor@platform.com" },
    update: {},
    create: {
      email: "proctor@platform.com",
      passwordHash: proctorPassword,
      firstName: "Sam",
      lastName: "Williams",
      globalRole: GlobalRole.CANDIDATE,
      isActive: true,
    },
  });

  await prisma.institutionMember.upsert({
    where: {
      userId_institutionId: {
        userId: proctorUser.id,
        institutionId: institution.id,
      },
    },
    update: {},
    create: {
      userId: proctorUser.id,
      institutionId: institution.id,
      role: "PROCTOR",
    },
  });
  console.log(`  Created proctor: ${proctorUser.email}`);

  const questionPool = await prisma.questionPool.create({
    data: {
      departmentId: csDepartment.id,
      name: "Data Structures & Algorithms",
      description: "Core CS questions for DS&A assessments.",
      isShared: false,
    },
  });
  console.log(`  Created question pool: ${questionPool.name}`);

  const question = await prisma.question.create({
    data: {
      poolId: questionPool.id,
      type: "MCQ",
      topic: "Sorting Algorithms",
      createdById: examinerUser.id,
      isActive: true,
      versions: {
        create: {
          versionNumber: 1,
          content: "What is the average time complexity of Merge Sort?",
          difficulty: 3,
          marks: 4,
          negativeMarks: 1,
          options: JSON.stringify([
            { key: "A", text: "O(n)" },
            { key: "B", text: "O(n log n)" },
            { key: "C", text: "O(n^2)" },
            { key: "D", text: "O(log n)" },
          ]),
          correctAnswer: "B",
          createdById: examinerUser.id,
        },
      },
    },
  });
  console.log(`  Created question: ${question.topic}`);

  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const exam = await prisma.exam.create({
    data: {
      institutionId: institution.id,
      title: "CS101 - Final Exam",
      description:
        "Comprehensive exam covering Data Structures and Algorithms.",
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      durationMinutes: 120,
      status: "SCHEDULED",
      totalMarks: 100,
      passingScore: 40,
      createdById: superAdmin.id,
    },
  });
  console.log(`  Created exam: ${exam.title}`);

  console.log("\nSeeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
