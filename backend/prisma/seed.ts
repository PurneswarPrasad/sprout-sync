import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default task templates
  const taskTemplates = [
    {
      key: 'watering',
      label: 'Water',
      colorHex: '#3B82F6', // Blue
      defaultFrequencyDays: 3,
    },
    {
      key: 'fertilizing',
      label: 'Fertilizing',
      colorHex: '#8B5CF6', // Purple
      defaultFrequencyDays: 14,
    },
    {
      key: 'pruning',
      label: 'Pruning',
      colorHex: '#10B981', // Green
      defaultFrequencyDays: 30,
    },
    {
      key: 'spraying',
      label: 'Spraying',
      colorHex: '#F59E0B', // Yellow
      defaultFrequencyDays: 7,
    },
    {
      key: 'sunlightRotation',
      label: 'Sunlight Rotation',
      colorHex: '#F97316', // Orange
      defaultFrequencyDays: 14,
    },
  ];

  for (const template of taskTemplates) {
    await prisma.taskTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template,
    });
  }

  console.log('✅ Task templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

