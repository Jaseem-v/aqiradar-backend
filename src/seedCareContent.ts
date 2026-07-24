/**
 * Seeds rich landing-page content for the air-purifier facet + city pages, and
 * adds the missing "leaf" facets from the original site tree (premium budget,
 * small-room, elderly, pregnancy) plus the tags that make those pages populate.
 *
 * Idempotent — upserts by natural key. Run after care:seed.
 *   npm run care:content
 */
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Facet } from "./models/Facet.js";
import { City } from "./models/City.js";
import { Product } from "./models/Product.js";
import { Category } from "./models/Category.js";
import { Brand } from "./models/Brand.js";

const CAT = "air-purifiers";

// ---- facet content (kind, slug, [name+criteria if new], heading, intro, content) ----
type FacetSeed = {
  kind: string;
  slug: string;
  name?: string;
  criteria?: Record<string, unknown>;
  heading: string;
  intro: string;
  content: string;
  seoTitle?: string;
};
const FACETS: FacetSeed[] = [
  // budget
  {
    kind: "budget", slug: "under-5000",
    heading: "Best air purifiers under ₹5,000",
    intro: "The entry tier — one genuinely good small-room purifier lives here.",
    content:
      "<h2>What ₹5,000 gets you</h2><p>At this price you get true HEPA filtration for a single small room, but you give up smart features, displays and auto modes. The pick is a compact unit you run on high for a bedroom or desk.</p><h3>What to check</h3><ul><li>Insist on a genuine <strong>H13 True HEPA</strong> filter, not \"HEPA-type\".</li><li>Confirm replacement filters are cheap and in stock.</li><li>Match the room size — under 180 sq ft.</li></ul>",
  },
  {
    kind: "budget", slug: "under-10000",
    heading: "Best air purifiers under ₹10,000",
    intro: "The value tier — a short, honest list with no padding.",
    content:
      "<h2>The sweet spot for most bedrooms</h2><p>Under ₹10,000 you can cover a 150–250 sq ft room properly. Prioritise <strong>CADR per rupee</strong> and a quiet sleep mode over gimmicks. Skip anything without a real HEPA rating.</p>",
  },
  {
    kind: "budget", slug: "under-15000",
    heading: "Best air purifiers under ₹15,000",
    intro: "Mid-range purifiers that cover a full living room without overspending.",
    content:
      "<h2>Living-room coverage on a budget</h2><p>This band adds higher CADR, PM2.5 sensors and auto modes. Look for coverage of 300+ sq ft and an activated-carbon layer if you cook indoors or face traffic pollution.</p>",
  },
  {
    kind: "budget", slug: "under-20000",
    heading: "Best air purifiers under ₹20,000",
    intro: "Premium-feature purifiers with auto modes and real coverage.",
    content:
      "<h2>Near-premium, sensibly priced</h2><p>At this level you get strong carbon filtration, reliable auto modes and coverage that handles a large living room. This is where set-and-forget purification starts to feel effortless.</p>",
  },
  {
    kind: "budget", slug: "premium", name: "Premium (₹20,000+)", criteria: { minPrice: 20000 },
    heading: "Best premium air purifiers (₹20,000+)",
    intro: "Whole-room coverage, the quietest operation and the best filtration money buys.",
    content:
      "<h2>When to spend more</h2><p>Premium purifiers earn their price on <strong>large, open-plan spaces</strong> and for households with serious respiratory needs. You pay for whole-room airflow, combined HEPA + carbon filters and genuinely quiet operation at range.</p>",
  },
  // rooms
  {
    kind: "rooms", slug: "small-room", name: "Small room",
    heading: "Best air purifiers for a small room",
    intro: "Under 150 sq ft — a desk, a nursery corner or a compact bedroom.",
    content:
      "<h2>Small rooms, big wins</h2><p>Small spaces clear fastest, so even a low-CADR unit works well. Prioritise a small footprint, a quiet sleep mode and a low running cost. A compact H13 purifier is all you need.</p>",
  },
  {
    kind: "rooms", slug: "bedroom",
    heading: "Best air purifiers for the bedroom",
    intro: "Bedrooms are 120–200 sq ft and you sleep beside the unit — noise beats raw CADR.",
    content:
      "<h2>Quiet comes first</h2><p>You sleep next to a bedroom purifier for eight hours, so a sub-30 dB sleep mode and a display you can dim matter more than headline CADR. Size for the room and run it on low overnight.</p>",
  },
  {
    kind: "rooms", slug: "living-room",
    heading: "Best air purifiers for the living room",
    intro: "Living rooms need 300–500 sq ft of coverage and higher CADR to keep up.",
    content:
      "<h2>Coverage and carbon</h2><p>Living rooms are larger and see cooking smoke, open doors and foot traffic. Choose high CADR (200+ m³/h) and an activated-carbon layer to handle odour alongside particulates.</p>",
  },
  {
    kind: "rooms", slug: "office",
    heading: "Best air purifiers for an office or cabin",
    intro: "Desk and cabin purifiers sized for a focused workspace.",
    content:
      "<h2>Clean air where you work</h2><p>An office purifier should be quiet enough for calls and compact enough for a desk or corner. Mid-range CADR covers a cabin; a display helps you prove the air is actually improving.</p>",
  },
  {
    kind: "rooms", slug: "large-room",
    heading: "Best air purifiers for a large room",
    intro: "Open-plan and 500+ sq ft spaces that need whole-room airflow.",
    content:
      "<h2>Whole-room airflow</h2><p>Large and open-plan rooms need a purifier that can project clean air across distance, not just filter what's nearby. Look for 400+ m³/h CADR and coverage that comfortably exceeds your floor area.</p>",
  },
  // health
  {
    kind: "health", slug: "allergies",
    heading: "Best air purifiers for allergies",
    intro: "Pollen, dust and pet dander — units that capture allergens down to 0.3µm.",
    content:
      "<h2>Cutting the trigger load</h2><p>Allergy relief comes from consistently high air changes with a sealed HEPA filter. Run the purifier continuously during high-pollen months and place it where you spend the most time.</p>",
  },
  {
    kind: "health", slug: "babies",
    heading: "Best air purifiers for a baby's room",
    intro: "Quiet, safe, ozone-free purifiers for a nursery.",
    content:
      "<h2>Safe and silent</h2><p>For a nursery, avoid any ioniser or ozone feature and choose the quietest sleep mode you can find. A sealed H13 filter and a dimmable display let baby sleep while the air stays clean.</p>",
  },
  {
    kind: "health", slug: "copd",
    heading: "Best air purifiers for COPD",
    intro: "Maximum filtration for the most sensitive respiratory needs.",
    content:
      "<h2>Filtration without compromise</h2><p>For COPD, prioritise the highest sealed-HEPA performance and a carbon layer for irritant gases. Keep the unit running continuously and size up so it never has to work at its noisy maximum.</p>",
  },
  {
    kind: "health", slug: "elderly", name: "Elderly",
    heading: "Best air purifiers for the elderly",
    intro: "Simple controls, quiet operation and dependable filtration for older adults.",
    content:
      "<h2>Easy to live with</h2><p>Older adults are more sensitive to PM2.5 and benefit from continuous, fuss-free purification. Choose a unit with large, simple controls, a quiet sleep mode and an easy, clearly-labelled filter change.</p>",
  },
  {
    kind: "health", slug: "pregnancy", name: "Pregnancy",
    heading: "Best air purifiers for pregnancy",
    intro: "Lower your fine-particulate exposure during pregnancy with sealed HEPA filtration.",
    content:
      "<h2>Reducing exposure that matters</h2><p>Research links maternal PM2.5 exposure to poorer outcomes, so cleaner indoor air is a sensible precaution. Choose an ozone-free, sealed H13 purifier for the bedroom and run it overnight.</p>",
  },
];

