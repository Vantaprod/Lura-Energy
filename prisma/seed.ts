import { PrismaClient, Role, MediaKind } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding settings...');

  const settings: Record<string, unknown> = {
    'contact.email': 'info@luraenergy.com',
    'contact.phone': '+234 800 000 0000',
    'contact.whatsapp': '2348000000000',
    'company.intro':
      'Lura Energy delivers premium solar power systems for homes, businesses, and industrial clients across Nigeria. We partner with Litharv, Huihang, and Vestwood to bring verified hardware and installation expertise to every project.',
    'impact.eyebrow': 'Our Impact',
    'impact.headingWhite': 'Powering',
    'impact.headingAccent': 'Possibility',
    'impact.body1':
      'What started with a vision for more accessible and reliable energy is becoming a growing presence across Nigeria. Lura continues to expand through successful solar projects, strategic distributor partnerships, and an increasing operational footprint across key regions.',
    'impact.body2':
      'Every project represents more than an installation — it represents a home, business, or organization gaining greater access to dependable energy.',
    'impact.ctaLabel': 'Learn more',
    'impact.ctaHref': '/projects',
    'impact.stat1Label': 'Operating Regions in Nigeria',
    'impact.stat1Value': '90',
    'impact.stat1Suffix': '+',
    'impact.stat2Label': 'Successful Projects',
    'impact.stat2Value': '5',
    'impact.stat2Suffix': '',
    'impact.stat3Label': 'Distribution Partners',
    'impact.stat3Value': '5000',
    'impact.stat3Suffix': '+',
    'home.ctaTitle': 'Ready to switch to solar?',
    'home.ctaBody': 'Talk to the Lura team about your energy needs.',
    'home.heroImages': '',
    'legal.privacyNotice':
      'Lura Energy collects contact information you submit through this website solely to respond to your enquiry. We do not sell or share your information with third parties.',
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  console.log('Seeding product series...');

  const series = [
    {
      name: 'Inverter Series',
      slug: 'inverter-series',
      summary: 'Hybrid inverters for homes and businesses — 12V, 24V, and 48V models.',
      description:
        'Lura hybrid inverters combine MPPT solar charging, grid charging, and battery management in one unit. Available in 1.6kW, 4.2kW, 6.2kW, and 10.2kW configurations.',
      sortOrder: 1,
    },
    {
      name: 'Battery Series',
      slug: 'battery-series',
      summary: 'Lithium iron phosphate (LiFePO4) batteries with ultra-long cycle life.',
      description:
        'Grade-A LiFePO4 cells, integrated BMS, and support for parallel expansion. Designed for daily cycling and long service life.',
      sortOrder: 2,
    },
    {
      name: 'C&I Series',
      slug: 'commercial-industrial-series',
      summary: 'Commercial and industrial energy storage for larger loads.',
      description:
        'Stackable high-voltage battery banks paired with three-phase hybrid inverters. For offices, factories, and multi-building sites.',
      sortOrder: 3,
    },
    {
      name: 'All-in-One Series',
      slug: 'all-in-one-series',
      summary: 'Portable power stations with integrated battery, inverter, and MPPT.',
      description:
        'Plug-and-play energy storage for backup, camping, and small retail. Built-in solar input and AC output.',
      sortOrder: 4,
    },
    {
      name: 'Solar Panel Series',
      slug: 'solar-panel-series',
      summary: 'Monocrystalline and bifacial panels for rooftops and ground mount.',
      description:
        'High-efficiency PV modules with 25-year performance warranty. Available in multiple wattages.',
      sortOrder: 5,
    },
    {
      name: 'Solar Accessories',
      slug: 'solar-accessories',
      summary: 'Mounting, cabling, protection, and monitoring.',
      description:
        'Everything needed to complete a safe, code-compliant installation — from rails to surge protection to monitoring gateways.',
      sortOrder: 6,
    },
  ];

  for (const s of series) {
    await prisma.productCategory.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        summary: s.summary,
        description: s.description,
        sortOrder: s.sortOrder,
        published: true,
      },
      create: {
        name: s.name,
        slug: s.slug,
        summary: s.summary,
        description: s.description,
        sortOrder: s.sortOrder,
        published: true,
      },
    });
  }

  console.log('Seeding inverter models...');

  const inverterCat = await prisma.productCategory.findUnique({
    where: { slug: 'inverter-series' },
  });

  if (inverterCat) {
    const models = [
      {
        name: 'Litharv 1.6kW 12V',
        slug: 'litharv-1-6kw-12v',
        modelNumber: 'LTH-1.6K-12V',
        brand: 'Litharv',
        summary: 'Compact 1.6kW hybrid inverter for small homes and backup.',
        description:
          'The Litharv 1.6kW 12V hybrid inverter is designed for small homes, backup power, and light commercial use. Its integrated 60A MPPT solar charger supports direct PV input up to 2000W.',
        keyFeatures: [
          '1600W rated output, 3200W surge',
          'Built-in 60A MPPT solar charger',
          'Pure sine wave output',
          'LCD display with real-time monitoring',
          'Parallel-capable with up to 6 units',
        ],
        sortOrder: 1,
      },
      {
        name: 'Litharv 4.2kW 24V',
        slug: 'litharv-4-2kw-24v',
        modelNumber: 'LTH-4.2K-24V',
        brand: 'Litharv',
        summary: 'Mid-range 4.2kW hybrid inverter for medium homes.',
        description:
          'The Litharv 4.2kW 24V hybrid inverter handles typical residential loads — fridges, pumps, lights, AC — with dual MPPT input for flexible PV array design.',
        keyFeatures: [
          '4200W rated output, 8400W surge',
          'Dual MPPT, up to 5000W PV input',
          'WiFi monitoring ready',
          'Supports lithium and lead-acid batteries',
        ],
        sortOrder: 2,
      },
      {
        name: 'Litharv 6.2kW 48V',
        slug: 'litharv-6-2kw-48v',
        modelNumber: 'LTH-6.2K-48V',
        brand: 'Litharv',
        summary: 'High-capacity 6.2kW inverter for larger homes and small businesses.',
        description:
          'The Litharv 6.2kW 48V hybrid inverter supports heavier loads and larger PV arrays, with dual MPPT and parallel operation for scaling.',
        keyFeatures: [
          '6200W rated output, 12400W surge',
          'Dual MPPT, up to 8000W PV input',
          'Supports parallel operation (up to 4 units)',
          'Generator input compatible',
        ],
        sortOrder: 3,
      },
      {
        name: 'Litharv 10.2kW 48V',
        slug: 'litharv-10-2kw-48v',
        modelNumber: 'LTH-10.2K-48V',
        brand: 'Litharv',
        summary: 'Three-phase capable 10.2kW inverter for commercial loads.',
        description:
          'The Litharv 10.2kW 48V hybrid inverter supports three-phase output and up to four units in parallel — suitable for offices, retail, and light industrial sites.',
        keyFeatures: [
          '10200W rated output, 20400W surge',
          'Three-phase output supported',
          'Up to 4 units in parallel',
          'Dual MPPT with 16000W PV capacity',
        ],
        sortOrder: 4,
      },
    ];

    for (const m of models) {
      await prisma.product.upsert({
        where: { slug: m.slug },
        update: {
          name: m.name,
          modelNumber: m.modelNumber,
          brand: m.brand,
          summary: m.summary,
          description: m.description,
          keyFeatures: m.keyFeatures,
          sortOrder: m.sortOrder,
          categoryId: inverterCat.id,
          published: true,
        },
        create: {
          name: m.name,
          slug: m.slug,
          modelNumber: m.modelNumber,
          brand: m.brand,
          summary: m.summary,
          description: m.description,
          keyFeatures: m.keyFeatures,
          sortOrder: m.sortOrder,
          categoryId: inverterCat.id,
          published: true,
        },
      });
    }
  }

  console.log('Seeding service centres...');

  const centres = [
    {
      name: 'Lura Chain Store Ikeja',
      slug: 'lura-chain-store-ikeja',
      type: 'Both',
      address: '12 Allen Avenue',
      city: 'Ikeja',
      state: 'Lagos',
      phone: '+234 800 000 0001',
      email: 'ikeja@luraenergy.com',
      hours: 'Mon-Sat, 8am-6pm',
      description: 'Full service centre with installation support and in-store pickup.',
      sortOrder: 1,
    },
    {
      name: 'Lura Chain Store Abuja',
      slug: 'lura-chain-store-abuja',
      type: 'Service Centre',
      address: '5 Ademola Adetokunbo Crescent',
      city: 'Abuja',
      state: 'FCT',
      phone: '+234 800 000 0002',
      email: 'abuja@luraenergy.com',
      hours: 'Mon-Sat, 8am-6pm',
      description: 'Installation services and product support.',
      sortOrder: 2,
    },
    {
      name: 'Lura Pickup Point Port Harcourt',
      slug: 'lura-pickup-point-ph',
      type: 'Pickup Point',
      address: '88 Aba Road',
      city: 'Port Harcourt',
      state: 'Rivers',
      phone: '+234 800 000 0003',
      hours: 'Mon-Fri, 9am-5pm',
      description: 'Order pickup point for verified Lura products.',
      sortOrder: 3,
    },
  ];

  for (const c of centres) {
    await prisma.serviceCentre.upsert({
      where: { slug: c.slug },
      update: { ...c, published: true },
      create: { ...c, published: true },
    });
  }

  console.log('Seeding testimonials, FAQs, resources, projects, services, solutions...');

  const testimonials = [
    {
      id: 'seed-testimonial-1',
      name: 'Adaeze Okonkwo',
      role: 'Homeowner',
      company: 'Lekki',
      quote:
        'Lura installed a 5kW system for our home. The team was professional, the system works flawlessly, and our diesel generator has not run since.',
    },
    {
      id: 'seed-testimonial-2',
      name: 'Emeka Nwosu',
      role: 'Operations Manager',
      company: 'SME Logistics',
      quote:
        'Our warehouse runs on Lura C&I storage during outages. Zero downtime since installation, and the monitoring dashboard is genuinely useful.',
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: { ...t, published: true, sortOrder: 0 },
      create: { ...t, published: true, sortOrder: 0 },
    });
  }

  const faqs = [
    {
      id: 'seed-faq-1',
      question: 'How much does a home solar system cost in Nigeria?',
      answer:
        'Cost depends on system size, battery capacity, and equipment. A typical 3–5kW home system ranges widely; we provide detailed quotes after a site review.',
    },
    {
      id: 'seed-faq-2',
      question: 'How long does installation take?',
      answer:
        'A residential install typically takes 1–2 days on-site, plus a survey visit beforehand.',
    },
    {
      id: 'seed-faq-3',
      question: 'Do you offer a warranty?',
      answer:
        'Yes. Warranty periods vary by product and partner brand. Specific terms are shown on each product page and in your quote.',
    },
    {
      id: 'seed-faq-4',
      question: 'Do you install outside Lagos?',
      answer:
        'Yes. We operate through Lura Chain Store service centres and pickup points across Nigeria.',
    },
    {
      id: 'seed-faq-5',
      question: 'Can the system be expanded later?',
      answer:
        'Yes. Most of our inverters and batteries support parallel expansion — designed for growth.',
    },
  ];

  for (const f of faqs) {
    await prisma.fAQ.upsert({
      where: { id: f.id },
      update: { ...f, published: true },
      create: { ...f, published: true },
    });
  }

  const services = [
    {
      id: 'seed-service-1',
      name: 'Residential Solar Installation',
      slug: 'residential-solar-installation',
      summary: 'Full home solar systems — survey, design, install, and commissioning.',
      description:
        'Lura handles the complete residential installation from survey to commissioning, using verified equipment and certified electricians.',
    },
    {
      id: 'seed-service-2',
      name: 'Commercial Energy Audit',
      slug: 'commercial-energy-audit',
      summary: 'Load analysis and system sizing for offices, retail, and light industrial.',
      description:
        'We measure your real load profile, identify inefficiencies, and recommend the smallest system that meets your needs.',
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { ...s, published: true, sortOrder: 0 },
      create: { ...s, published: true, sortOrder: 0 },
    });
  }

  const solutions = [
    {
      id: 'seed-solution-1',
      name: 'Home Backup',
      slug: 'home-backup',
      summary: 'Reliable backup power for homes and small businesses.',
      description:
        'Battery-backed systems that keep essential loads running through grid outages.',
    },
    {
      id: 'seed-solution-2',
      name: 'Business Continuity',
      slug: 'business-continuity',
      summary: 'Energy storage for commercial operations.',
      description:
        'C&I systems designed to eliminate downtime and reduce diesel dependence.',
    },
  ];

  for (const s of solutions) {
    await prisma.solution.upsert({
      where: { id: s.id },
      update: { ...s, published: true, sortOrder: 0 },
      create: { ...s, published: true, sortOrder: 0 },
    });
  }

  const resources = [
    {
      id: 'seed-resource-1',
      title: 'How to size a home solar system',
      slug: 'how-to-size-home-solar-system',
      summary: 'A practical guide to calculating daily kWh, battery size, and panel wattage.',
      body:
        'Start with a load inventory. List every appliance you want to run, its wattage, and its daily hours of use. Multiply wattage by hours to get daily watt-hours. Sum across appliances to get your total daily consumption. Then size your battery to cover at least one day of autonomy (two is better), size your panels to recharge the battery in one sunny day, and size your inverter to cover peak simultaneous load.',
    },
    {
      id: 'seed-resource-2',
      title: 'Lithium vs lead-acid batteries',
      slug: 'lithium-vs-lead-acid-batteries',
      summary: 'A side-by-side comparison for Nigerian solar buyers.',
      body:
        'Lithium iron phosphate (LiFePO4) batteries cost more upfront but last 5–10× longer than lead-acid, weigh much less, accept higher charge rates, and maintain voltage better under load. For most residential and small commercial installations in Nigeria, lithium is now the more cost-effective option over the full system life.',
    },
  ];

  for (const r of resources) {
    await prisma.resource.upsert({
      where: { id: r.id },
      update: { ...r, published: true, publishedAt: new Date() },
      create: { ...r, published: true, publishedAt: new Date() },
    });
  }

  const projects = [
    {
      id: 'seed-project-1',
      title: '5kW Home System — Lekki',
      slug: '5kw-home-system-lekki',
      category: 'Residential',
      location: 'Lekki, Lagos',
      description: 'A 5kW hybrid system with 10kWh battery storage.',
      systemCapacity: '5kW / 10kWh',
      sortOrder: 1,
    },
    {
      id: 'seed-project-2',
      title: '20kW Commercial System — Ikeja',
      slug: '20kw-commercial-system-ikeja',
      category: 'Commercial',
      location: 'Ikeja, Lagos',
      description: 'A 20kW three-phase commercial system for retail operations.',
      systemCapacity: '20kW / 40kWh',
      sortOrder: 2,
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: { ...p, published: true },
      create: { ...p, published: true },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });