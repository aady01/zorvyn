import {
  PrismaClient,
  Role,
  RecordType,
  Team,
  User,
  Project,
} from '../src/generated/prisma/client'

import { faker } from '@faker-js/faker'

import {prisma} from "../src/config/prisma"

// PUT YOUR COMPANY ID HERE
const COMPANY_ID = "c0dce029-27c4-4233-ad58-83990c667ce7"

const USERS_COUNT = 50
const PROJECTS_COUNT = 5
const RECORDS_COUNT = 10000

const TEAM_TYPES = [
  'Engineering',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
]

// CATEGORY 

function getCategory(type: RecordType, teamName: string): string {
  if (type === RecordType.INCOME) {
    return faker.helpers.arrayElement([
      'Client Payment',
      'Subscription Revenue',
      'Investment',
    ])
  }

  if (teamName.includes('Engineering')) {
    return faker.helpers.arrayElement(['Infrastructure', 'Software'])
  }

  if (teamName.includes('Marketing')) {
    return faker.helpers.arrayElement(['Ads', 'Campaign'])
  }

  if (teamName.includes('Sales')) {
    return faker.helpers.arrayElement(['Client Acquisition', 'Travel'])
  }

  return faker.helpers.arrayElement(['Salary', 'Operations', 'Misc'])
}

// AMOUNT 

function getAmount(category: string, type: RecordType): number {
  if (type === RecordType.INCOME) {
    return faker.number.float({ min: 20000, max: 500000 })
  }

  switch (category) {
    case 'Salary':
      return faker.number.float({ min: 30000, max: 150000 })
    case 'Infrastructure':
      return faker.number.float({ min: 20000, max: 200000 })
    case 'Ads':
      return faker.number.float({ min: 10000, max: 80000 })
    case 'Travel':
      return faker.number.float({ min: 2000, max: 25000 })
    default:
      return faker.number.float({ min: 1000, max: 50000 })
  }
}

// DATE 

function getDate(category: string): Date {
  if (category === 'Salary') {
    return faker.date.recent({ days: 30 })
  }

  if (category === 'Ads' || category === 'Campaign') {
    return faker.date.recent({ days: 90 })
  }

  return faker.date.past({ years: 1 })
}

// MAIN 

async function main() {
  console.log("Seeding for YOUR company...")

  // Check company exists
  const company = await prisma.company.findUnique({
    where: { id: COMPANY_ID },
  })

  if (!company) {
    throw new Error("Company not found")
  }

  // Teams (create if not exist) 
  const existingTeams = await prisma.team.findMany({
    where: { companyId: COMPANY_ID },
  })

  if (existingTeams.length === 0) {
    await prisma.team.createMany({
      data: TEAM_TYPES.map((name) => ({
        name,
        companyId: COMPANY_ID,
      })),
    })
  }

  const teams = (await prisma.team.findMany({
    where: { companyId: COMPANY_ID },
  })) as Team[]

  // Users 
  const usersData = []

  for (let i = 0; i < USERS_COUNT; i++) {
    const team = faker.helpers.arrayElement(teams)

    const role =
      i === 0
        ? Role.ADMIN
        : i < 5
        ? Role.MANAGER
        : Role.EMPLOYEE

    usersData.push({
      email: faker.internet.email(),
      password: faker.internet.password(),
      name: `${faker.person.firstName()} (${team.name})`,
      role,
      companyId: COMPANY_ID,
      teamId: team.id,
    })
  }

  await prisma.user.createMany({ data: usersData })

  const users = (await prisma.user.findMany({
    where: { companyId: COMPANY_ID },
  })) as User[]

  // Projects 
  await prisma.project.createMany({
    data: Array.from({ length: PROJECTS_COUNT }).map(() => ({
      name: faker.commerce.productName(),
      companyId: COMPANY_ID,
    })),
  })

  const projects = (await prisma.project.findMany({
    where: { companyId: COMPANY_ID },
  })) as Project[]

  // Budgets 
  const months = ['2026-01', '2026-02', '2026-03', '2026-04']

  const budgets = []

  for (const team of teams) {
    for (const period of months) {
      budgets.push({
        totalBudget: faker.number.float({ min: 500000, max: 2000000 }),
        usedAmount: faker.number.float({ min: 100000, max: 400000 }),
        period,
        teamId: team.id,
        companyId: COMPANY_ID,
      })
    }
  }

  await prisma.budget.createMany({
  data: budgets,
  skipDuplicates: true,
})

  // Financial Records 
  const batchSize = 1000
  let created = 0

  while (created < RECORDS_COUNT) {
    const batch = []

    for (let i = 0; i < batchSize; i++) {
      const validUsers = users.filter(u => u.teamId);
      const user = faker.helpers.arrayElement(validUsers)
      const team = teams.find(t => t.id === user.teamId)!

      const project = faker.helpers.maybe(() =>
        faker.helpers.arrayElement(projects)
      )

      const type = faker.helpers.arrayElement([
        RecordType.INCOME,
        RecordType.EXPENSE,
      ])

      const category = getCategory(type, team.name)

      batch.push({
        amount: getAmount(category, type),
        type,
        category,
        notes: faker.lorem.sentence(),
        date: getDate(category),
        userId: user.id,
        teamId: team.id,
        projectId: project?.id,
        companyId: COMPANY_ID,
      })
    }

    const res = await prisma.financialRecord.createMany({
      data: batch,
    })

    created += res.count
    console.log(`${created}/${RECORDS_COUNT}`)
  }

  console.log("Done seeding your company!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())