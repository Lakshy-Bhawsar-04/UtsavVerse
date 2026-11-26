/**
 * src/data/eventsData.js
 * Editable copy, Indian cities, category defaults, testimonials, and local image assets.
 * You can customize headings, descriptions, and image references here in VS Code.
 */

export const UtsavVerse_IMAGES = {
  heroConcert: '/src/assets/images/hero_indian_concert_1795169039444.jpg',
  wedding: '/src/assets/images/event_indian_wedding_1795169039303.jpg',
  cultural: '/src/assets/images/event_cultural_festival_1795169040114.jpg',
  tech: '/src/assets/images/event_tech_conference_1795169039578.jpg',
  workshop: '/src/assets/images/event_creative_workshop_1795169040206.jpg',
  festival: '/src/assets/images/event_festive_celebration_1795169039334.jpg',
  lakshyBhawsar: '/src/assets/images/lakshy_bhawsar.jpeg',
  arpitGaveshinde: '/src/assets/images/arpit_gaveshinde.jpg',
};

export const INDIAN_CITIES = [
  'Mumbai',
  'New Delhi',
  'Bengaluru',
  'Jaipur',
  'Udaipur',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
];

export const EVENT_CATEGORIES = [
  'Music Concerts',
  'Wedding Events',
  'Cultural Events',
  'Festivals',
  'Technology Conferences',
  'Workshops',
  'Sports Events',
  'Comedy Shows',
  'Business Events',
  'Educational Events',
];

export const WHY_CHOOSE_FEATURES = [
  {
    index: '01.',
    title: 'Real-Time Seat Allocation',
    description:
      'Every ticket reservation locks inventory atomically on the server, eliminating double-bookings during high-demand concert and conference drops.',
  },
  {
    index: '02.',
    title: 'Server-Verified INR Payments',
    description:
      'Checkout uses Razorpay order creation and cryptographic HMAC-SHA256 signature verification on our backend before confirming any booking.',
  },
  {
    index: '03.',
    title: 'Vetted Organizers Across India',
    description:
      'Every event organizer undergoes administrator verification prior to listing live events, protecting attendees across Mumbai, Delhi, Bengaluru, and beyond.',
  },
  {
    index: '04.',
    title: 'Instant PDF E-Tickets & Flexible Policy',
    description:
      'Download clean PDF passes immediately after payment confirmation and manage cancellations directly from your personal dashboard.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Discover Events',
    description:
      'Search by city, category, date window, or ticket budget across 10 curated Indian event categories.',
  },
  {
    step: '02',
    title: 'Select Ticket Tiers',
    description:
      'Compare seating categories, check live remaining seat counts, and lock your quantity with transparent INR pricing.',
  },
  {
    step: '03',
    title: 'Verify & Receive E-Ticket',
    description:
      'Complete Razorpay test checkout with instant server-side verification and download your unique EVT-coded PDF ticket.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Ananya Deshmukh',
    role: 'Product Manager, FinStack India',
    city: 'Bengaluru',
    quote:
      'Our engineering team booked 14 passes for the Bengaluru AI & Cloud Summit in one sitting. Receiving verified GST-ready booking codes and instant PDF passes saved us hours.',
  },
  {
    name: 'Raghavendra Singhania',
    role: 'Director, Rajputana Celebrations Guild',
    city: 'Jaipur',
    quote:
      'Moving our heritage wedding showcase ticketing to UtsavVerse cut manual attendee check-ins by 65% and gave our team live tier-by-tier revenue visibility.',
  },
  {
    name: 'Meera Krishnan',
    role: 'Classical Vocalist & Patron',
    city: 'New Delhi',
    quote:
      'Finding authentic courtyard dance recitals and pottery workshops in Delhi used to require five WhatsApp groups. UtsavVerse keeps every detail clear from venue address to seat counts.',
  },
];

export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

export const formatEventDate = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
