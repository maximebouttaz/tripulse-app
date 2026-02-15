import { createClient } from '@supabase/supabase-js';

// --- Supabase ---
const supabase = createClient(
  'https://bmehxrasbjwnqotxjroc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZWh4cmFzYmp3bnFvdHhqcm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDE2OTgsImV4cCI6MjA4NjU3NzY5OH0.tUK14D8GdVSVSbWaOq8Lz9i0Y0D08IZLfEr9ES28Ukc'
);

// --- Config ---
const BASE = 'https://www.finishers.com';
const SITEMAP_URL = `${BASE}/sitemap/events.xml`;
const DELAY_MS = 600;
const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Triathlon keywords to filter from sitemap
const TRI_KEYWORDS = [
  'triathlon', 'ironman', '70-3', 'half-iron', 'embrun',
  'aquathlon', 'tri-', 'chtriman', 'gerardmer', 'deauville',
  'norseman', 'challenge-roth', 'swimrun',
];

// Tag translation: Finishers English → French labels
const TAG_MAP = {
  'seaside': 'Bord de mer',
  'mountain': 'Montagne',
  'off-road': 'Chemins',
  'capitals-big-cities': 'Grande ville',
  'city': 'Ville',
  'point-to-point': 'Point à point',
  'history': 'Historique',
  'sand': 'Sable',
  'forest': 'Forêt',
  'lakes-ponds': 'Lac',
  'night': 'Nocturne',
  'island': 'Île',
  'vineyard': 'Vignoble',
  'desert': 'Désert',
  'snow': 'Neige',
  'urban': 'Urbain',
  'flat': 'Plat',
  'hilly': 'Vallonné',
  'loop': 'Boucle',
  'relay': 'Relais',
};

// Country code → French name
const COUNTRY_MAP = {
  FR: 'France', ES: 'Espagne', IT: 'Italie', DE: 'Allemagne',
  PT: 'Portugal', BE: 'Belgique', CH: 'Suisse', NL: 'Pays-Bas',
  AT: 'Autriche', GB: 'Royaume-Uni', US: 'États-Unis', NO: 'Norvège',
  DK: 'Danemark', SE: 'Suède', HR: 'Croatie', GR: 'Grèce',
  MA: 'Maroc', NZ: 'Nouvelle-Zélande', AU: 'Australie', VN: 'Vietnam',
  CZ: 'Tchéquie', PL: 'Pologne', IE: 'Irlande', FI: 'Finlande',
  HU: 'Hongrie', TR: 'Turquie', ZA: 'Afrique du Sud', MX: 'Mexique',
};

// Gradient presets by category
const GRADIENTS = {
  Ironman: [
    'bg-gradient-to-br from-red-700 to-orange-600',
    'bg-gradient-to-br from-red-800 to-rose-600',
    'bg-gradient-to-br from-red-600 to-amber-500',
  ],
  XL: [
    'bg-gradient-to-br from-purple-700 to-indigo-600',
    'bg-gradient-to-br from-purple-800 to-violet-600',
    'bg-gradient-to-br from-indigo-700 to-purple-500',
  ],
  '70.3': [
    'bg-gradient-to-br from-blue-700 to-cyan-500',
    'bg-gradient-to-br from-blue-600 to-sky-400',
    'bg-gradient-to-br from-sky-700 to-blue-500',
  ],
  L: [
    'bg-gradient-to-br from-indigo-600 to-blue-500',
    'bg-gradient-to-br from-indigo-700 to-sky-600',
    'bg-gradient-to-br from-blue-800 to-indigo-500',
  ],
  M: [
    'bg-gradient-to-br from-emerald-600 to-teal-500',
    'bg-gradient-to-br from-teal-600 to-cyan-500',
    'bg-gradient-to-br from-green-600 to-emerald-400',
  ],
  S: [
    'bg-gradient-to-br from-amber-500 to-yellow-400',
    'bg-gradient-to-br from-orange-500 to-amber-400',
    'bg-gradient-to-br from-yellow-600 to-orange-400',
  ],
  XS: [
    'bg-gradient-to-br from-zinc-500 to-slate-400',
    'bg-gradient-to-br from-slate-600 to-zinc-400',
  ],
};