// ---- city content (upsert by name; also ensures the city exists) ----
type CitySeed = {
  name: string; state: string; aqi: number; intro: string; content: string; seoTitle?: string;
  recommendedCadr: string; bestTimeToBuy: string; pollutants: string; healthImpact: string; whoAtRisk: string;
};
const CITIES: CitySeed[] = [
  {
    name: "Delhi", state: "Delhi", aqi: 312,
    intro: "Delhi has India's most severe winter air — you need high-CADR purifiers with a carbon stage.",
    content:
      "<h2>Delhi's air, month by month</h2><p>From October to February, stubble smoke and cold-weather inversion push Delhi into the <strong>severe</strong> band, often past AQI 400. Summer is better but dust keeps PM10 high.</p><h3>What to buy for Delhi</h3><ul><li>Minimum 200 m³/h CADR, ideally more for living rooms.</li><li>An activated-carbon stage for smoke and traffic gases.</li><li>Run it continuously through the winter peak.</li></ul>",
    recommendedCadr: "250–400 m³/h", bestTimeToBuy: "September – before the winter peak",
    pollutants: "PM2.5, stubble smoke, vehicle emissions, construction and road dust.",
    healthImpact: "Severe winter air triggers coughing, breathing difficulty and eye irritation for most people.",
    whoAtRisk: "Children, the elderly, pregnant women and anyone with asthma or heart conditions.",
  },
  {
    name: "Mumbai", state: "Maharashtra", aqi: 156,
    intro: "Mumbai's coastal air is milder than the north, but winter and construction dust still push PM2.5 up.",
    content:
      "<h2>Humidity, dust and traffic</h2><p>Sea breeze helps Mumbai avoid Delhi's extremes, but dense traffic and year-round construction keep PM2.5 in the <strong>moderate-to-poor</strong> range, worst in winter mornings.</p><p>A mid-range HEPA purifier for the bedroom handles most of it; add carbon if you're near a busy road.</p>",
    recommendedCadr: "180–300 m³/h", bestTimeToBuy: "October – December",
    pollutants: "PM2.5, construction dust, vehicle exhaust and coastal humidity-borne particles.",
    healthImpact: "Can aggravate allergies and asthma, especially on still winter mornings.",
    whoAtRisk: "People with asthma or allergies, young children and the elderly.",
  },
  {
    name: "Bangalore", state: "Karnataka", aqi: 92,
    intro: "Bangalore has some of the cleaner big-city air in India, but traffic corridors still spike.",
    content:
      "<h2>Cleaner, but not clean</h2><p>Bangalore usually sits in the <strong>satisfactory-to-moderate</strong> band thanks to its elevation and greenery. The exception is traffic-heavy corridors and dry-season dust.</p><p>A compact purifier is enough for most homes here — focus on the bedroom and any room facing a main road.</p>",
    recommendedCadr: "130–220 m³/h", bestTimeToBuy: "Any time — prices dip in mid-year sales",
    pollutants: "Vehicle exhaust along traffic corridors and seasonal road dust.",
    healthImpact: "Generally mild; sensitive people may notice irritation near busy roads.",
    whoAtRisk: "Allergy sufferers and those living on main traffic routes.",
  },
  {
    name: "Kolkata", state: "West Bengal", aqi: 188,
    intro: "Kolkata's winters bring poor air from vehicular and industrial sources plus regional smoke.",
    content:
      "<h2>A tough winter for the east</h2><p>Kolkata's PM2.5 climbs into the <strong>poor</strong> band each winter, driven by traffic, industry and regional crop-burning smoke drifting in. Humidity makes it feel worse.</p><p>Choose a purifier with solid CADR and a carbon layer, and keep bedrooms sealed and filtered overnight.</p>",
    recommendedCadr: "200–320 m³/h", bestTimeToBuy: "September – November",
    pollutants: "PM2.5, industrial emissions, vehicle exhaust and regional crop-burning smoke.",
    healthImpact: "Winter air worsens coughs, allergies and fatigue.",
    whoAtRisk: "Children, the elderly and people with respiratory conditions.",
  },
  {
    name: "Hyderabad", state: "Telangana", aqi: 118,
    intro: "Hyderabad's air is moderate for most of the year, worsening with winter dust and traffic.",
    content:
      "<h2>Moderate, with winter spikes</h2><p>Hyderabad generally sits in the <strong>moderate</strong> band, with construction and vehicular dust the main culprits. Winter mornings see the highest PM2.5.</p><p>A mid-range HEPA unit for the bedroom covers most households comfortably.</p>",
    recommendedCadr: "150–260 m³/h", bestTimeToBuy: "October – December",
    pollutants: "PM2.5, construction dust, vehicle emissions, pollen and smoke.",
    healthImpact: "May cause breathing issues, allergies, tiredness and irritation.",
    whoAtRisk: "Kids, the elderly, pregnant women and people with asthma.",
  },
];

