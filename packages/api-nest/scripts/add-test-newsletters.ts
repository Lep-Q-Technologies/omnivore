/**
 * Script to add test newsletter subscriptions for UI testing
 * Run with: npx tsx scripts/add-test-newsletters.ts
 */

import { DataSource } from 'typeorm'
import { customAlphabet } from 'nanoid'
import { User } from '../src/user/entities/user.entity'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../src/library/entities/subscription.entity'

const generateEmailAlias = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  8,
)

const testNewsletters = [
  {
    senderEmail: 'newsletter@substack.com',
    title: 'The Daily Tech',
    description: 'Your daily dose of technology news and insights',
    siteUrl: 'https://dailytech.substack.com',
    siteIcon: 'https://bucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com/public/images/favicon.ico',
    itemCount: 12,
  },
  {
    senderEmail: 'dispatch@morning.brew',
    title: 'Morning Brew',
    description: 'Business news delivered daily',
    siteUrl: 'https://www.morningbrew.com',
    siteIcon: null,
    itemCount: 24,
  },
  {
    senderEmail: 'hello@jakobgreenfeld.com',
    title: 'Business Brainstorms',
    description: 'Weekly insights on building online businesses',
    siteUrl: 'https://jakobgreenfeld.com',
    siteIcon: null,
    itemCount: 8,
  },
  {
    senderEmail: 'newsletter@hackernewsletter.com',
    title: 'Hacker Newsletter',
    description: 'Weekly roundup of the best articles from Hacker News',
    siteUrl: 'https://hackernewsletter.com',
    siteIcon: null,
    itemCount: 52,
  },
  {
    senderEmail: 'austin@densediscovery.com',
    title: 'Dense Discovery',
    description: 'A weekly newsletter about design, technology, and culture',
    siteUrl: 'https://www.densediscovery.com',
    siteIcon: null,
    itemCount: 15,
  },
]

async function addTestNewsletters() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DB || 'omnivore',
    entities: [User, SubscriptionEntity],
    synchronize: false,
  })

  try {
    console.log('Connecting to database...')
    await dataSource.initialize()
    console.log('✓ Connected to database')

    const userRepo = dataSource.getRepository(User)
    const subscriptionRepo = dataSource.getRepository(SubscriptionEntity)

    // Find the first user (or create a test user)
    let user = await userRepo.findOne({ where: {} })

    if (!user) {
      console.log('No users found. Creating test user...')
      user = userRepo.create({
        email: 'test@omnivore.app',
        name: 'Test User',
        emailAlias: generateEmailAlias(),
        sourceUserId: `test-${Date.now()}`,
      })
      await userRepo.save(user)
      console.log(`✓ Created test user: ${user.email}`)
    } else {
      console.log(`✓ Found user: ${user.email} (${user.name})`)
    }

    // Ensure user has an email alias
    if (!user.emailAlias) {
      user.emailAlias = generateEmailAlias()
      await userRepo.save(user)
      console.log(`✓ Added email alias to user: ${user.emailAlias}`)
    }

    console.log('\nAdding test newsletters...')

    for (const newsletter of testNewsletters) {
      // Check if this newsletter already exists
      const existing = await subscriptionRepo.findOne({
        where: {
          userId: user.id,
          sourceIdentifier: newsletter.senderEmail,
          sourceType: SubscriptionSourceType.NEWSLETTER,
        },
      })

      if (existing) {
        console.log(`⊘ Skipping "${newsletter.title}" (already exists)`)
        continue
      }

      const emailAlias = generateEmailAlias()

      const subscription = subscriptionRepo.create({
        userId: user.id,
        sourceType: SubscriptionSourceType.NEWSLETTER,
        sourceIdentifier: newsletter.senderEmail, // Store sender email in sourceIdentifier
        emailAlias,
        title: newsletter.title,
        description: newsletter.description,
        siteUrl: newsletter.siteUrl,
        siteIcon: newsletter.siteIcon,
        itemCount: newsletter.itemCount,
        active: true,
        failureCount: 0,
      })

      await subscriptionRepo.save(subscription)

      const fullEmail = `${user.emailAlias}+${emailAlias}@inbox.omnivore.app`
      console.log(`✓ Added "${newsletter.title}"`)
      console.log(`  Email: ${fullEmail}`)
      console.log(`  Sender: ${newsletter.senderEmail}`)
    }

    console.log('\n✅ Test newsletters added successfully!')
    console.log(
      `\nYou can now view them at http://localhost:3000 in the left navigation.`,
    )
  } catch (error) {
    console.error('❌ Error adding test newsletters:', error)
    throw error
  } finally {
    await dataSource.destroy()
  }
}

addTestNewsletters().catch((error) => {
  console.error('Failed to add test newsletters:', error)
  process.exit(1)
})
