/**
 * Seed script: Demo doctor data & Subscription Entitlements
 * Run from: e:\Swahit\swahit-dev\apps\backend
 * Command: npx ts-node --project tsconfig.json src/prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient();

const doctors = [
  { name: 'Dr. Aisha Mehta', specialty: 'Therapist', bio: 'Specializes in anxiety, stress, and life transitions. Uses CBT and mindfulness-based approaches to help clients build resilience.', rating: 4.9, reviewCount: 128, yearsExp: 10, languages: 'English, Hindi', consultFee: 999 },
  { name: 'Dr. Rohan Sharma', specialty: 'Psychiatrist', bio: 'Board-certified psychiatrist focusing on mood disorders, ADHD, and medication management. Compassionate and evidence-based.', rating: 4.8, reviewCount: 94, yearsExp: 14, languages: 'English, Hindi', consultFee: 1499 },
  { name: 'Dr. Priya Nair', specialty: 'Counselor', bio: 'Relationship and family counselor. Helps individuals and couples navigate conflict, communication, and emotional growth.', rating: 4.7, reviewCount: 76, yearsExp: 7, languages: 'English, Malayalam, Tamil', consultFee: 799 },
  { name: 'Dr. Vikram Bose', specialty: 'Clinical Psychologist', bio: 'Expert in trauma therapy and EMDR. Works with individuals recovering from difficult life experiences with a trauma-informed approach.', rating: 4.9, reviewCount: 112, yearsExp: 12, languages: 'English, Bengali', consultFee: 1199 },
  { name: 'Dr. Sneha Pillai', specialty: 'Wellness Coach', bio: 'Certified wellness coach focusing on burnout recovery, work-life balance, and building healthy emotional habits.', rating: 4.6, reviewCount: 55, yearsExp: 5, languages: 'English, Hindi, Kannada', consultFee: 599 },
];

const plans = [
  { name: 'FREE', priceMonthly: 0, priceYearly: 0 },
  { name: 'SILVER', priceMonthly: 499, priceYearly: 4990 },
  { name: 'GOLD', priceMonthly: 999, priceYearly: 9990 },
  { name: 'PLATINUM', priceMonthly: 1999, priceYearly: 19990 },
];

const features = [
  { key: 'mood_tracking', category: 'CORE', description: 'Basic daily mood tracking' },
  { key: 'unlimited_mood_tracking', category: 'CORE', description: 'Unlimited daily mood entries' },
  { key: 'ai_chat_basic', category: 'AI', description: 'Basic AI companion chat' },
  { key: 'ai_chat_advanced', category: 'AI', description: 'Advanced AI with deep memory and insights' },
  { key: 'mood_insights_weekly', category: 'ANALYTICS', description: 'Weekly summary of mood patterns' },
  { key: 'mood_analytics_advanced', category: 'ANALYTICS', description: 'Deep dive analytics and correlations' },
  { key: 'appointment_booking', category: 'MEDICAL', description: 'Book sessions with professionals' },
  { key: 'live_consultation', category: 'MEDICAL', description: 'In-app video consultations' },
  { key: 'prescription_upload', category: 'MEDICAL', description: 'Store and manage prescriptions safely' },
  { key: 'medicine_delivery', category: 'MEDICAL', description: 'Order prescribed medicines' },
  { key: 'emergency_support', category: 'SUPPORT', description: '24/7 priority emergency routing' },
  { key: 'family_access', category: 'SUPPORT', description: 'Linked accounts for family members' },
  { key: 'habit_tracking', category: 'CORE', description: 'Track wellness habits' },
  { key: 'reports_generation', category: 'ANALYTICS', description: 'Exportable PDF health reports' },
];

const planFeatures = [
  // FREE Plan
  { plan: 'FREE', feature: 'mood_tracking', limitValue: 10 },
  { plan: 'FREE', feature: 'ai_chat_basic', limitValue: 20 },
  { plan: 'FREE', feature: 'appointment_booking', limitValue: null },

  // SILVER Plan
  { plan: 'SILVER', feature: 'unlimited_mood_tracking', limitValue: null },
  { plan: 'SILVER', feature: 'ai_chat_basic', limitValue: 100 },
  { plan: 'SILVER', feature: 'mood_insights_weekly', limitValue: null },
  { plan: 'SILVER', feature: 'appointment_booking', limitValue: null },
  { plan: 'SILVER', feature: 'habit_tracking', limitValue: null },

  // GOLD Plan
  { plan: 'GOLD', feature: 'unlimited_mood_tracking', limitValue: null },
  { plan: 'GOLD', feature: 'ai_chat_advanced', limitValue: null },
  { plan: 'GOLD', feature: 'mood_insights_weekly', limitValue: null },
  { plan: 'GOLD', feature: 'mood_analytics_advanced', limitValue: null },
  { plan: 'GOLD', feature: 'appointment_booking', limitValue: null },
  { plan: 'GOLD', feature: 'live_consultation', limitValue: null },
  { plan: 'GOLD', feature: 'prescription_upload', limitValue: null },
  { plan: 'GOLD', feature: 'habit_tracking', limitValue: null },
  { plan: 'GOLD', feature: 'reports_generation', limitValue: 5 },

  // PLATINUM Plan
  { plan: 'PLATINUM', feature: 'unlimited_mood_tracking', limitValue: null },
  { plan: 'PLATINUM', feature: 'ai_chat_advanced', limitValue: null },
  { plan: 'PLATINUM', feature: 'mood_insights_weekly', limitValue: null },
  { plan: 'PLATINUM', feature: 'mood_analytics_advanced', limitValue: null },
  { plan: 'PLATINUM', feature: 'appointment_booking', limitValue: null },
  { plan: 'PLATINUM', feature: 'live_consultation', limitValue: null },
  { plan: 'PLATINUM', feature: 'prescription_upload', limitValue: null },
  { plan: 'PLATINUM', feature: 'medicine_delivery', limitValue: null },
  { plan: 'PLATINUM', feature: 'emergency_support', limitValue: null },
  { plan: 'PLATINUM', feature: 'family_access', limitValue: null },
  { plan: 'PLATINUM', feature: 'habit_tracking', limitValue: null },
  { plan: 'PLATINUM', feature: 'reports_generation', limitValue: null },
];

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Doctors
  let docCount = 0;
  for (const doc of doctors) {
    const exists = await prisma.doctor.findFirst({ where: { name: doc.name } });
    if (!exists) {
      await prisma.doctor.create({ data: doc });
      docCount++;
    }
  }
  console.log(`✅ ${docCount} new doctors seeded.`);

  // 2. Seed Plans
  let planCount = 0;
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: { priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly },
      create: plan,
    });
    planCount++;
  }
  console.log(`✅ ${planCount} plans seeded.`);

  // 3. Seed Features
  let featureCount = 0;
  for (const feat of features) {
    await prisma.feature.upsert({
      where: { key: feat.key },
      update: { category: feat.category, description: feat.description },
      create: feat,
    });
    featureCount++;
  }
  console.log(`✅ ${featureCount} features seeded.`);

  // 4. Seed Plan-Feature Mappings
  let mappingCount = 0;
  for (const pf of planFeatures) {
    const plan = await prisma.plan.findUnique({ where: { name: pf.plan } });
    const feature = await prisma.feature.findUnique({ where: { key: pf.feature } });

    if (plan && feature) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureId: { planId: plan.id, featureId: feature.id },
        },
        update: { limitValue: pf.limitValue },
        create: {
          planId: plan.id,
          featureId: feature.id,
          limitValue: pf.limitValue,
        },
      });
      mappingCount++;
    }
  }
  console.log(`✅ ${mappingCount} plan-feature mappings seeded.`);
  
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