// Products to tag so the new facet/city pages populate (by product slug).
const TAGS: { slug: string; rooms?: string[]; health?: string[]; cities?: string[] }[] = [
  { slug: "levoit-core-mini", rooms: ["small-room"], health: ["elderly", "pregnancy"], cities: ["hyderabad"] },
  { slug: "coway-airmega-150", health: ["elderly", "pregnancy"], cities: ["hyderabad"] },
  { slug: "philips-ac1715", health: ["elderly"], cities: ["hyderabad"] },
  { slug: "xiaomi-smart-4", cities: ["hyderabad"] },
];

// ---- category taglines ----
const TAGLINES: Record<string, string> = {
  "air-purifiers": "Best sellers",
  "aqi-monitors": "Track air quality",
  masks: "Stay protected",
  "hepa-filters": "Replacement",
  "purify-greens": "Natural care",
};

// ---- brand highlights ----
const HIGHLIGHTS: Record<string, { title: string; text: string }[]> = {
  xiaomi: [
    { title: "Innovation", text: "Smart Mi Home app and modern design" },
    { title: "Performance", text: "Class-leading CADR for the price" },
    { title: "Reliability", text: "Trusted by millions worldwide" },
    { title: "Value", text: "Premium features at fair prices" },
  ],
  philips: [
    { title: "Trusted", text: "Widest service network in India" },
    { title: "Smart sensing", text: "Reliable auto mode and PM2.5 display" },
    { title: "Filtration", text: "NanoProtect HEPA filtration" },
    { title: "Support", text: "Easy service and spare availability" },
  ],
  coway: [
    { title: "Carbon filtration", text: "Best-in-class odour and smoke removal" },
    { title: "Build quality", text: "Premium, durable construction" },
    { title: "Coverage", text: "Strong airflow for larger rooms" },
    { title: "Longevity", text: "Long filter life" },
  ],
  levoit: [
    { title: "Value", text: "Best entry-level price in India" },
    { title: "Quiet", text: "Near-silent sleep modes" },
    { title: "Availability", text: "Cheap, widely stocked filters" },
    { title: "Compact", text: "Fits any desk or bedside" },
  ],
  dyson: [
    { title: "Whole-room", text: "Projects clean air across open spaces" },
    { title: "Engineering", text: "Combined HEPA + carbon filtration" },
    { title: "Design", text: "Premium, distinctive form" },
    { title: "Sensing", text: "Detailed real-time air data" },
  ],
};

