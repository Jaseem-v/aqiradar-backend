/**
 * Seeds the Care Products catalog: categories (with per-category facet config),
 * brands, facet dimensions, rich products, and curated comparisons.
 *
 * Idempotent — upserts by slug, so it is safe to re-run and it refreshes config.
 *   npm run care:seed
 */
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Category } from "./models/Category.js";
import { Brand } from "./models/Brand.js";
import { Facet } from "./models/Facet.js";
import { Product } from "./models/Product.js";
import { Comparison } from "./models/Comparison.js";

// ---------- categories ----------
const CATEGORIES = [
  {
    name: "Air Purifiers", slug: "air-purifiers", icon: "🌀", kind: "product", order: 1,
    description: "HEPA and carbon purifiers ranked by real CADR, coverage and running cost.",
    metricPrimaryLabel: "CADR", metricPrimaryUnit: "m³/h",
    metricSecondaryLabel: "Coverage", metricSecondaryUnit: "sq ft",
    facets: ["budget", "rooms", "health", "cities"],
  },
  {
    name: "AQI Monitors", slug: "aqi-monitors", icon: "📟", kind: "product", order: 2,
    description: "Real-time PM2.5, CO₂ and AQI monitors, bench-tested against a reference sensor.",
    metricPrimaryLabel: "Sensors", metricPrimaryUnit: "",
    metricSecondaryLabel: "Display", metricSecondaryUnit: "",
    facets: ["budget", "rooms", "cities", "use-case"],
  },
  {
    name: "Masks", slug: "masks", icon: "😷", kind: "product", order: 3,
    description: "Genuine N95 and N99 respirators tested for real seal and filtration.",
    metricPrimaryLabel: "Filtration", metricPrimaryUnit: "%",
    metricSecondaryLabel: "Reusable", metricSecondaryUnit: "",
    facets: ["budget", "health", "cities", "use-case"],
  },
  {
    name: "HEPA Filters", slug: "hepa-filters", icon: "🧩", kind: "filter", order: 4,
    description: "Genuine replacement filters, organised by the device they fit.",
    metricPrimaryLabel: "Grade", metricPrimaryUnit: "",
    metricSecondaryLabel: "Fits", metricSecondaryUnit: "",
    facets: ["brands", "models"],
  },
];

// ---------- brands ----------
const B = (name: string, extra: Record<string, unknown> = {}) => ({ name, ...extra });
const BRANDS = [
  B("Levoit", {
    order: 1, excerpt: "Value-first HEPA purifiers and the ubiquitous Core series.",
    pros: ["Best entry-level price in India", "Cheap, stocked replacement filters", "Quiet sleep modes"],
    cons: ["Lower-end models lack a display", "Limited large-room options"],
  }),
  B("Philips", {
    order: 2, excerpt: "Dutch electronics giant; the default mid-market pick in Indian homes.",
    pros: ["Widest offline service network", "Reliable auto mode + PM2.5 sensors", "Filters stocked everywhere"],
    cons: ["Pricier than Xiaomi at similar CADR", "Proprietary filters cost more", "Basic companion app"],
  }),
  B("Coway", {
    order: 3, excerpt: "Korean air-care specialist known for strong carbon filtration.",
    pros: ["Excellent carbon/odour removal", "Premium build quality", "Long filter life"],
    cons: ["Higher upfront price", "Fewer retail touchpoints"],
  }),
  B("Xiaomi", {
    order: 4, excerpt: "CADR-per-rupee leader with a strong smart-home app.",
    pros: ["Highest CADR for the price", "Great Mi Home app", "Fast-clearing large rooms"],
    cons: ["Filters need frequent swaps", "Build feels utilitarian"],
  }),
  B("Dyson", { order: 5, excerpt: "Premium purifier-fans with whole-room coverage." }),
  B("3M", { order: 6, excerpt: "The reference in respirator filtration; genuine NIOSH N95s." }),
  B("Cambridge", { order: 7, excerpt: "Affordable reusable Indian-made N95 masks." }),
  B("Vogmask", { order: 8, excerpt: "Fashion-forward reusable N99 masks with a great seal." }),
  B("Dettol", { order: 9, excerpt: "Widely available disposable N95 protection." }),
  B("Honeywell", { order: 10, excerpt: "Valved pollution masks for active commutes." }),
  B("Kaiterra", { order: 11, excerpt: "Laser Egg monitors — the consumer PM2.5 reference." }),
  B("Atmos", { order: 12, excerpt: "Affordable plug-in AQI displays for the home." }),
  B("Airveda", { order: 13, excerpt: "Indian-made multi-sensor monitors with lab-grade accuracy." }),
  B("Prana Air", { order: 14, excerpt: "Compact battery monitors for room-to-room checks." }),
  B("Huma-i", { order: 15, excerpt: "Pocket portable air-quality monitors." }),
  B("Generic", { order: 99, excerpt: "Universal third-party consumables." }),
];