function pickGradient(category) {
  const pool = GRADIENTS[category] || GRADIENTS['M'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- Helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// Remove control characters that break PostgreSQL JSON parsing
function sanitizeText(text) {
  if (!text) return null;
  // Remove NUL bytes and other control chars (keep \n and \t)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Strip HTML tags and clean text
function stripHtml(html) {
  if (!html) return null;
  const cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return sanitizeText(cleaned);
}

// Extract price from FAQ entries
function extractPriceFromFaq(faq) {
  if (!faq || !Array.isArray(faq)) return null;
  for (const entry of faq) {
    const title = (entry.title || '').toLowerCase();
    const content = stripHtml(entry.content) || '';
    if (title.includes('tarif') || title.includes('prix') || title.includes('inscription') || title.includes('price')) {
      const match = content.match(/([\d]+(?:[.,]\d+)?)\s*€/);
      if (match) return Math.round(parseFloat(match[1].replace(',', '.')));
    }
  }
  return null;
}

// Extract time limit from FAQ entries
function extractTimeLimitFromFaq(faq) {
  if (!faq || !Array.isArray(faq)) return null;
  for (const entry of faq) {
    const title = (entry.title || '').toLowerCase();
    const content = stripHtml(entry.content) || '';
    if (title.includes('barrière') || title.includes('limite') || title.includes('cut') || title.includes('temps')) {
      const match = content.match(/(\d{1,2})\s*h(?:eures?)?/i);
      if (match) return parseInt(match[1]);
    }
  }
  return null;
}

function guessCategory(swim, bike, run, name) {
  const total = (swim || 0) + (bike || 0) + (run || 0);
  const n = (name || '').toLowerCase();

  if (n.includes('ironman') && !n.includes('70.3') && !n.includes('70-3') && total > 150000) return 'Ironman';
  if (n.includes('70.3') || n.includes('70-3')) return '70.3';
  if (n.includes('ironman')) return 'Ironman';
  if (total > 150000) return 'Ironman';
  if (total > 100000) return 'XL';
  if (total > 60000) return 'L';
  if (total >= 40000) return '70.3';
  if (total >= 20000) return 'M';
  if (total >= 5000) return 'S';
  if (total > 0) return 'XS';
  return 'M';
}

// --- Step 1: Get triathlon event slugs from sitemap ---
async function getSitemapSlugs() {
  console.log('Fetching sitemap...');
  const xml = await fetchPage(SITEMAP_URL);
  if (!xml) { console.error('Failed to fetch sitemap'); return []; }

  const urls = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }

  // Filter for triathlon-related events
  const triUrls = urls.filter(url => {
    const slug = url.split('/').pop().toLowerCase();
    return TRI_KEYWORDS.some(kw => slug.includes(kw));
  });

  const slugs = triUrls.map(url => url.split('/').pop());
  console.log(`  Sitemap: ${urls.length} total events, ${slugs.length} triathlon-related`);
  return [...new Set(slugs)];
}

// --- Step 2: Extract __NEXT_DATA__ from HTML ---
function extractNextData(html) {
  const marker = '__NEXT_DATA__';
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  const jsonStart = html.indexOf('>', idx) + 1;
  const jsonEnd = html.indexOf('</script>', jsonStart);
  if (jsonEnd === -1) return null;

  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd));
  } catch {
    return null;
  }
}

// --- Step 2b: Extract JSON-LD as fallback for city/country ---
function extractJsonLd(html) {
  const marker = 'application/ld+json';
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  const scriptStart = html.lastIndexOf('<script', idx);
  const contentStart = html.indexOf('>', scriptStart) + 1;
  const contentEnd = html.indexOf('</script>', contentStart);
  if (contentEnd === -1) return null;

  try {
    const data = JSON.parse(html.slice(contentStart, contentEnd));
    return data['@type'] === 'Event' ? data : null;
  } catch {
    return null;
  }
}

