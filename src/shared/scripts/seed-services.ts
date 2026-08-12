import 'dotenv/config';

import { prisma } from '../db/prisma.js';
import { logger } from '../configs/logger.js';

const IMAGE_BASE =
  'https://5cgoqeih8ebpqu48.public.blob.vercel-storage.com/uploads';

type SeedService = {
  icon: string;
  imageUrl: string;
  alt: string;
  displayOrder: number;
  content: {
    en: {
      slug: string;
      title: string;
      subtitle: string;
      shortDescription: string;
      details: string;
      tag: string;
      body: string;
      features: string[];
      whoThisIsFor: string;
    };
    de: {
      slug: string;
      title: string;
      subtitle: string;
      shortDescription: string;
      details: string;
      tag: string;
      body: string;
      features: string[];
      whoThisIsFor: string;
    };
  };
};

const seedServices: SeedService[] = [
  {
    icon: 'headset',
    imageUrl: `${IMAGE_BASE}/customer.jpg`,
    alt: 'Customer support team at work',
    displayOrder: 0,
    content: {
      en: {
        slug: 'customer-support',
        title: 'Customer Support',
        subtitle: 'Support that scales without the chaos',
        shortDescription:
          'Omnichannel support across email, chat, and voice with response-time SLAs.',
        details:
          'Trained agents, quality scoring, and clear ownership. Your customers get consistent help. You get relief.',
        tag: 'Support that scales',
        body: 'Email, chat, and voice with trained agents, AI-assisted routing, and clear response SLAs. Tracked and reported every week.',
        features: [
          'Omnichannel: email, chat, voice',
          'AI-assisted routing',
          'Response-time SLAs',
          'Weekly quality reports',
        ],
        whoThisIsFor:
          'SaaS and ecommerce teams that want better support without growing headcount.',
      },
      de: {
        slug: 'kundenservice',
        title: 'Customer Support',
        subtitle: 'Support, der ohne Chaos mitwächst',
        shortDescription:
          'Omnichannel-Support per E-Mail, Chat und Telefon mit SLAs für Reaktionszeiten.',
        details:
          'Geschulte Mitarbeitende, Qualitätsbewertungen und klare Verantwortlichkeiten. Ihre Kunden erhalten konsistente Unterstützung. Sie werden entlastet.',
        tag: 'Support, der mitwächst',
        body: 'E-Mail, Chat und Telefon mit geschulten Mitarbeitenden, AI-gestützter Weiterleitung und klaren Reaktionszeit-SLAs. Jede Woche erfasst und berichtet.',
        features: [
          'Omnichannel: E-Mail, Chat, Telefon',
          'AI-gestützte Weiterleitung',
          'Reaktionszeit-SLAs',
          'Wöchentliche Qualitätsberichte',
        ],
        whoThisIsFor:
          'SaaS- und E-Commerce-Teams, die besseren Support wünschen, ohne zusätzliches Personal aufzubauen.',
      },
    },
  },
  {
    icon: 'files',
    imageUrl: `${IMAGE_BASE}/back-office.jpg`,
    alt: 'Back-office team processing documents',
    displayOrder: 1,
    content: {
      en: {
        slug: 'back-office',
        title: 'Back-Office',
        subtitle: 'Operations that run like clockwork',
        shortDescription:
          'Data entry, document processing, and admin operations on documented SOPs.',
        details:
          'Reliable execution at a fraction of in-house cost. Accuracy and throughput you can measure weekly.',
        tag: 'Execution you can trust',
        body: 'Data entry, documents, CRM, and administration on documented SOPs with QA checks. Structured execution you can measure weekly.',
        features: [
          'Data entry and validation',
          'Document processing',
          'CRM and admin operations',
          'SOP-based QA',
        ],
        whoThisIsFor:
          'Teams buried in administration who need reliable throughput without more hires.',
      },
      de: {
        slug: 'backoffice',
        title: 'Back-Office',
        subtitle: 'Abläufe, die wie ein Uhrwerk funktionieren',
        shortDescription:
          'Dateneingabe, Dokumentenverarbeitung und administrative Abläufe auf Basis dokumentierter SOPs.',
        details:
          'Zuverlässige Ausführung zu einem Bruchteil der internen Kosten. Genauigkeit und Durchsatz, die Sie wöchentlich messen können.',
        tag: 'Ausführung, auf die Sie vertrauen können',
        body: 'Dateneingabe, Dokumente, CRM und Administration auf Basis dokumentierter SOPs mit QA-Prüfungen. Strukturierte Ausführung, die Sie wöchentlich messen können.',
        features: [
          'Dateneingabe und -validierung',
          'Dokumentenverarbeitung',
          'CRM- und Verwaltungsabläufe',
          'SOP-basierte QA',
        ],
        whoThisIsFor:
          'Teams mit hoher administrativer Belastung, die zuverlässigen Durchsatz ohne weitere Einstellungen benötigen.',
      },
    },
  },
  {
    icon: 'code',
    imageUrl: `${IMAGE_BASE}/software.jpg`,
    alt: 'Software development team collaborating',
    displayOrder: 2,
    content: {
      en: {
        slug: 'it-software',
        title: 'IT & Software',
        subtitle: 'Tech talent that feels like your team',
        shortDescription:
          'Dedicated developers, software support, and QA as an extension of your team.',
        details:
          'Skilled engineers who ship with your stack and process, not a disconnected vendor queue.',
        tag: 'Tech talent on demand',
        body: 'Dedicated developers, support, and QA from Ethiopia with GMT+3 overlap. Sprint cadence and code standards, not freelancers.',
        features: [
          'Dedicated development teams',
          'Support and maintenance',
          'QA and testing',
          'Nearshore GMT+3 overlap',
        ],
        whoThisIsFor:
          'Product teams scaling engineering without the full hiring burden.',
      },
      de: {
        slug: 'it-software',
        title: 'IT & Software',
        subtitle:
          'Technische Fachkräfte, die sich wie Ihr eigenes Team anfühlen',
        shortDescription:
          'Dedizierte Entwickler, Software-Support und QA als Erweiterung Ihres Teams.',
        details:
          'Qualifizierte Engineers, die mit Ihrem Tech-Stack und Ihren Prozessen liefern, statt Aufgaben in einer isolierten Dienstleister-Warteschlange abzuarbeiten.',
        tag: 'Technische Fachkräfte nach Bedarf',
        body: 'Dedizierte Entwickler, Support und QA aus Äthiopien mit Überschneidung in GMT+3. Sprint-Rhythmus und Codestandards statt Freelancer.',
        features: [
          'Dedizierte Entwicklungsteams',
          'Support und Wartung',
          'QA und Tests',
          'Nearshore-Überschneidung in GMT+3',
        ],
        whoThisIsFor:
          'Produktteams, die ihre Entwicklung skalieren möchten, ohne den gesamten Einstellungsaufwand zu tragen.',
      },
    },
  },
  {
    icon: 'bot',
    imageUrl: `${IMAGE_BASE}/ai.jpg`,
    alt: 'AI automation workflow dashboard',
    displayOrder: 3,
    content: {
      en: {
        slug: 'ai-automation',
        title: 'AI & Automation',
        subtitle: 'AI that solves business problems',
        shortDescription:
          'Workflow mapping and AI-powered automation that removes busywork.',
        details:
          'From intelligent document processing to AI-assisted support. Outsourcing that gets smarter over time.',
        tag: 'Intelligence that works',
        body: 'We map workflows, cut busywork, and deploy automation where judgment is not required. Practical, measurable, and ROI-tracked.',
        features: [
          'Workflow mapping',
          'Document AI and extraction',
          'CRM and operations automation',
          'ROI-tracked rollout',
        ],
        whoThisIsFor:
          'Companies slowed by manual work that need automation done, not just demos.',
      },
      de: {
        slug: 'ai-automatisierung',
        title: 'AI & Automatisierung',
        subtitle: 'AI, die Geschäftsprobleme löst',
        shortDescription:
          'Workflow-Mapping und AI-gestützte Automatisierung, die Routinearbeit beseitigt.',
        details:
          'Von intelligenter Dokumentenverarbeitung bis zu AI-gestütztem Support. Outsourcing, das mit der Zeit intelligenter wird.',
        tag: 'Intelligenz, die funktioniert',
        body: 'Wir erfassen Workflows, reduzieren Routinearbeit und setzen Automatisierung dort ein, wo kein Urteilsvermögen erforderlich ist. Praxisnah, messbar und mit erfasstem ROI.',
        features: [
          'Workflow-Mapping',
          'Dokumenten-AI und Extraktion',
          'CRM- und Prozessautomatisierung',
          'Einführung mit ROI-Tracking',
        ],
        whoThisIsFor:
          'Unternehmen, die durch manuelle Arbeit ausgebremst werden und umgesetzte Automatisierung statt bloßer Demos benötigen.',
      },
    },
  },
  {
    icon: 'chart-column',
    imageUrl: `${IMAGE_BASE}/data.jpg`,
    alt: 'Operations data dashboard with charts',
    displayOrder: 4,
    content: {
      en: {
        slug: 'data-reporting',
        title: 'Data & Reporting',
        subtitle: 'See everything. Guess nothing.',
        shortDescription:
          'Operational dashboards, KPI tracking, and automated reporting.',
        details:
          'Always know how operations are performing. Decisions driven by data, not guesswork.',
        tag: 'Clarity you can act on',
        body: 'KPI dashboards, automated reports, and clean operational data so leadership sees performance clearly. No guesswork.',
        features: [
          'KPI dashboards',
          'Automated weekly reports',
          'Data cleaning and validation',
          'Stakeholder-ready summaries',
        ],
        whoThisIsFor:
          'Leaders who need clear operations reporting to decide and improve faster.',
      },
      de: {
        slug: 'daten-reporting',
        title: 'Daten & Reporting',
        subtitle: 'Alles sehen. Nichts erraten.',
        shortDescription:
          'Operative Dashboards, KPI-Tracking und automatisiertes Reporting.',
        details:
          'Sie wissen jederzeit, wie Ihre Abläufe funktionieren. Entscheidungen auf Basis von Daten statt Vermutungen.',
        tag: 'Klarheit, auf deren Basis Sie handeln können',
        body: 'KPI-Dashboards, automatisierte Berichte und saubere operative Daten, damit die Führungsebene die Leistung klar erkennt. Keine Vermutungen.',
        features: [
          'KPI-Dashboards',
          'Automatisierte Wochenberichte',
          'Datenbereinigung und -validierung',
          'Entscheidungsreife Zusammenfassungen für Stakeholder',
        ],
        whoThisIsFor:
          'Führungskräfte, die ein klares operatives Reporting benötigen, um schneller zu entscheiden und zu verbessern.',
      },
    },
  },
];

async function seedAllServices() {
  let created = 0;
  let skipped = 0;

  for (const service of seedServices) {
    const existing = await prisma.service.findFirst({
      where: {
        OR: [
          {
            content: { path: ['en', 'slug'], equals: service.content.en.slug },
          },
          {
            content: { path: ['de', 'slug'], equals: service.content.de.slug },
          },
        ],
      },
      select: { id: true },
    });

    if (existing !== null) {
      logger.info(
        { slug: service.content.en.slug },
        'service already exists, skipping',
      );
      skipped += 1;
      continue;
    }

    await prisma.service.create({
      data: {
        icon: service.icon,
        imageUrl: service.imageUrl,
        alt: service.alt,
        displayOrder: service.displayOrder,
        content: service.content,
      },
    });
    created += 1;
  }

  logger.info({ created, skipped }, 'services seed complete');
}

seedAllServices()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    logger.error(err, 'services seed failed');
    await prisma.$disconnect();
    process.exit(1);
  });
