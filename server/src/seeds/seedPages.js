// filepath: server/src/seeds/seedPages.js
const Page = require('../models/Page');
const Section = require('../models/Section');
const Footer = require('../models/Footer');
const SiteSettings = require('../models/SiteSettings');
const Category = require('../models/Category');

const translationsData = require('./translationsData');

const seedPages = async (adminUser) => {
  const userId = adminUser?._id;

  // ===== SITE SETTINGS =====
  let existingSettings = await SiteSettings.findOne();
  if (!existingSettings) {
    await SiteSettings.create({
      siteName: 'International Journal of Computing and Digital Systems',
      siteDescription: 'IJCDS is a peer-reviewed, open-access academic journal published by the University of Bahrain.',
      siteUrl: 'https://ijcds.uob.edu.bh',
      siteLogo: 'https://ijcds.uob.edu.bh/wp-content/uploads/2023/03/University_of_Bahrain_logo.png',
      contactEmail: 'ijcds@uob.edu.bh',
      contactPhone: '(00973) 17438559',
      contactAddress: 'Zallaq Highway, Road 5429, Sakhir 1054, UOB Sakhir Campus, Building S21, P.O. Box 32038, Kingdom of Bahrain',
      journalMeta: {
        issn: '2535-9886 (Print) / 2210-142X (Online)',
        citeScore: '1.7',
        doi: 'dx.doi.org/10.12785/ijcds',
        frequency: 'Biannual (Continuous Volume)'
      },
      defaultSEO: {
        metaTitle: 'IJCDS - International Journal of Computing and Digital Systems',
        metaDescription: 'Peer-reviewed academic journal focusing on computing and digital systems.',
        metaKeywords: ['journal', 'computing', 'digital systems', 'IJCDS', 'University of Bahrain']
      },
      translations: translationsData,
      updatedBy: userId
    });
    console.log('✅ Site settings seeded');
  } else if (!existingSettings.translations || Object.keys(existingSettings.translations || {}).length === 0) {
    existingSettings.translations = translationsData;
    await existingSettings.save();
    console.log('✅ Site settings translations seeded');
  } else {
    let merged = false;
    const tr = existingSettings.translations || {};
    for (const [lang, seedObj] of Object.entries(translationsData)) {
      if (!tr[lang]) tr[lang] = {};
      for (const [key, val] of Object.entries(seedObj)) {
        if (tr[lang][key] === undefined) {
          tr[lang][key] = val;
          merged = true;
        }
      }
    }
    if (merged) {
      existingSettings.markModified('translations');
      await existingSettings.save();
      console.log('✅ Site settings translations updated (merged new keys)');
    }
  }

  // ===== CATEGORIES =====
  const categories = [
    'Artificial Intelligence', 'Machine Learning', 'Computer Networks',
    'Cybersecurity', 'Cloud Computing', 'IoT', 'Data Science',
    'Software Engineering', 'Digital Systems', 'Signal Processing'
  ];
  for (const name of categories) {
    await Category.findOneAndUpdate(
      { name },
      { name, slug: name.toLowerCase().replace(/\s+/g, '-'), isActive: true },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Categories seeded');

  // Navigation is seeded in seedNavigation.js (run via index.js or seedNavigation.js)

  // ===== FOOTER =====
  const existingFooter = await Footer.findOne().lean();
  if (!existingFooter) {
    await Footer.create({
      content: '© 2023 IJCDS | International Journal of Computing and Digital Systems | University of Bahrain'
    });
    console.log('✅ Footer seeded');
  } else if (existingFooter.copyrightText && !existingFooter.content) {
    await Footer.findByIdAndUpdate(existingFooter._id, { content: existingFooter.copyrightText });
    console.log('✅ Footer migrated to content field');
  }

  // ===== PAGES =====
  const pagesData = [
    {
      title: 'Home',
      slug: 'home',
      isHomePage: true,
      template: 'default',
      status: 'published',
      order: 0,
      seo: {
        metaTitle: 'IJCDS - International Journal of Computing and Digital Systems',
        metaDescription: 'Welcome to IJCDS, a peer-reviewed, open-access journal by University of Bahrain.'
      },
      sections: [
        {
          name: 'Welcome',
          type: 'text',
          content: {
            heading: 'Welcome to IJCDS',
            titleStyle: 'auto',
            bodyTheme: 'callout_left',
            body: '<p>The International Journal of Computing and Digital Systems (IJCDS) is a peer-reviewed, open-access journal published by the University of Bahrain. First issued in <strong>2012</strong>, IJCDS has grown into a well-established venue for publishing original research articles in all areas of computing and digital systems. As of <strong>2025</strong>, <strong>all volumes indexed by Scopus</strong>.</p>'
          },
          order: 0
        },
        {
          name: 'Home highlights',
          type: 'stats',
          content: {
            rowVariant: 'dark',
            titleStyle: 'hidden',
            items: [
              { value: '2012', label: 'Founded' },
              { value: '1.7', label: 'CiteScore' },
              { value: 'Open Access', label: 'Free to read' },
              { value: 'Scopus', label: 'All volumes indexed' }
            ]
          },
          order: 1
        },
        {
          name: 'Publication model',
          type: 'richtext',
          content: {
            titleStyle: 'hidden',
            bodyTheme: 'serif_body',
            html: '<p>IJCDS follows a <strong>continuous volume production model</strong> with <strong>three issues per volume per year</strong>. Volumes <strong>5 to 9</strong> were published as discrete issues; from <strong>Volume 10 onward</strong>, articles are published online as soon as they are ready, while still grouped into yearly volumes and issues for citation purposes.</p>'
          },
          order: 2
        }
      ]
    },
    {
      title: 'Aims & Scope',
      slug: 'aims',
      template: 'default',
      status: 'published',
      order: 1,
      sections: [
        {
          name: 'Aims Content',
          type: 'richtext',
          content: {
            html: '<h1>Aims & Scope</h1><p>The International Journal of Computing and Digital Systems (IJCDS) is a peer-reviewed, open-access academic journal dedicated to publishing high-quality research across all areas of computer science and digital systems.</p>'
          },
          order: 0
        }
      ]
    },
    {
      title: 'Editorial Board',
      slug: 'editorial',
      template: 'default',
      status: 'published',
      order: 2,
      sections: [
        {
          name: 'Editorial Team',
          type: 'team',
          content: {
            heading: 'Editorial Board',
            members: [
              { name: 'Mazen Ali', role: 'Editor-in-Chief', bio: 'University of Bahrain, Bahrain' },
              { name: 'Wael El-Medany', role: 'Managing Editor', bio: 'University of Bahrain, Bahrain' }
            ]
          },
          order: 0
        }
      ]
    },
    { title: 'For Authors', slug: 'authors', template: 'default', status: 'published', order: 3, sections: [{ name: 'Authors Info', type: 'richtext', content: { html: '<h1>For Authors</h1><p>Information for authors submitting manuscripts to IJCDS.</p>' }, order: 0 }] },
    { title: 'For Reviewers', slug: 'reviewers', template: 'default', status: 'published', order: 4, sections: [{ name: 'Reviewers Info', type: 'richtext', content: { html: '<h1>For Reviewers</h1><p>Guidelines and information for reviewers.</p>' }, order: 0 }] },
    { title: 'Indexing', slug: 'indexing', template: 'default', status: 'published', order: 5, sections: [{ name: 'Indexing Info', type: 'richtext', content: { html: '<h1>Indexing</h1><p>This journal is indexed by worldwide databases.</p>' }, order: 0 }] },
    { title: 'Ethics and Policies', slug: 'ethics', template: 'default', status: 'published', order: 6, sections: [{ name: 'Ethics Content', type: 'richtext', content: { html: '<h1>Ethics and Policies</h1><p>Publication ethics and malpractice statement.</p>' }, order: 0 }] },
    { title: 'APC Charges', slug: 'apc', template: 'default', status: 'published', order: 7, sections: [{ name: 'APC Info', type: 'richtext', content: { html: '<h1>APC Charges</h1><p>Article Processing Charge: 265 USD for all accepted manuscripts.</p>' }, order: 0 }] },
    { title: 'Contact', slug: 'contact', template: 'contact', status: 'published', order: 8, sections: [{ name: 'Contact Info', type: 'contact', content: { heading: 'Contact Us', description: 'UOB Journals administrators may be contacted at:', email: 'ijcds@uob.edu.bh', phone: '(00973) 17438559', address: 'Zallaq Highway, Road 5429, Sakhir 1054, UOB Sakhir Campus' }, order: 0 }] }
  ];

  for (const pageData of pagesData) {
    const existing = await Page.findOne({ slug: pageData.slug });
    if (existing) continue;

    const { sections: sectionsData, ...pageFields } = pageData;
    const page = await Page.create({ ...pageFields, createdBy: userId, updatedBy: userId });

    if (sectionsData) {
      const sectionIds = [];
      for (const secData of sectionsData) {
        const section = await Section.create({ ...secData, page: page._id });
        sectionIds.push(section._id);
      }
      page.sections = sectionIds;
      await page.save();
    }
  }
  console.log('✅ Pages and sections seeded');
};

module.exports = seedPages;