// --- Step 3: Parse race from __NEXT_DATA__ + JSON-LD ---
function parseRaceDetail(html, slug) {
  const nextData = extractNextData(html);
  const jsonLd = extractJsonLd(html);

  const pp = nextData?.props?.pageProps;
  const event = pp?.event;
  const edition = pp?.nextEdition;
  const races = pp?.races;

  // Need at least the event name
  if (!event?.name && !jsonLd?.name) return null;

  const name = event?.name || jsonLd?.name || '';

  // --- Date ---
  const date = edition?.dateRange?.start || races?.[0]?.date || jsonLd?.startDate || null;

  // --- Location from breadcrumb (most reliable) then JSON-LD fallback ---
  const bc = event?.breadcrumb || [];
  const bcCountry = bc.find(b => b.type === 'country');
  const bcRegion = bc.find(b => b.type === 'level1AdminArea');
  const bcDept = bc.find(b => b.type === 'level2AdminArea');
  const bcCity = bc.find(b => b.type === 'city');

  const ldAddress = jsonLd?.location?.address || {};

  const city = bcCity?.label || ldAddress.addressLocality || '';
  const region = bcRegion?.label || ldAddress.addressRegion || null;
  const department = bcDept?.label || null;
  const countryCode = bcCountry?.code || ldAddress.addressCountry || '';
  const countryName = COUNTRY_MAP[countryCode] || countryCode;

  // --- GPS from __NEXT_DATA__ (precise race coordinates) ---
  const coords = event?.coordinates || event?.cityCoordinates || {};
  const latitude = coords.lat || null;
  const longitude = coords.lng || null;

  // --- Distances from structured activities ---
  const mainRace = races?.[0]; // Most popular / longest race
  let swim = null, bike = null, run = null;

  if (mainRace?.activities) {
    for (const act of mainRace.activities) {
      const dist = act.distance || null;
      if (act.activity === 'swimming') swim = dist;
      else if (act.activity === 'cycling') bike = dist;
      else if (act.activity === 'road' || act.activity === 'running') run = dist;
    }
  }

  const totalDistance = mainRace?.distance || ((swim || 0) + (bike || 0) + (run || 0)) || null;

  // --- Elevation ---
  const totalElevation = mainRace?.elevationGain || null;

  // --- Price: structured data first, then FAQ fallback ---
  const price = mainRace?.minPrice || extractPriceFromFaq(event?.faq) || null;

  // --- Time limit from FAQ ---
  const timeLimit = extractTimeLimitFromFaq(event?.faq) || null;

  // --- Description from longDescription (strip HTML) ---
  let description = stripHtml(event?.longDescription);
  // Trim to max 800 chars for DB storage (emoji-safe: avoid cutting surrogate pairs)
  if (description && description.length > 800) {
    let end = 797;
    // If we'd cut in the middle of a surrogate pair, step back one char
    const code = description.charCodeAt(end - 1);
    if (code >= 0xD800 && code <= 0xDBFF) end--;
    description = description.slice(0, end) + '...';
  }

  // --- Tags: translate to French ---
  let tags = null;
  if (event?.tags?.length > 0) {
    tags = event.tags
      .map(t => TAG_MAP[t] || null)
      .filter(Boolean);
    if (tags.length === 0) tags = null;
  }

  // --- Website URL ---
  let websiteUrl = null;
  if (event?.links?.website) {
    const urlParam = event.links.website.match(/url=([^&]+)/);
    if (urlParam) {
      try { websiteUrl = decodeURIComponent(urlParam[1]); } catch {}
    }
  }

  // --- Category ---
  const category = guessCategory(swim, bike, run, name);

  // Build race object, only including non-null fields
  // This prevents overwriting existing rich data with nulls
  const race = {
    slug: event?.slug || slug,
    name,
    date,
    location: city ? `${city}, ${countryName}` : countryName,
    city,
    region,
    country: countryName,
    discipline: mainRace?.discipline || 'triathlon',
    category,
    image_gradient: pickGradient(category),
    finishers_url: `${BASE}/course/${event?.slug || slug}`,
  };

  // Only set fields that have actual data (don't overwrite with null)
  if (department) race.department = department;
  if (latitude) race.latitude = latitude;
  if (longitude) race.longitude = longitude;
  if (swim) race.swim_distance = swim;
  if (bike) race.bike_distance = bike;
  if (run) race.run_distance = run;
  if (totalDistance) race.total_distance = totalDistance;
  if (totalElevation) race.total_elevation = totalElevation;
  if (price) race.price_euros = price;
  if (timeLimit) race.time_limit_hours = timeLimit;
  if (description) race.description = description;
  if (event?.subtitle) race.tagline = sanitizeText(event.subtitle);
  if (tags) race.tags = tags;
  if (websiteUrl) race.website_url = websiteUrl;

  return race;
}

// --- Step 4: Scrape all races ---
async function scrape() {
  console.log('=== TriCoach Race Scraper — Finishers.com ===\n');

  const slugs = await getSitemapSlugs();
  if (slugs.length === 0) {
    console.error('No triathlon events found.');
    return;
  }

  console.log(`\nFetching ${slugs.length} race detail pages...\n`);

  const races = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const progress = `[${i + 1}/${slugs.length}]`;

    const html = await fetchPage(`${BASE}/course/${slug}`);
    if (!html) {
      console.log(`  ${progress} ${slug} — fetch failed`);
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    const race = parseRaceDetail(html, slug);
    if (!race || !race.name) {
      console.log(`  ${progress} ${slug} — parse failed`);
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    races.push(race);
    success++;
    const cat = race.category.padEnd(7);
    const loc = race.city ? `${race.city}, ${race.country}` : race.country;
    const dist = race.total_distance ? `${(race.total_distance / 1000).toFixed(1)}km` : '?km';
    console.log(`  ${progress} ${cat} ${race.name} — ${loc} (${dist})`);

    await sleep(DELAY_MS);
  }

  console.log(`\nScraping done: ${success} OK, ${failed} failed\n`);

  if (races.length === 0) {
    console.log('No races to insert.');
    return;
  }

  // --- Upsert into Supabase ---
  console.log(`Upserting ${races.length} races into Supabase...`);

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < races.length; i += BATCH_SIZE) {
    const batch = races.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('races')
      .upsert(batch, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      // Fallback: try one by one to identify problematic races
      console.log(`  → Retrying batch one-by-one...`);
      for (const race of batch) {
        const { data: d, error: e } = await supabase
          .from('races')
          .upsert(race, { onConflict: 'slug' })
          .select('id, slug');
        if (e) {
          console.error(`    ✗ ${race.slug}: ${e.message}`);
        } else {
          inserted += d.length;
        }
      }
    } else {
      inserted += data.length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data.length} races upserted`);
    }
  }

  console.log(`\nDone! ${inserted} races in Supabase.`);
}

scrape();
