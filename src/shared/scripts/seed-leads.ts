import 'dotenv/config';

import { prisma } from '../db/prisma.js';
import { logger } from '../configs/logger.js';

type SeedContactLead = {
  fullName: string;
  workEmail: string;
  company?: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  details: {
    topic: string;
    message: string;
    locale: 'en' | 'de';
  };
  daysAgo: number;
};

type SeedPilotLead = {
  fullName: string;
  workEmail: string;
  company: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  details: {
    service: string;
    challenge: string;
    volume: string;
    timeline: string;
    context?: string;
    locale: 'en' | 'de';
  };
  daysAgo: number;
};

type SeedCallLead = {
  fullName: string;
  workEmail: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';
  calBookingUid: string;
  details: {
    bookingTime: string;
    bookingEndTime?: string;
    timezone: string;
    meetingUrl?: string;
    cancelledAt?: string;
  };
  daysAgo: number;
};

const seedContactLeads: SeedContactLead[] = [
  {
    fullName: 'Jane Doe',
    workEmail: 'jane.doe@acme-gmbh.com',
    company: 'Acme GmbH',
    status: 'NEW',
    details: {
      topic: 'Outsourcing services',
      message:
        'We are exploring options to scale our customer support team and would like to learn more about dedicated pods and SLAs.',
      locale: 'en',
    },
    daysAgo: 0,
  },
  {
    fullName: 'Max Mustermann',
    workEmail: 'max.mustermann@beispiel.de',
    company: 'Beispiel AG',
    status: 'CONTACTED',
    details: {
      topic: 'Partnership',
      message:
        'Wir sind ein mittelständisches Unternehmen und interessieren uns für eine Zusammenarbeit im Bereich Back-Office. Können wir ein Gespräch vereinbaren?',
      locale: 'de',
    },
    daysAgo: 2,
  },
  {
    fullName: 'Sarah Lindqvist',
    workEmail: 'sarah@northwind.io',
    company: 'Northwind',
    status: 'CONVERTED',
    details: {
      topic: 'AI and workflow automation',
      message:
        'We signed up after the pilot — automating our invoice processing has cut manual work by 60%. Happy to share details.',
      locale: 'en',
    },
    daysAgo: 9,
  },
  {
    fullName: 'Tom Keller',
    workEmail: 'tom.keller@example.com',
    status: 'CLOSED',
    details: {
      topic: 'General enquiry',
      message:
        'Just wanted to ask about your office locations, but we are not looking for outsourcing services at the moment.',
      locale: 'en',
    },
    daysAgo: 14,
  },
];

const seedPilotLeads: SeedPilotLead[] = [
  {
    fullName: 'Anna Schmidt',
    workEmail: 'anna.schmidt@cloudwerk.de',
    company: 'Cloudwerk',
    status: 'NEW',
    details: {
      service: 'Customer support',
      challenge:
        'Our ticket backlog keeps growing faster than the team can handle and response times are slipping.',
      volume: '100–500 tasks per month',
      timeline: 'Within 30 days',
      context: 'Team of 12, EU timezone overlap required.',
      locale: 'de',
    },
    daysAgo: 1,
  },
  {
    fullName: 'James Okafor',
    workEmail: 'james.okafor@finleap.co',
    company: 'FinLeap',
    status: 'CONTACTED',
    details: {
      service: 'Back-office operations',
      challenge:
        'Manual data entry across three systems is eating hours every week and accuracy is inconsistent.',
      volume: '500–2,000 tasks per month',
      timeline: 'Within 1–3 months',
      context: 'Finance back-office, KYC documents.',
      locale: 'en',
    },
    daysAgo: 4,
  },
  {
    fullName: 'Elena Petrova',
    workEmail: 'elena@brightdata.ai',
    company: 'Bright Data',
    status: 'CONVERTED',
    details: {
      service: 'AI and workflow automation',
      challenge:
        'We need a pilot to validate AI-assisted routing for our support queues before committing.',
      volume: 'Under 100 tasks per month',
      timeline: 'As soon as possible',
      locale: 'en',
    },
    daysAgo: 7,
  },
  {
    fullName: 'Lukas Weber',
    workEmail: 'lukas.weber@musterfirma.de',
    company: 'Musterfirma',
    status: 'CLOSED',
    details: {
      service: 'IT and software support',
      challenge:
        'We asked about offshore QA capacity but our budget for this year is already fully allocated.',
      volume: 'It varies or is not measured yet',
      timeline: 'Just exploring for now',
      locale: 'de',
    },
    daysAgo: 12,
  },
];