// ---- product commerce details (images, offers, scores, features) ----
const AMAZON = "https://www.amazon.in";
const FLIPKART = "https://www.flipkart.com";
const PRODUCT_DETAILS: Record<string, Record<string, unknown>> = {
  "xiaomi-smart-4": {
    image: "/product-1.webp",
    images: ["/product-1.webp", "/prodcut-2.webp", "/prodcut-3.webp"],
    mrp: 16999, reviewCount: 245, warranty: "1 year",
    features: ["Smart App", "Auto Mode", "HEPA H13", "Night Mode", "Sleep Timer", "PM2.5 Display"],
    offers: [{ retailer: "Amazon", url: AMAZON }, { retailer: "Flipkart", url: FLIPKART }],
    scores: [
      { label: "Air Purification (PM2.5)", value: 9.2 },
      { label: "Coverage", value: 9.0 },
      { label: "Noise Control", value: 8.4 },
      { label: "Energy Efficiency", value: 8.6 },
      { label: "Value for Money", value: 8.8 },
    ],
  },
  "levoit-core-mini": {
    image: "/prodcut-2.webp",
    mrp: 6999, reviewCount: 186, warranty: "1 year",
    features: ["HEPA H13", "Night Mode", "Compact", "Aroma Pad"],
    offers: [{ retailer: "Amazon", url: AMAZON }, { retailer: "Flipkart", url: FLIPKART }],
    scores: [
      { label: "Air Purification (PM2.5)", value: 8.0 },
      { label: "Coverage", value: 6.8 },
      { label: "Noise Control", value: 9.0 },
      { label: "Energy Efficiency", value: 9.2 },
      { label: "Value for Money", value: 9.4 },
    ],
  },
  "coway-airmega-150": {
    image: "/prodcut-3.webp",
    mrp: 22900, reviewCount: 312, warranty: "1 year",
    features: ["Green True HEPA", "Activated Carbon", "Auto Mode", "Air Quality Sensor"],
    offers: [{ retailer: "Amazon", url: AMAZON }, { retailer: "Flipkart", url: FLIPKART }],
    scores: [
      { label: "Air Purification (PM2.5)", value: 9.0 },
      { label: "Coverage", value: 8.6 },
      { label: "Noise Control", value: 8.8 },
      { label: "Energy Efficiency", value: 8.4 },
      { label: "Value for Money", value: 8.6 },
    ],
  },
  "philips-ac1715": {
    image: "/product-1.webp",
    mrp: 22995, reviewCount: 196, warranty: "2 years",
    features: ["NanoProtect HEPA", "Auto Mode", "PM2.5 Display", "Sleep Mode"],
    offers: [{ retailer: "Amazon", url: AMAZON }, { retailer: "Flipkart", url: FLIPKART }],
    scores: [
      { label: "Air Purification (PM2.5)", value: 8.8 },
      { label: "Coverage", value: 8.4 },
      { label: "Noise Control", value: 8.2 },
      { label: "Energy Efficiency", value: 8.6 },
      { label: "Value for Money", value: 8.2 },
    ],
  },
};

