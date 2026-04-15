const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PG_URL = process.env.DATABASE_URL;
const csvPath = '/Users/hajin/.cache/kagglehub/datasets/zynicide/wine-reviews/versions/4/winemag-data-130k-v2.csv';

// Simple CSV parser handling quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// Infer wine type from variety
function inferType(variety) {
  if (!variety) return null;
  const v = variety.toLowerCase();
  if (v.includes('sparkling') || v.includes('champagne') || v.includes('prosecco') || v.includes('cava')) return 'sparkling';
  if (v.includes('rosé') || v.includes('rose')) return 'rose';
  if (v.includes('port') || v.includes('sherry') || v.includes('madeira')) return 'fortified';
  // Common red grapes
  if (/cabernet|merlot|pinot noir|syrah|shiraz|tempranillo|sangiovese|malbec|grenache|nebbiolo|zinfandel|barbera|carmenere|mourvèdre|red blend/i.test(v)) return 'red';
  // Common white grapes
  if (/chardonnay|sauvignon blanc|riesling|pinot grigio|pinot gris|gewürztraminer|viognier|chenin blanc|moscato|white blend|grüner|albariño|vermentino|trebbiano/i.test(v)) return 'white';
  if (v.includes('red')) return 'red';
  if (v.includes('white')) return 'white';
  return null;
}

// Extract vintage from title
function extractVintage(title) {
  const match = title?.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

(async () => {
  const pg = new Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  console.log(`Total lines: ${lines.length}`);

  // Process in batches
  let imported = 0;
  let skipped = 0;
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    // cols: [idx, country, description, designation, points, price, province, region_1, region_2, taster, twitter, title, variety, winery]
    const country = cols[1];
    const title = cols[11];
    const variety = cols[12];
    const winery = cols[13];
    const region = cols[6] || cols[7]; // province or region_1
    const vintage = extractVintage(title);
    const wineType = inferType(variety);

    if (!title || seen.has(title)) { skipped++; continue; }
    seen.add(title);

    const grapes = variety ? [variety] : null;

    try {
      await pg.query(`
        INSERT INTO wines (category, name, wine_type, grape_variety, country, region, producer, vintage_year, verified, external_ref)
        VALUES ('wine', $1, $2, $3, $4, $5, $6, $7, true, $8)
      `, [title, wineType, grapes, country, region, winery, vintage, JSON.stringify({ source: 'kaggle_winemag' })]);
      imported++;
    } catch (err) {
      skipped++;
    }

    if (i % 10000 === 0) console.log(`Progress: ${i}/${lines.length} (imported: ${imported})`);
  }

  const { rows } = await pg.query('SELECT count(*) as cnt FROM wines');
  console.log(`Imported: ${imported}, Skipped: ${skipped}, Total wines: ${rows[0].cnt}`);
  await pg.end();
})();