// ---------- facets ----------
type F = { kind: string; category: string; name: string; slug?: string; intro: string; criteria?: Record<string, unknown>; order?: number };
const FACETS: F[] = [
  // air purifiers — budget
  { kind: "budget", category: "air-purifiers", name: "Under ₹5,000", slug: "under-5000", criteria: { maxPrice: 5000 }, order: 1, intro: "The absolute entry tier — one genuinely good small-room purifier lives here." },
  { kind: "budget", category: "air-purifiers", name: "Under ₹10,000", slug: "under-10000", criteria: { maxPrice: 10000 }, order: 2, intro: "The value tier. A short, honest list — no padding it with weak units." },
  { kind: "budget", category: "air-purifiers", name: "Under ₹15,000", slug: "under-15000", criteria: { maxPrice: 15000 }, order: 3, intro: "Mid-range purifiers that cover a full living room without overspending." },
  { kind: "budget", category: "air-purifiers", name: "Under ₹20,000", slug: "under-20000", criteria: { maxPrice: 20000 }, order: 4, intro: "Premium-feature purifiers with auto modes and real coverage." },
  // air purifiers — rooms
  { kind: "rooms", category: "air-purifiers", name: "Bedroom", slug: "bedroom", order: 1, intro: "Bedrooms are 120–200 sq ft and you sleep beside the unit — noise beats raw CADR." },
  { kind: "rooms", category: "air-purifiers", name: "Living room", slug: "living-room", order: 2, intro: "Living rooms need 300–500 sq ft of coverage and higher CADR to keep up." },
  { kind: "rooms", category: "air-purifiers", name: "Office", slug: "office", order: 3, intro: "Desk and cabin purifiers sized for a focused workspace." },
  { kind: "rooms", category: "air-purifiers", name: "Large room", slug: "large-room", order: 4, intro: "Open-plan and 500+ sq ft spaces that need whole-room airflow." },
  // air purifiers — health
  { kind: "health", category: "air-purifiers", name: "Asthma", slug: "asthma", order: 1, intro: "For asthma the filter grade matters more than price — sealed H13 HEPA, no ozone." },
  { kind: "health", category: "air-purifiers", name: "Allergies", slug: "allergies", order: 2, intro: "Pollen, dust and pet dander — units that capture allergens down to 0.3µm." },
  { kind: "health", category: "air-purifiers", name: "Babies", slug: "babies", order: 3, intro: "Quiet, safe, ozone-free purifiers for a nursery." },
  { kind: "health", category: "air-purifiers", name: "COPD", slug: "copd", order: 4, intro: "Maximum filtration for the most sensitive respiratory needs." },
  // aqi monitors — budget
  { kind: "budget", category: "aqi-monitors", name: "Under ₹8,000", slug: "under-8000", criteria: { maxPrice: 8000 }, order: 1, intro: "Accurate PM2.5 sensing without the lab-grade price." },
  { kind: "budget", category: "aqi-monitors", name: "Under ₹12,000", slug: "under-12000", criteria: { maxPrice: 12000 }, order: 2, intro: "Multi-sensor monitors that add CO₂ and VOC to the mix." },
  { kind: "budget", category: "aqi-monitors", name: "Premium", slug: "premium", criteria: { minPrice: 12000 }, order: 3, intro: "Reference-grade monitors with the widest sensor suites." },
  // aqi monitors — rooms
  { kind: "rooms", category: "aqi-monitors", name: "Bedroom", slug: "bedroom", order: 1, intro: "A dimmable display and quiet operation — no fan whine at night." },
  { kind: "rooms", category: "aqi-monitors", name: "Office", slug: "office", order: 2, intro: "Desk-sized monitors that track CO₂ build-up through the workday." },
  { kind: "rooms", category: "aqi-monitors", name: "Nursery", slug: "nursery", order: 3, intro: "Monitors with alerts so you know the moment air quality slips." },
  // aqi monitors — use-case
  { kind: "use-case", category: "aqi-monitors", name: "Portable", slug: "portable", order: 1, intro: "Battery-powered, pocketable monitors for checking air on the move." },
  { kind: "use-case", category: "aqi-monitors", name: "Fixed", slug: "fixed", order: 2, intro: "Plug-in home monitors that log continuously in one spot." },
  // masks — budget
  { kind: "budget", category: "masks", name: "Under ₹200", slug: "under-200", criteria: { maxPrice: 200 }, order: 1, intro: "Disposable N95 done right — protection shouldn't need a big budget." },
  { kind: "budget", category: "masks", name: "Under ₹500", slug: "under-500", criteria: { maxPrice: 500 }, order: 2, intro: "Reusable and valved options that pay back within a month." },
  { kind: "budget", category: "masks", name: "Under ₹1,000", slug: "under-1000", criteria: { maxPrice: 1000 }, order: 3, intro: "Premium reusable respirators built to last a full pollution season." },
  // masks — health
  { kind: "health", category: "masks", name: "Asthma", slug: "asthma", order: 1, intro: "For asthma, seal is everything — go N99 with a snug fit and low resistance." },
  { kind: "health", category: "masks", name: "Allergies", slug: "allergies", order: 2, intro: "Block pollen and dust on high-count days with a well-sealed respirator." },
  { kind: "health", category: "masks", name: "Kids", slug: "kids", order: 3, intro: "Smaller respirators that actually seal on a child's face." },
  // masks — use-case
  { kind: "use-case", category: "masks", name: "Cycling", slug: "cycling", order: 1, intro: "Low breathing resistance and an exhale valve so your glasses don't fog." },
  { kind: "use-case", category: "masks", name: "Commute", slug: "commute", order: 2, intro: "Compact, cheap masks to keep one in every bag for the daily commute." },
  { kind: "use-case", category: "masks", name: "Construction", slug: "construction", order: 3, intro: "N99 dust protection for renovation and construction dust." },
  // hepa filters — models
  { kind: "models", category: "hepa-filters", name: "Levoit Core Mini", slug: "core-mini", criteria: { fits: "core-mini" }, order: 1, intro: "The exact 3-stage cartridge your Core Mini takes — plus how often to swap it." },
  { kind: "models", category: "hepa-filters", name: "Philips AC1715", slug: "ac1715", criteria: { fits: "ac1715" }, order: 2, intro: "Genuine NanoProtect replacement for the AC1715 and AC2887." },
  { kind: "models", category: "hepa-filters", name: "Coway Airmega 150", slug: "airmega-150", criteria: { fits: "airmega-150" }, order: 3, intro: "The Green True HEPA + carbon set for the Airmega 150." },
  { kind: "models", category: "hepa-filters", name: "Xiaomi Smart 4", slug: "smart-4", criteria: { fits: "smart-4" }, order: 4, intro: "The H13 cartridge for the Smart 4 and Smart 4 Lite." },
];

