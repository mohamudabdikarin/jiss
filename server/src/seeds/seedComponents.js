// filepath: server/src/seeds/seedComponents.js
const Component = require('../models/Component');

const COMPONENTS = [
  {
    name: 'Announcement Bar',
    slug: 'announcement-bar',
    type: 'announcement_bar',
    content: {
      text: 'Welcome to the International Journal of Computing and Digital Systems. We accept submissions year-round.',
      backgroundColor: '#003366',
      textColor: '#ffffff',
      link: null,
      linkText: null
    },
    isGlobal: true,
    isActive: true,
    displayConditions: { showOnMobile: true, showOnDesktop: true },
    order: 0
  },
  {
    name: 'Homepage CTA',
    slug: 'homepage-cta',
    type: 'cta_block',
    content: {
      title: 'Submit Your Research',
      description: 'Contribute to advancing computing and digital systems research.',
      buttonText: 'Submit Now',
      buttonLink: '/submit',
      backgroundColor: '#f8f9fa',
      textColor: '#003366'
    },
    isGlobal: false,
    isActive: true,
    displayConditions: { showOnMobile: true, showOnDesktop: true },
    order: 1
  }
];

const seedComponents = async () => {
  const count = await Component.countDocuments();
  if (count > 0) {
    console.log('✅ Components already exist, skipping seed');
    return;
  }

  for (const c of COMPONENTS) {
    await Component.create(c);
  }
  console.log(`✅ Seeded ${COMPONENTS.length} components`);
};

module.exports = seedComponents;