const seedCallLeads: SeedCallLead[] = [
  {
    fullName: 'Mia Hoffmann',
    workEmail: 'mia.hoffmann@protonmail.de',
    status: 'NEW',
    calBookingUid: 'seed-call-0001',
    details: {
      bookingTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      bookingEndTime: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ).toISOString(),
      timezone: 'Europe/Berlin',
      meetingUrl: 'https://meet.example.com/seed-call-0001',
    },
    daysAgo: 0,
  },
  {
    fullName: 'Daniel Kim',
    workEmail: 'daniel.kim@techstart.io',
    status: 'CONTACTED',
    calBookingUid: 'seed-call-0002',
    details: {
      bookingTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      bookingEndTime: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ).toISOString(),
      timezone: 'America/New_York',
      meetingUrl: 'https://meet.example.com/seed-call-0002',
    },
    daysAgo: 3,
  },
  {
    fullName: 'Priya Nair',
    workEmail: 'priya.nair@orbitlabs.com',
    status: 'CONVERTED',
    calBookingUid: 'seed-call-0003',
    details: {
      bookingTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      bookingEndTime: new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ).toISOString(),
      timezone: 'Asia/Dubai',
      meetingUrl: 'https://meet.example.com/seed-call-0003',
    },
    daysAgo: 6,
  },
  {
    fullName: 'Felix Braun',
    workEmail: 'felix.braun@web.de',
    status: 'CLOSED',
    calBookingUid: 'seed-call-0004',
    details: {
      bookingTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      bookingEndTime: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ).toISOString(),
      timezone: 'Europe/Berlin',
      meetingUrl: 'https://meet.example.com/seed-call-0004',
      cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    daysAgo: 5,
  },
];

function createdAt(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

async function seedAllLeads() {
  let created = 0;
  let skipped = 0;

  for (const lead of seedContactLeads) {
    const existing = await prisma.lead.findFirst({
      where: { workEmail: lead.workEmail, type: 'CONTACT' },
      select: { id: true },
    });
    if (existing !== null) {
      logger.info(
        { workEmail: lead.workEmail },
        'contact lead already exists, skipping',
      );
      skipped += 1;
      continue;
    }
    await prisma.lead.create({
      data: {
        type: 'CONTACT',
        status: lead.status,
        fullName: lead.fullName,
        workEmail: lead.workEmail,
        company: lead.company ?? null,
        details: lead.details,
        createdAt: createdAt(lead.daysAgo),
      },
    });
    created += 1;
  }

  for (const lead of seedPilotLeads) {
    const existing = await prisma.lead.findFirst({
      where: { workEmail: lead.workEmail, type: 'PILOT' },
      select: { id: true },
    });
    if (existing !== null) {
      logger.info(
        { workEmail: lead.workEmail },
        'pilot lead already exists, skipping',
      );
      skipped += 1;
      continue;
    }
    await prisma.lead.create({
      data: {
        type: 'PILOT',
        status: lead.status,
        fullName: lead.fullName,
        workEmail: lead.workEmail,
        company: lead.company,
        details: lead.details,
        createdAt: createdAt(lead.daysAgo),
      },
    });
    created += 1;
  }

  for (const lead of seedCallLeads) {
    const existing = await prisma.lead.findFirst({
      where: { calBookingUid: lead.calBookingUid },
      select: { id: true },
    });
    if (existing !== null) {
      logger.info(
        { calBookingUid: lead.calBookingUid },
        'call lead already exists, skipping',
      );
      skipped += 1;
      continue;
    }
    await prisma.lead.create({
      data: {
        type: 'CALL',
        status: lead.status,
        fullName: lead.fullName,
        workEmail: lead.workEmail,
        company: null,
        calBookingUid: lead.calBookingUid,
        details: lead.details,
        createdAt: createdAt(lead.daysAgo),
      },
    });
    created += 1;
  }

  logger.info({ created, skipped }, 'leads seed complete');
}

seedAllLeads()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    logger.error(err, 'leads seed failed');
    await prisma.$disconnect();
    process.exit(1);
  });