// ---------- products ----------
type P = Record<string, unknown> & { name: string; slug: string; category: string };
const PRODUCTS: P[] = [
  // ===== air purifiers =====
  {
    name: "Levoit Core Mini", slug: "levoit-core-mini", category: "air-purifiers", brand: "levoit",
    price: 4999, rating: 4.2, featured: true, metricPrimary: "130", metricSecondary: "178",
    cadr: 130, coverage: 178, electricityCost: 520, filterCost: 1400,
    excerpt: "The cheapest true-HEPA purifier for a desk or bedside.",
    description: "<p>The Core Mini is the cheapest way to put real HEPA-grade filtration on a desk or beside a bed. At ₹4,999 it undercuts almost everything, and its 130 m³/h CADR is enough for a 150–180 sq ft room on high.</p><p>What you give up is coverage and a display. For a bedroom it's the value pick; for a living room, size up to the Xiaomi 4 or Coway 150.</p>",
    pros: ["Cheapest true-H13 HEPA in India", "Near-silent 24 dB sleep mode", "Cheap, stocked replacement filters"],
    cons: ["No PM2.5 display or auto mode", "Undersized for rooms > 200 sq ft", "No carbon layer for smoke/odour"],
    specs: [{ label: "Filter grade", value: "H13 True HEPA" }, { label: "CADR", value: "130 m³/h" }, { label: "Coverage", value: "178 sq ft" }, { label: "Noise", value: "24–46 dB" }, { label: "Power", value: "18 W max" }],
    faq: [{ q: "Is it enough for a bedroom?", a: "Yes — up to ~180 sq ft it clears PM2.5 in about 30 minutes on high." }, { q: "How often do I replace the filter?", a: "Roughly once a year in Delhi-grade air, about ₹1,400 per filter." }, { q: "Does it remove smoke and odour?", a: "Partly — it has no dedicated carbon layer, so the Coway 150 does better." }],
    rooms: ["bedroom", "office"], health: ["asthma", "allergies", "babies"], cities: ["delhi", "mumbai", "bangalore", "kolkata"],
  },
  {
    name: "Philips AC1715", slug: "philips-ac1715", category: "air-purifiers", brand: "philips",
    price: 18995, rating: 4.3, metricPrimary: "250", metricSecondary: "320", cadr: 250, coverage: 320, electricityCost: 900, filterCost: 2600,
    excerpt: "Mid-range living-room purifier with auto mode and a live PM2.5 readout.",
    description: "<p>A dependable living-room purifier: 250 m³/h CADR, a real PM2.5 sensor and an auto mode that just works. The pick if you want set-and-forget for a room up to 320 sq ft.</p>",
    pros: ["Auto mode + live PM2.5 display", "Covers up to 320 sq ft", "Great service network"],
    cons: ["Pricey filters", "No carbon-heavy odour layer"],
    specs: [{ label: "Filter grade", value: "NanoProtect HEPA" }, { label: "CADR", value: "250 m³/h" }, { label: "Coverage", value: "320 sq ft" }, { label: "Noise", value: "33–51 dB" }],
    rooms: ["living-room", "office"], health: ["asthma", "allergies"], cities: ["delhi", "mumbai", "kolkata"],
  },
  {
    name: "Coway Airmega 150", slug: "coway-airmega-150", category: "air-purifiers", brand: "coway",
    price: 18900, rating: 4.6, featured: true, metricPrimary: "216", metricSecondary: "355", cadr: 216, coverage: 355, electricityCost: 850, filterCost: 2200,
    excerpt: "The best carbon filtration in its class — great for smoke and odour.",
    description: "<p>Coway's Airmega 150 pairs a Green True HEPA filter with a serious activated-carbon layer, making it the best pick for cooking smoke and odour at this price. Coverage stretches to 355 sq ft.</p>",
    pros: ["Excellent carbon/odour removal", "Covers 355 sq ft", "Premium build, long filter life"],
    cons: ["No fancy app", "Heavier than rivals"],
    specs: [{ label: "Filter grade", value: "Green True HEPA + Carbon" }, { label: "CADR", value: "216 m³/h" }, { label: "Coverage", value: "355 sq ft" }],
    rooms: ["living-room", "bedroom"], health: ["asthma", "allergies", "copd"], cities: ["delhi", "mumbai", "kolkata"],
  },
  {
    name: "Xiaomi Smart 4", slug: "xiaomi-smart-4", category: "air-purifiers", brand: "xiaomi",
    price: 12999, rating: 4.1, metricPrimary: "400", metricSecondary: "516", cadr: 400, coverage: 516, electricityCost: 1100, filterCost: 1600,
    excerpt: "The CADR-per-rupee king — clears big rooms fast.",
    description: "<p>The Smart 4 delivers a 400 m³/h CADR for well under ₹13,000, making it the value champion for large rooms. The Mi Home app is excellent; filters just need swapping a bit more often.</p>",
    pros: ["Highest CADR for the price", "Covers 516 sq ft", "Great Mi Home app"],
    cons: ["More frequent filter swaps", "Utilitarian build"],
    specs: [{ label: "Filter grade", value: "H13 HEPA" }, { label: "CADR", value: "400 m³/h" }, { label: "Coverage", value: "516 sq ft" }],
    rooms: ["living-room", "large-room"], health: ["allergies", "copd"], cities: ["delhi", "mumbai", "kolkata"],
  },
  {
    name: "Dyson Big+Quiet", slug: "dyson-big-quiet", category: "air-purifiers", brand: "dyson",
    price: 59900, rating: 4.2, metricPrimary: "520", metricSecondary: "1000", cadr: 520, coverage: 1000, electricityCost: 1500, filterCost: 5500,
    excerpt: "Premium whole-room purifier-fan for open-plan spaces.",
    description: "<p>The Big+Quiet projects clean air across open-plan spaces up to 1,000 sq ft with a combined HEPA + carbon filter. It's expensive, but nothing else covers this much area this quietly.</p>",
    pros: ["Whole-room 1,000 sq ft coverage", "HEPA + carbon combined", "Genuinely quiet at range"],
    cons: ["Very expensive", "Costly replacement filters"],
    specs: [{ label: "Filter grade", value: "HEPA H13 + Carbon" }, { label: "CADR", value: "520 m³/h" }, { label: "Coverage", value: "1000 sq ft" }],
    rooms: ["large-room", "living-room"], health: ["copd", "asthma"], cities: ["delhi"],
  },

  // ===== aqi monitors =====
  {
    name: "Kaiterra Laser Egg 2", slug: "kaiterra-laser-egg-2", category: "aqi-monitors", brand: "kaiterra",
    price: 8999, rating: 4.6, featured: true, metricPrimary: "PM + CO₂", metricSecondary: "Yes",
    excerpt: "The consumer PM2.5 reference — laser sensor, CO₂ and a clean display.",
    description: "<p>The Laser Egg 2 made real-time PM2.5 a consumer thing. A laser-scattering sensor, CO₂, and a display you can read across the room, plus a solid app with history. For most homes it's the reference pick.</p>",
    pros: ["Accurate laser PM2.5 sensor", "CO₂ + PM in one unit", "Clean, glanceable display"],
    cons: ["No PM10 breakout", "Needs Wi-Fi for the app"],
    specs: [{ label: "Sensor", value: "Laser scattering" }, { label: "Measures", value: "PM2.5, CO₂" }, { label: "Display", value: "LED ring + digits" }, { label: "Power", value: "Plug-in (USB-C)" }],
    faq: [{ q: "Is it accurate?", a: "Within ~10% of a reference PM2.5 sensor in our bench test." }, { q: "Does it need Wi-Fi?", a: "Only for the app and history — the display works offline." }, { q: "Does it measure PM10?", a: "No — for PM10 breakout use the Airveda AV-8." }],
    rooms: ["bedroom", "office"], useCases: ["fixed"], cities: ["delhi", "mumbai"],
  },
  {
    name: "Atmos AQI Monitor", slug: "atmos-monitor", category: "aqi-monitors", brand: "atmos",
    price: 6999, rating: 4.2, metricPrimary: "PM2.5/10", metricSecondary: "Yes",
    excerpt: "Affordable plug-in PM2.5 + PM10 display for the home.",
    pros: ["Reads PM2.5 and PM10", "Cheapest accurate display", "Simple setup"],
    cons: ["No CO₂ sensor", "Plug-in only"],
    specs: [{ label: "Measures", value: "PM2.5, PM10" }, { label: "Display", value: "LCD" }, { label: "Power", value: "Plug-in" }],
    rooms: ["bedroom", "office"], useCases: ["fixed"], cities: ["delhi", "mumbai"],
  },
  {
    name: "Airveda AV-8", slug: "airveda-av8", category: "aqi-monitors", brand: "airveda",
    price: 12500, rating: 4.6, metricPrimary: "5-in-1", metricSecondary: "Yes",
    excerpt: "Indian-made multi-sensor monitor with lab-grade accuracy.",
    pros: ["PM2.5/10, CO₂, temp, humidity", "Calibrated, accurate", "Battery option"],
    cons: ["Pricier", "Busy display"],
    specs: [{ label: "Measures", value: "PM2.5, PM10, CO₂, T, RH" }, { label: "Display", value: "Colour LCD" }, { label: "Power", value: "Battery / USB" }],
    rooms: ["office", "nursery"], useCases: ["portable"], cities: ["delhi", "mumbai"],
  },
  {
    name: "Prana Air Squair", slug: "prana-squair", category: "aqi-monitors", brand: "prana-air",
    price: 9900, rating: 4.2, metricPrimary: "PM + VOC", metricSecondary: "Yes",
    excerpt: "Compact battery monitor for room-to-room checks.",
    pros: ["Compact and portable", "Measures VOC + PM", "Good battery life"],
    cons: ["No CO₂", "Small display"],
    specs: [{ label: "Measures", value: "PM2.5, VOC" }, { label: "Power", value: "Battery" }],
    rooms: ["bedroom"], useCases: ["portable"], cities: ["delhi"],
  },
  {
    name: "Huma-i HI-150", slug: "huma-i-hi150", category: "aqi-monitors", brand: "huma-i",
    price: 7500, rating: 4.2, metricPrimary: "PM+VOC+CO₂", metricSecondary: "Yes",
    excerpt: "Pocket portable air-quality monitor for travel.",
    pros: ["Truly pocketable", "PM + VOC + CO₂", "Quick to read"],
    cons: ["Short battery", "No logging app"],
    specs: [{ label: "Measures", value: "PM2.5, VOC, CO₂" }, { label: "Power", value: "Rechargeable" }],
    rooms: ["office"], useCases: ["portable"], cities: ["delhi", "mumbai"],
  },

  // ===== masks =====
  {
    name: "3M Aura 9205+ N95", slug: "3m-aura-9205", category: "masks", brand: "3m",
    price: 120, rating: 4.7, featured: true, metricPrimary: "95", metricSecondary: "No",
    excerpt: "The genuine NIOSH N95 public-health folks actually wear.",
    description: "<p>The Aura 9205+ is a genuine NIOSH N95 with a 3-panel flat-fold that seals on most face shapes. At ~₹120 it's disposable, but one lasts a week of commuting. No exhale valve keeps it flight-legal but warm in summer.</p>",
    pros: ["True NIOSH N95 (95% @ 0.3µm)", "3-panel seal fits most faces", "Cheap enough to replace weekly"],
    cons: ["Single-use — not reusable", "No exhale valve (hot in summer)", "Sizing runs small"],
    specs: [{ label: "Rating", value: "NIOSH N95" }, { label: "Filtration", value: "95% @ 0.3µm" }, { label: "Style", value: "3-panel flat-fold" }, { label: "Valve", value: "No" }],
    faq: [{ q: "How long does one last?", a: "About a week of daily commuting before the seal degrades." }, { q: "Are there kids sizes?", a: "No — for children use a Vogmask S or a kids-specific N95." }, { q: "Is it flight legal?", a: "Yes — no exhale valve, so it's allowed on flights." }],
    health: ["asthma"], useCases: ["commute"], cities: ["delhi", "mumbai", "kolkata"],
  },
  {
    name: "Cambridge N95", slug: "cambridge-n95", category: "masks", brand: "cambridge",
    price: 299, rating: 4.2, metricPrimary: "95", metricSecondary: "Yes",
    excerpt: "Affordable Indian-made reusable N95.",
    pros: ["Reusable, washable outer", "Good value", "Comfortable straps"],
    cons: ["Fit varies by face", "No valve"],
    specs: [{ label: "Rating", value: "N95" }, { label: "Reusable", value: "Yes" }],
    useCases: ["commute", "cycling"], cities: ["delhi", "mumbai"],
  },
  {
    name: "Vogmask N99", slug: "vogmask-n99", category: "masks", brand: "vogmask",
    price: 1499, rating: 4.6, featured: true, metricPrimary: "99", metricSecondary: "Yes",
    excerpt: "Reusable N99 with the best seal and comfort — plus kids sizes.",
    description: "<p>Vogmask's N99 is the reusable pick when comfort and seal matter most. Multiple sizes (including kids), a soft microfibre body and an optional valve make it the all-day choice for sensitive users.</p>",
    pros: ["N99 filtration (99% @ 0.3µm)", "Excellent seal + comfort", "Sizes incl. kids"],
    cons: ["Expensive", "Valve models not flight-legal"],
    specs: [{ label: "Rating", value: "N99" }, { label: "Reusable", value: "Yes" }, { label: "Sizes", value: "S–L + kids" }],
    health: ["asthma", "allergies", "kids"], useCases: ["cycling"], cities: ["delhi", "mumbai", "kolkata"],
  },
  {
    name: "Dettol SiTi Shield", slug: "dettol-siti-shield", category: "masks", brand: "dettol",
    price: 199, rating: 4.1, metricPrimary: "95", metricSecondary: "No",
    excerpt: "Widely available disposable N95.",
    pros: ["Everywhere in India", "Trusted brand", "Cheap"],
    cons: ["Disposable", "Basic fit"],
    specs: [{ label: "Rating", value: "N95" }, { label: "Reusable", value: "No" }],
    useCases: ["commute"], cities: ["delhi", "mumbai"],
  },
  {
    name: "Honeywell PM2.5 D5", slug: "honeywell-d5", category: "masks", brand: "honeywell",
    price: 499, rating: 4.2, metricPrimary: "95", metricSecondary: "Yes",
    excerpt: "Valved reusable mask for active commutes.",
    pros: ["Exhale valve (less fog)", "Reusable", "Good for exertion"],
    cons: ["Valve not flight-legal", "Bulkier"],
    specs: [{ label: "Rating", value: "N95" }, { label: "Valve", value: "Yes" }],
    useCases: ["cycling", "construction"], cities: ["delhi"],
  },

  // ===== hepa filters =====
  {
    name: "Core Mini Replacement Filter", slug: "levoit-core-mini-filter", category: "hepa-filters", brand: "levoit",
    price: 1399, rating: 4.7, featured: true, metricPrimary: "H13", metricSecondary: "Core Mini",
    excerpt: "Genuine 3-stage H13 + carbon cartridge for the Core Mini.",
    description: "<p>The 3-stage replacement for the Core Mini — pre-filter, H13 True HEPA and activated carbon in one cartridge. Genuine Levoit stock lasts ~6–8 months in Delhi air.</p>",
    pros: ["Genuine H13 — not 'HEPA-type'", "3 stages incl. carbon in one cartridge", "Cheap and widely stocked"],
    cons: ["Only fits Core Mini / Core Mini-P", "Shorter life in severe pollution", "Third-party copies vary"],
    specs: [{ label: "Grade", value: "H13 True HEPA" }, { label: "Stages", value: "Pre + HEPA + carbon" }, { label: "Fits", value: "Core Mini, Core Mini-P" }, { label: "Life", value: "6–8 months" }],
    faq: [{ q: "Will it fit my Core 300?", a: "No — the Core 300 uses a different, larger cartridge." }, { q: "Genuine vs third-party?", a: "Third-party costs less but the H13 rating isn't guaranteed." }],
    fits: ["levoit", "core-mini"],
  },
  {
    name: "Philips FY2422 Filter", slug: "philips-fy2422", category: "hepa-filters", brand: "philips",
    price: 2299, rating: 4.3, metricPrimary: "NanoProtect", metricSecondary: "AC1715 / 2887",
    excerpt: "Genuine NanoProtect HEPA for the AC1715 and AC2887.",
    pros: ["Genuine NanoProtect HEPA", "12-month life", "Fits two popular models"],
    cons: ["Pricier than rivals"],
    specs: [{ label: "Grade", value: "NanoProtect HEPA" }, { label: "Fits", value: "AC1715, AC2887" }, { label: "Life", value: "12 months" }],
    fits: ["philips", "ac1715"],
  },
  {
    name: "Airmega 150 Filter Set", slug: "coway-150-filter", category: "hepa-filters", brand: "coway",
    price: 1899, rating: 4.6, metricPrimary: "Green HEPA", metricSecondary: "Airmega 150",
    excerpt: "Green True HEPA + carbon set for the Airmega 150.",
    pros: ["HEPA + carbon set", "12-month life", "Genuine Coway"],
    cons: ["Only the 150"],
    specs: [{ label: "Grade", value: "Green True HEPA + Carbon" }, { label: "Fits", value: "Airmega 150" }, { label: "Life", value: "12 months" }],
    fits: ["coway", "airmega-150"],
  },
  {
    name: "Smart 4 Filter", slug: "xiaomi-smart-4-filter", category: "hepa-filters", brand: "xiaomi",
    price: 999, rating: 4.1, metricPrimary: "H13", metricSecondary: "Smart 4 / Lite",
    excerpt: "H13 cartridge for the Smart 4 and Smart 4 Lite.",
    pros: ["Cheapest genuine H13", "Fits Smart 4 & Lite", "Easy swap"],
    cons: ["6-month life in Delhi"],
    specs: [{ label: "Grade", value: "H13 HEPA" }, { label: "Fits", value: "Smart 4, Smart 4 Lite" }, { label: "Life", value: "6 months" }],
    fits: ["xiaomi", "smart-4"],
  },
  {
    name: "Universal H13 Filter Roll", slug: "universal-h13", category: "hepa-filters", brand: "generic",
    price: 799, rating: 3.5, metricPrimary: "H13", metricSecondary: "Universal",
    excerpt: "Cut-to-fit third-party H13 media for most purifiers.",
    pros: ["Cheapest option", "Fits many models", "Cut to size"],
    cons: ["H13 rating not guaranteed", "Shorter life", "No carbon"],
    specs: [{ label: "Grade", value: "H13 (unverified)" }, { label: "Fits", value: "Universal cut" }, { label: "Life", value: "3–4 months" }],
    fits: ["universal"],
  },
];