async function run() {
  await connectDB();

  let pd = 0;
  for (const [slug, details] of Object.entries(PRODUCT_DETAILS)) {
    const res = await Product.updateOne({ slug }, { $set: details });
    if (res.matchedCount) pd++;
  }
  console.log(`✔ Set commerce details on ${pd} products`);

  let cat = 0;
  for (const [slug, tagline] of Object.entries(TAGLINES)) {
    const res = await Category.updateOne({ slug }, { $set: { tagline } });
    if (res.matchedCount) cat++;
  }
  console.log(`✔ Set taglines on ${cat} categories`);

  let bh = 0;
  for (const [slug, highlights] of Object.entries(HIGHLIGHTS)) {
    const res = await Brand.updateOne({ slug }, { $set: { highlights } });
    if (res.matchedCount) bh++;
  }
  console.log(`✔ Set highlights on ${bh} brands`);

  let f = 0;
  for (const s of FACETS) {
    // `name` is set only on insert (so existing facets keep theirs and there's
    // no $set/$setOnInsert conflict on the same path).
    const doc = {
      kind: s.kind,
      category: CAT,
      slug: s.slug,
      heading: s.heading,
      intro: s.intro,
      content: s.content,
      seoTitle: s.seoTitle ?? s.heading,
      ...(s.criteria ? { criteria: s.criteria } : {}),
    };
    await Facet.findOneAndUpdate(
      { kind: s.kind, category: CAT, slug: s.slug },
      { $set: doc, $setOnInsert: { name: s.name ?? s.slug } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    f++;
  }
  console.log(`✔ Upserted content on ${f} air-purifier facets`);

  let c = 0;
  for (const city of CITIES) {
    await City.findOneAndUpdate(
      { name: city.name },
      {
        $set: {
          slug: city.name.toLowerCase(),
          state: city.state,
          intro: city.intro,
          content: city.content,
          seoTitle: city.seoTitle ?? `Best air purifiers for ${city.name}`,
          recommendedCadr: city.recommendedCadr,
          bestTimeToBuy: city.bestTimeToBuy,
          pollutants: city.pollutants,
          healthImpact: city.healthImpact,
          whoAtRisk: city.whoAtRisk,
          active: true,
        },
        $setOnInsert: { aqi: city.aqi },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    c++;
  }
  console.log(`✔ Upserted content on ${c} cities`);

  let t = 0;
  for (const tag of TAGS) {
    const add: Record<string, { $each: string[] }> = {};
    if (tag.rooms) add.rooms = { $each: tag.rooms };
    if (tag.health) add.health = { $each: tag.health };
    if (tag.cities) add.cities = { $each: tag.cities };
    const res = await Product.updateOne({ slug: tag.slug }, { $addToSet: add });
    if (res.matchedCount) t++;
  }
  console.log(`✔ Tagged ${t} products for the new facet/city pages`);

  await mongoose.connection.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Content seed failed:", err);
  process.exit(1);
});
