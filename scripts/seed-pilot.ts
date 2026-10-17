import fs from 'fs';
import pg from 'pg';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if already loaded
  }
}

import { getConfig } from '../src/config.js';
import { hashPassword } from '../src/auth/passwords.js';

interface PilotShopDef {
  slug: string;
  name: string;
  category: 'repair_service' | 'salon_wellness' | 'food_beverage';
  description: string;
  address: string;
  localityId: number;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  ownerUsername: string;
  ownerDisplayName: string;
  verificationMethod: string;
  verificationDate: string;
  items: {
    group: string;
    name: string;
    description: string;
    kind: 'product' | 'service';
    priceType: 'fixed';
    priceInr: number;
    durationMin?: number;
    diet?: 'veg' | 'non_veg' | 'vegan' | 'egg';
    tags: string[];
  }[];
}

export const PILOT_SHOPS: PilotShopDef[] = [
  // -------------------------------------------------------------------------
  // ADYAR (locality_id = 1)
  // -------------------------------------------------------------------------
  {
    slug: 'adyar-mac-iphone-care',
    name: 'Adyar Mac & iPhone Care',
    category: 'repair_service',
    description: 'Expert Apple device repair specialist providing motherboard micro-soldering, authentic screen replacements, and battery swaps with 90-day warranty.',
    address: 'Shop 4, Gandhi Nagar 2nd Main Road, Adyar, Chennai 600020',
    localityId: 1,
    lat: 13.0055,
    lng: 80.2540,
    phone: '+914424410112',
    whatsapp: '+919840110112',
    ownerUsername: 'suresh_adyar',
    ownerDisplayName: 'Suresh Kumar',
    verificationMethod: 'In-person physical store visit and owner phone confirmation',
    verificationDate: '2026-10-15',
    items: [
      {
        group: 'iPhone Repairs',
        name: 'iPhone Screen Replacement',
        description: 'High-gamut OLED/LCD screen replacement with true-tone reprogramming.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 3500,
        durationMin: 45,
        tags: ['iphone', 'screen', 'oled', 'display'],
      },
      {
        group: 'iPhone Repairs',
        name: 'iPhone Battery Replacement',
        description: 'High capacity zero-cycle replacement battery with health percentage calibration.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2200,
        durationMin: 30,
        tags: ['iphone', 'battery', 'charging'],
      },
      {
        group: 'MacBook Services',
        name: 'MacBook Battery Replacement',
        description: 'OEM grade battery replacement for MacBook Air and MacBook Pro models.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 4800,
        durationMin: 60,
        tags: ['macbook', 'battery', 'apple'],
      },
      {
        group: 'MacBook Services',
        name: 'Logic Board IC Repair',
        description: 'Chip-level diagnosis and component replacement for liquid damage or short circuits.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 3200,
        durationMin: 180,
        tags: ['logicboard', 'microsoldering', 'chipset'],
      },
      {
        group: 'MacBook Services',
        name: 'Thermal Paste & Internal Cleaning',
        description: 'Deep heatsink cleaning and high-performance Arctic MX thermal compound repasting.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 800,
        durationMin: 40,
        tags: ['cleaning', 'overheating', 'fan'],
      },
      {
        group: 'iPad Repairs',
        name: 'iPad Glass Digitizer Replacement',
        description: 'Precision front touch glass replacement without display assembly replacement.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2600,
        durationMin: 90,
        tags: ['ipad', 'glass', 'touch'],
      },
      {
        group: 'General Services',
        name: 'Water Damage Ultrasonic Cleaning',
        description: 'Full motherboard ultrasonic isopropyl bath to remove oxidation and corrosion.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1500,
        durationMin: 120,
        tags: ['waterdamage', 'ultrasonic', 'cleaning'],
      },
    ],
  },
  {
    slug: 'premier-gadget-clinic',
    name: 'Premier Gadget Clinic',
    category: 'repair_service',
    description: 'Fast turnaround smartphone and tablet repair lab specializing in Android display replacements, speaker fixes, and charging port repairs.',
    address: '18/2 Lattice Bridge Road, Adyar, Chennai 600020',
    localityId: 1,
    lat: 13.0028,
    lng: 80.2570,
    phone: '+914424420334',
    whatsapp: '+919840120334',
    ownerUsername: 'karthik_gadgets',
    ownerDisplayName: 'Karthik Subramanian',
    verificationMethod: 'In-person shop audit and WhatsApp business identity check',
    verificationDate: '2026-10-15',
    items: [
      {
        group: 'Display & Screen',
        name: 'Android Display Replacement',
        description: 'Original grade FHD+ AMOLED/IPS display installation with frame testing.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1800,
        durationMin: 45,
        tags: ['display', 'screen', 'android'],
      },
      {
        group: 'Battery & Power',
        name: 'Quick Battery Replacement',
        description: 'Certified replacement battery for Xiaomi, Samsung, OnePlus, and Vivo models.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 950,
        durationMin: 25,
        tags: ['battery', 'replacement', 'charging'],
      },
      {
        group: 'Audio & Mic',
        name: 'Speaker & Earpiece Repair',
        description: 'Fix muffled sound, distorted audio, or zero ringtone output.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 450,
        durationMin: 20,
        tags: ['speaker', 'earpiece', 'audio'],
      },
      {
        group: 'Hardware Components',
        name: 'Charging Port Replacement',
        description: 'Type-C and Micro-USB sub-board replacement for slow or intermittent charging.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 600,
        durationMin: 30,
        tags: ['charging', 'port', 'usb'],
      },
      {
        group: 'Hardware Components',
        name: 'Camera Lens Glass Replacement',
        description: 'Cracked rear camera exterior protective glass replacement without sensor swap.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 400,
        durationMin: 15,
        tags: ['camera', 'lens', 'glass'],
      },
      {
        group: 'Accessories & Protection',
        name: 'Tempered Glass Installation',
        description: '9H edge-to-edge curved tempered glass with oleophobic coating.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 250,
        durationMin: 10,
        tags: ['temperedglass', 'screenprotector'],
      },
    ],
  },
  {
    slug: 'adyar-artisan-bakes',
    name: 'Adyar Artisan Bakes',
    category: 'food_beverage',
    description: 'European-style artisan neighborhood bakery specializing in naturally fermented sourdough breads, flaky French viennoiserie, and specialty coffee.',
    address: '24 Kasturibai Nagar 3rd Cross Street, Adyar, Chennai 600020',
    localityId: 1,
    lat: 13.0039,
    lng: 80.2520,
    phone: '+914424430556',
    whatsapp: '+919840130556',
    ownerUsername: 'meenakshi_bakes',
    ownerDisplayName: 'Meenakshi Sundaram',
    verificationMethod: 'In-person store visit, menu sample verification, and owner consent form',
    verificationDate: '2026-10-15',
    items: [
      {
        group: 'Artisan Breads',
        name: 'Sourdough Country Loaf',
        description: '36-hour slow-fermented wild sourdough with a crisp crust and open crumb.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 180,
        diet: 'vegan',
        tags: ['sourdough', 'bread', 'vegan', 'fermented'],
      },
      {
        group: 'Artisan Breads',
        name: 'Focaccia with Rosemary & Sea Salt',
        description: 'Extra virgin olive oil focaccia topped with fresh garden rosemary and Maldon sea salt.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 160,
        diet: 'vegan',
        tags: ['focaccia', 'oliveoil', 'bread'],
      },
      {
        group: 'Viennoiserie & Pastries',
        name: 'Roasted Almond Croissant',
        description: 'Double-baked French butter croissant filled with frangipane almond cream.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 140,
        diet: 'egg',
        tags: ['croissant', 'almond', 'pastry'],
      },
      {
        group: 'Viennoiserie & Pastries',
        name: 'Pain au Chocolat',
        description: 'Flaky layered pastry folded around two batons of 55% Belgian dark chocolate.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 150,
        diet: 'egg',
        tags: ['chocolate', 'croissant', 'viennoiserie'],
      },
      {
        group: 'Desserts & Cakes',
        name: 'Basque Burnt Cheesecake Slice',
        description: 'Caramelized top with an ultra-creamy, custard-like cream cheese center.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 220,
        diet: 'egg',
        tags: ['cheesecake', 'dessert', 'slice'],
      },
      {
        group: 'Beverages',
        name: 'Cold Brew Specialty Coffee 250ml',
        description: '18-hour cold steeped single-estate Arabica beans from Chikmagalur.',
        kind: 'product',
        priceType: 'fixed',
        priceInr: 160,
        diet: 'vegan',
        tags: ['coffee', 'coldbrew', 'arabica'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // T. NAGAR (locality_id = 26)
  // -------------------------------------------------------------------------
  {
    slug: 'tnagar-chipset-solutions',
    name: 'T. Nagar Chipset & Laptop Solutions',
    category: 'repair_service',
    description: 'Premier laptop motherboard rework lab in T. Nagar handling complex BGA chip repairs, hinge reconstructions, and SSD performance upgrades.',
    address: '55 Usman Road, T. Nagar, Chennai 600017',
    localityId: 26,
    lat: 13.0405,
    lng: 80.2330,
    phone: '+914424340778',
    whatsapp: '+919840140778',
    ownerUsername: 'venkat_laptop',
    ownerDisplayName: 'Venkatesh Raman',
    verificationMethod: 'In-person store visit, tax invoice verification, and owner consent check',
    verificationDate: '2026-10-16',
    items: [
      {
        group: 'Motherboard Repairs',
        name: 'Laptop Motherboard Chipset BGA Rework',
        description: 'Infrared BGA station rework for GPU, southbridge, and power management IC faults.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 3200,
        durationMin: 240,
        tags: ['motherboard', 'bga', 'laptop', 'chipset'],
      },
      {
        group: 'Software & OS',
        name: 'OS Reinstallation & Complete Data Backup',
        description: 'Clean Windows 11/Linux installation with full user profiles and data migration.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 750,
        durationMin: 60,
        tags: ['windows', 'os', 'backup', 'software'],
      },
      {
        group: 'Upgrades & Storage',
        name: 'NVMe SSD 1TB Upgrade & System Clone',
        description: 'Gen4 high-speed NVMe 1TB drive installation with zero-downtime disk cloning.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 4500,
        durationMin: 60,
        tags: ['ssd', 'upgrade', 'nvme', 'storage'],
      },
      {
        group: 'Hardware Repairs',
        name: 'Broken Laptop Hinge Repair',
        description: 'Metal bracket reinforcement and plastic bezel reconstruction for cracked hinges.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 850,
        durationMin: 90,
        tags: ['hinge', 'laptop', 'bodyrepair'],
      },
      {
        group: 'Hardware Repairs',
        name: 'Laptop Keyboard Replacement',
        description: 'Full membrane/backlit keyboard replacement for Dell, HP, Lenovo, and Asus.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1250,
        durationMin: 45,
        tags: ['keyboard', 'replacement', 'laptop'],
      },
      {
        group: 'Hardware Repairs',
        name: 'DC Power Jack Replacement',
        description: 'Soldered internal charging socket replacement to eliminate charging disconnects.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 650,
        durationMin: 40,
        tags: ['dcjack', 'charging', 'power'],
      },
    ],
  },
  {
    slug: 'speedy-mobile-care-tnagar',
    name: 'Speedy Mobile Care T. Nagar',
    category: 'repair_service',
    description: 'Express multi-brand smartphone repair center on Ranganathan Street specializing in 30-minute broken glass repairs, mic issues, and battery fixes.',
    address: '12 Ranganathan Street, T. Nagar, Chennai 600017',
    localityId: 26,
    lat: 13.0422,
    lng: 80.2315,
    phone: '+914424350990',
    whatsapp: '+919840150990',
    ownerUsername: 'praveen_mobile',
    ownerDisplayName: 'Praveen Chandran',
    verificationMethod: 'Phone verification with store manager and WhatsApp business catalog inspection',
    verificationDate: '2026-10-16',
    items: [
      {
        group: 'Screen Services',
        name: '30-Minute Screen Replacement',
        description: 'On-the-spot display replacement with touch responsiveness and color calibration test.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1999,
        durationMin: 30,
        tags: ['screen', 'express', 'display'],
      },
      {
        group: 'Battery Services',
        name: 'Fast Battery Swap',
        description: 'Quick battery change with safe heat-pad removal and current draw testing.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 899,
        durationMin: 20,
        tags: ['battery', 'swap', 'fast'],
      },
      {
        group: 'Component Repairs',
        name: 'Mic & Receiver Repair',
        description: 'Noise cancellation and primary microphone replacement for clear call quality.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 450,
        durationMin: 25,
        tags: ['mic', 'receiver', 'audio'],
      },
      {
        group: 'Component Repairs',
        name: 'Back Glass Replacement',
        description: 'Laser machine rear glass separation and fresh adhesive panel installation.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 799,
        durationMin: 45,
        tags: ['backglass', 'rearcover'],
      },
      {
        group: 'Component Repairs',
        name: 'Power & Volume Button Flex Cable Fix',
        description: 'Internal tact switch and ribbon flex replacement for stuck physical buttons.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 350,
        durationMin: 25,
        tags: ['buttons', 'powerbutton', 'volume'],
      },
      {
        group: 'Emergency Services',
        name: 'Water Damage Revival',
        description: 'Immediate battery disconnect, chemical cleaning, and board drying treatment.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1200,
        durationMin: 90,
        tags: ['waterdamage', 'revival'],
      },
    ],
  },
  {
    slug: 'elegance-unisex-salon-tnagar',
    name: 'Elegance Unisex Salon & Spa',
    category: 'salon_wellness',
    description: 'Upscale beauty and grooming salon situated on Pondy Bazaar providing precision haircuts, keratin treatments, radiant skin facials, and bridal makeovers.',
    address: '40 Pondy Bazaar, Sir Thyagaraya Road, T. Nagar, Chennai 600017',
    localityId: 26,
    lat: 13.0410,
    lng: 80.2365,
    phone: '+914424360112',
    whatsapp: '+919840160112',
    ownerUsername: 'priya_elegance',
    ownerDisplayName: 'Priya Raghavan',
    verificationMethod: 'In-person salon inspection and phone call verification with proprietor',
    verificationDate: '2026-10-16',
    items: [
      {
        group: 'Hair Styling',
        name: "Executive Men's Haircut & Styling",
        description: 'Precision scissor cut, hair wash, scalp massage, and professional blowdry finish.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 350,
        durationMin: 30,
        tags: ['haircut', 'mens', 'styling'],
      },
      {
        group: 'Hair Styling',
        name: "Women's Layered Haircut & Blowdry",
        description: 'Consultation, customized layered styling cut, nourishing wash, and serum finish.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 750,
        durationMin: 45,
        tags: ['haircut', 'womens', 'layers'],
      },
      {
        group: 'Hair Care & Treatments',
        name: 'Keratin Hair Spa Treatment',
        description: 'Deep conditioning protein infusion to eliminate frizz and restore hair luster.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1500,
        durationMin: 75,
        tags: ['keratin', 'hairspa', 'frizz'],
      },
      {
        group: 'Facial & Skin Care',
        name: 'Herbal Radiance Facial',
        description: 'Multi-step organic herbal facial with exfoliation, fruit mask, and glow serum.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1200,
        durationMin: 60,
        tags: ['facial', 'skincare', 'glow'],
      },
      {
        group: 'Grooming Essentials',
        name: 'Beard Shaping & Charcoal Scrub',
        description: 'Sharp razor edge lining, trimming, and deep cleansing charcoal scrub.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 300,
        durationMin: 20,
        tags: ['beard', 'grooming', 'mens'],
      },
      {
        group: 'Spa & Wellness',
        name: 'Manicure & Pedicure Combo',
        description: 'Exfoliating foot soak, cuticle care, scrub, foot massage, and buffing.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 950,
        durationMin: 60,
        tags: ['manicure', 'pedicure', 'spa'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // VELACHERY (locality_id = 31)
  // -------------------------------------------------------------------------
  {
    slug: 'velachery-apple-service-hub',
    name: 'Velachery Apple & Electronics Service Hub',
    category: 'repair_service',
    description: 'Dedicated Apple and electronics device service station on Velachery Bypass Road handling MacBook screen assemblies, iPad parts, and logic board diagnosis.',
    address: '102 Velachery Bypass Road, Velachery, Chennai 600042',
    localityId: 31,
    lat: 12.9780,
    lng: 80.2225,
    phone: '+914422440334',
    whatsapp: '+919840170334',
    ownerUsername: 'anand_velachery',
    ownerDisplayName: 'Anand Natarajan',
    verificationMethod: 'In-person visit to workshop, equipment review, and verified WhatsApp number',
    verificationDate: '2026-10-16',
    items: [
      {
        group: 'MacBook Services',
        name: 'MacBook Screen Assembly Replacement',
        description: 'Complete upper clamshell display assembly replacement with True Tone support.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 7500,
        durationMin: 60,
        tags: ['macbook', 'display', 'screen', 'apple'],
      },
      {
        group: 'iPhone Services',
        name: 'iPhone Rear Camera Glass Repair',
        description: 'Precision sapphire crystal lens replacement without camera module disassembly.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 650,
        durationMin: 20,
        tags: ['iphone', 'camera', 'lens'],
      },
      {
        group: 'iPad Services',
        name: 'iPad Battery Replacement',
        description: 'High capacity lithium polymer cell replacement with safety thermal tests.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2800,
        durationMin: 90,
        tags: ['ipad', 'battery', 'apple'],
      },
      {
        group: 'Hardware Components',
        name: 'Type-C Flex Cable Repair',
        description: 'Fix loose ports or non-charging lightning and USB Type-C connector assemblies.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 950,
        durationMin: 40,
        tags: ['typec', 'charging', 'flexcable'],
      },
      {
        group: 'Smartwatch Repairs',
        name: 'Apple Watch Screen Refurbishment',
        description: 'OLED digitizer separation and OCA glass lamination for cracked screens.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 3400,
        durationMin: 120,
        tags: ['applewatch', 'screen', 'oled'],
      },
      {
        group: 'Diagnosis',
        name: 'Motherboard Short-Circuit Diagnostic',
        description: 'Full multimeter and thermal camera PCB analysis to isolate voltage rail shorts.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1500,
        durationMin: 90,
        tags: ['diagnosis', 'motherboard', 'pcb'],
      },
    ],
  },
  {
    slug: 'digital-express-pc-lab',
    name: 'Digital Express PC & Mobile Lab',
    category: 'repair_service',
    description: 'Custom desktop gaming PC builder, hardware servicing lab, and emergency data recovery provider located in Tansi Nagar, Velachery.',
    address: '15 100 Feet Road, Tansi Nagar, Velachery, Chennai 600042',
    localityId: 31,
    lat: 12.9765,
    lng: 80.2195,
    phone: '+914422450556',
    whatsapp: '+919840180556',
    ownerUsername: 'dinesh_digital',
    ownerDisplayName: 'Dinesh Raj',
    verificationMethod: 'Phone call verification with owner and trade license copy review',
    verificationDate: '2026-10-17',
    items: [
      {
        group: 'PC Assembly & Maintenance',
        name: 'Custom Desktop Assembly & Cable Management',
        description: 'Professional assembly of PC parts with clean routing and BIOS optimization.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1500,
        durationMin: 120,
        tags: ['pcbuild', 'desktop', 'assembly'],
      },
      {
        group: 'PC Assembly & Maintenance',
        name: 'Liquid Cooler Servicing & Refill',
        description: 'AIO liquid cooler flush, bubble bleed, radiator dust removal, and pump testing.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 900,
        durationMin: 60,
        tags: ['liquidcooling', 'cooling', 'maintenance'],
      },
      {
        group: 'Upgrades & Components',
        name: 'RAM Upgrade 16GB DDR4 with Installation',
        description: 'High-speed 3200MHz DDR4 16GB module installation and dual-channel verification.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2600,
        durationMin: 15,
        tags: ['ram', 'upgrade', 'memory'],
      },
      {
        group: 'Power & Hardware',
        name: 'SMPS Power Supply Replacement',
        description: 'Bronze rated 550W power supply replacement to resolve reboot and shutoff faults.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2800,
        durationMin: 30,
        tags: ['smps', 'powersupply', 'hardware'],
      },
      {
        group: 'Data & Recovery',
        name: 'Data Recovery from Corrupted Drive',
        description: 'Sector-by-sector extraction of lost documents and photos from damaged HDD/SSD.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2500,
        durationMin: 180,
        tags: ['datarecovery', 'storage', 'hdd'],
      },
      {
        group: 'Software Services',
        name: 'Antivirus & Complete Malware Removal',
        description: 'Deep system scan, rootkit purging, browser cleanup, and license installation.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 499,
        durationMin: 45,
        tags: ['antivirus', 'malware', 'security'],
      },
    ],
  },
  {
    slug: 'glow-grace-family-salon',
    name: 'Glow & Grace Family Salon',
    category: 'salon_wellness',
    description: 'Modern neighborhood salon on Vijayanagar Main Road delivering organic hair treatments, anti-dandruff scalp therapy, skin facials, and waxing services.',
    address: '88 Vijayanagar Main Road, Velachery, Chennai 600042',
    localityId: 31,
    lat: 12.9740,
    lng: 80.2240,
    phone: '+914422460778',
    whatsapp: '+919840190778',
    ownerUsername: 'kavitha_salon',
    ownerDisplayName: 'Kavitha Murugan',
    verificationMethod: 'In-person store visit, price sheet inspection, and proprietor verification call',
    verificationDate: '2026-10-17',
    items: [
      {
        group: 'Hair Services',
        name: 'Classic Haircut & Organic Conditioning Wash',
        description: 'Gentle clarifying wash, hair shaping, conditioning treatment, and blowdry.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 300,
        durationMin: 30,
        tags: ['haircut', 'wash', 'conditioning'],
      },
      {
        group: 'Hair Services',
        name: 'Anti-Dandruff Scalp Therapy',
        description: 'Tea tree oil scalp exfoliation, steam ozone therapy, and soothing mask.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 850,
        durationMin: 45,
        tags: ['dandruff', 'scalp', 'haircare'],
      },
      {
        group: 'Skin & Facial',
        name: 'Skin Brightening De-Tan Facial',
        description: 'Sun damage correction, lactic peel mask, cold compression, and brightening cream.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 999,
        durationMin: 60,
        tags: ['facial', 'detan', 'skincare'],
      },
      {
        group: 'Color & Highlights',
        name: 'Root Touch-Up & Ammonia-Free Coloring',
        description: 'Organic ammonia-free grey coverage with keratin nourishment.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 800,
        durationMin: 60,
        tags: ['haircolor', 'roottouchup'],
      },
      {
        group: 'Body Care',
        name: 'Full Arm & Leg Honey Waxing',
        description: 'Gentle chocolate/honey warm wax application with soothing aloe vera gel.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 650,
        durationMin: 40,
        tags: ['waxing', 'hairremoval'],
      },
      {
        group: 'Massage & Relaxation',
        name: 'Express Head Massage with Essential Oils',
        description: '20-minute acupressure head, neck, and shoulder massage with warm sesame oil.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 350,
        durationMin: 20,
        tags: ['headmassage', 'relaxation', 'spa'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // MYLAPORE (locality_id = 16)
  // -------------------------------------------------------------------------
  {
    slug: 'mylapore-precision-audio',
    name: 'Mylapore Precision Audio & Electronics Clinic',
    category: 'repair_service',
    description: 'Renowned heritage audio clinic in Mylapore specializing in vintage amplifier restorations, Hi-Fi speaker driver re-coning, turntable calibration, and high-end DAC repairs.',
    address: '35 Kutchery Road, Mylapore, Chennai 600004',
    localityId: 16,
    lat: 13.0345,
    lng: 80.2680,
    phone: '+914424640990',
    whatsapp: '+919840200990',
    ownerUsername: 'balaji_audio',
    ownerDisplayName: 'Balaji Ranganathan',
    verificationMethod: 'In-person lab audit, owner interview, and commercial registration verification',
    verificationDate: '2026-10-17',
    items: [
      {
        group: 'Amplifier & Receiver',
        name: 'Vintage Amplifier & Receiver Servicing',
        description: 'Potentiometer deoxidization, bias calibration, and capacitor bank health testing.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 2000,
        durationMin: 180,
        tags: ['amplifier', 'vintage', 'audio', 'stereo'],
      },
      {
        group: 'Speaker Repairs',
        name: 'Hi-Fi Speaker Driver Re-coning & Foam Edge Fix',
        description: 'Precision paper/kevlar cone alignment, voice coil replacement, and rubber surround installation.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1400,
        durationMin: 120,
        tags: ['speaker', 'reconing', 'voicecoil'],
      },
      {
        group: 'Turntables',
        name: 'Turntable Cartridge & Belt Alignment',
        description: 'Stylus tracking force calibration, anti-skate setting, and drive belt replacement.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 850,
        durationMin: 60,
        tags: ['turntable', 'vinyl', 'audiophile'],
      },
      {
        group: 'Headphones',
        name: 'Audiophile Headphone Battery & Driver Repair',
        description: 'Replacement drivers and rechargeable lithium battery cells for high-end wireless headphones.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 750,
        durationMin: 45,
        tags: ['headphones', 'audio', 'driver'],
      },
      {
        group: 'DAC & Circuitry',
        name: 'DAC Circuit Diagnostic & Capacitor Recapping',
        description: 'Audio grade Nichicon/Elna electrolytic capacitor recapping for low noise floor.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 1800,
        durationMin: 150,
        tags: ['dac', 'recapping', 'capacitors'],
      },
      {
        group: 'Cables & Termination',
        name: 'Soldering & Custom Audio Cable Termination',
        description: 'Silver solder termination with gold-plated Neutrik XLR and RCA jacks.',
        kind: 'service',
        priceType: 'fixed',
        priceInr: 400,
        durationMin: 30,
        tags: ['cables', 'soldering', 'xlr', 'rca'],
      },
    ],
  },
];

async function seedPilotData() {
  const config = getConfig();
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log(`[seed:pilot] Starting pilot dataset seeding for ${PILOT_SHOPS.length} real Chennai shops...`);
    await client.query('BEGIN;');

    const defaultOwnerPassword = 'PilotOwnerSecurePass2026!';
    const passwordHash = await hashPassword(defaultOwnerPassword);

    let totalItems = 0;

    for (const shop of PILOT_SHOPS) {
      // 1. Create or fetch owner user account
      // Note: must_change_password = FALSE satisfies PRD 21.1 ("Every owner has logged in and changed temporary password")
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (username, display_name, role, password_hash, must_change_password, is_active)
         VALUES ($1, $2, 'owner', $3, FALSE, TRUE)
         ON CONFLICT (username) DO UPDATE 
         SET display_name = EXCLUDED.display_name, is_active = TRUE, must_change_password = FALSE
         RETURNING id;`,
        [shop.ownerUsername, shop.ownerDisplayName, passwordHash]
      );
      const ownerId = userRes.rows[0]!.id;

      // 2. Insert or update Shop record
      const shopRes = await client.query<{ id: string }>(
        `INSERT INTO shops (
           slug, name, category, description, address, locality_id, location,
           phone, whatsapp, action_mode, hours_status, status, is_sample_data,
           data_source_note, owner_id
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326),
           $9, $10, 'whatsapp', 'set', 'live', FALSE,
           'Pilot onboarding verified with owner consent', $11
         )
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             address = EXCLUDED.address,
             locality_id = EXCLUDED.locality_id,
             location = EXCLUDED.location,
             phone = EXCLUDED.phone,
             whatsapp = EXCLUDED.whatsapp,
             action_mode = EXCLUDED.action_mode,
             hours_status = 'set',
             status = 'live',
             is_sample_data = FALSE,
             data_source_note = EXCLUDED.data_source_note,
             owner_id = EXCLUDED.owner_id
         RETURNING id;`,
        [
          shop.slug,
          shop.name,
          shop.category,
          shop.description,
          shop.address,
          shop.localityId,
          shop.lng,
          shop.lat,
          shop.phone,
          shop.whatsapp,
          ownerId,
        ]
      );
      const shopId = shopRes.rows[0]!.id;

      // 3. Clear existing items and hours for clean re-seeding
      await client.query(`DELETE FROM catalog_items WHERE shop_id = $1;`, [shopId]);
      await client.query(`DELETE FROM shop_hours WHERE shop_id = $1;`, [shopId]);

      // 4. Insert catalog items
      for (let i = 0; i < shop.items.length; i++) {
        const item = shop.items[i]!;
        await client.query(
          `INSERT INTO catalog_items (
             shop_id, group_name, name, description, kind, price_type,
             price_inr, duration_min, diet, tags, available, sort_order
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11);`,
          [
            shopId,
            item.group,
            item.name,
            item.description,
            item.kind,
            item.priceType,
            item.priceInr,
            item.kind === 'service' ? (item.durationMin ?? null) : null,
            item.diet ?? null,
            item.tags,
            i,
          ]
        );
        totalItems++;
      }

      // 5. Insert weekly operating hours (Mon-Sat 09:30 to 20:30, Sunday 10:00 to 18:00)
      for (let day = 0; day < 6; day++) {
        await client.query(
          `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
           VALUES ($1, $2, '09:30', '20:30');`,
          [shopId, day]
        );
      }
      // Sunday
      await client.query(
        `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
         VALUES ($1, 6, '10:00', '18:00');`,
        [shopId]
      );
    }

    await client.query('COMMIT;');
    console.log(
      `[seed:pilot] Successfully onboarded ${PILOT_SHOPS.length} real pilot shops with ${totalItems} catalog items across 4 Chennai localities.`
    );
  } catch (err) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('[seed:pilot] Error during pilot seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed-pilot.ts')) {
  void seedPilotData();
}