// ---------- comparisons ----------
const COMPARISONS = [
  { category: "air-purifiers", a: "levoit-core-mini", b: "philips-ac1715", featured: true },
  { category: "air-purifiers", a: "coway-airmega-150", b: "philips-ac1715", featured: true },
  { category: "air-purifiers", a: "dyson-big-quiet", b: "coway-airmega-150" },
  { category: "air-purifiers", a: "xiaomi-smart-4", b: "coway-airmega-150" },
  { category: "aqi-monitors", a: "kaiterra-laser-egg-2", b: "airveda-av8", featured: true },
  { category: "masks", a: "3m-aura-9205", b: "vogmask-n99", featured: true },
];

async function upsert<T extends { slug?: string }>(
  Model: import("mongoose").Model<any>,
  docs: T[],
  key: (d: T) => Record<string, unknown>,
) {
  let n = 0;
  for (const doc of docs) {
    // Build slug via the model's validation by creating a throwaway instance,
    // so upsert filters match the same slug the model would generate.
    const instance = new Model(doc);
    await instance.validate().catch(() => {});
    const filter = key({ ...doc, slug: instance.get("slug") } as T);
    await Model.findOneAndUpdate(filter, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    n++;
  }
  return n;
}

async function run() {
  await connectDB();

  const c = await upsert(Category, CATEGORIES as any, (d) => ({ slug: d.slug }));
  console.log(`✔ Upserted ${c} categories`);

  const b = await upsert(Brand, BRANDS as any, (d: any) => ({ slug: (d.slug ?? d.name?.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")) }));
  console.log(`✔ Upserted ${b} brands`);

  let f = 0;
  for (const facet of FACETS) {
    const instance = new Facet(facet);
    await instance.validate().catch(() => {});
    await Facet.findOneAndUpdate(
      { kind: facet.kind, category: facet.category, slug: instance.get("slug") },
      facet,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    f++;
  }
  console.log(`✔ Upserted ${f} facets`);

  const p = await upsert(Product, PRODUCTS as any, (d) => ({ slug: d.slug }));
  console.log(`✔ Upserted ${p} products`);

  let cm = 0;
  for (const cmp of COMPARISONS) {
    const slug = `${cmp.a}-vs-${cmp.b}`;
    await Comparison.findOneAndUpdate({ slug }, { ...cmp, slug }, { upsert: true, new: true, setDefaultsOnInsert: true });
    cm++;
  }
  console.log(`✔ Upserted ${cm} comparisons`);

  await mongoose.connection.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Care seed failed:", err);
  process.exit(1);
});
