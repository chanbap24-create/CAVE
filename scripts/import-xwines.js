const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PG_URL = process.env.DATABASE_URL;
const csvPath = path.join(__dirname, '..', 'data', 'XWines_Test_100_wines.csv');

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

function parseGrapes(raw) {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw.replace(/'/g, '"'));
    return arr.filter(g => g && g.length > 1).slice(0, 5);
  } catch { return null; }
}

const typeMap = { 'Red': 'red', 'White': 'white', 'Rosé': 'rose', 'Sparkling': 'sparkling', 'Dessert': 'dessert', 'Fortified': 'fortified' };

(async () => {
  const pg = new Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  const header = parseCSVLine(lines[0]);
  console.log('Columns:', header.join(', '));

  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = cols[1]; // WineName
    const type = typeMap[cols[2]] || null; // Type
    const grapes = parseGrapes(cols[4]); // Grapes
    const abv = cols[6] ? parseFloat(cols[6]) : null; // ABV
    const country = cols[10]; // Country
    const region = cols[12]; // RegionName
    const producer = cols[14]; // WineryName

    if (!name) continue;

    try {
      await pg.query(`
        INSERT INTO wines (category, name, wine_type, grape_variety, alcohol_pct, country, region, producer, verified, external_ref)
        VALUES ('wine', $1, $2, $3, $4, $5, $6, $7, true, $8)
        ON CONFLICT DO NOTHING
      `, [name, type, grapes, abv, country, region, producer, JSON.stringify({ source: 'xwines', id: cols[0] })]);
      imported++;
    } catch (err) {
      // skip duplicates
    }
  }

  const { rows } = await pg.query('SELECT count(*) as cnt FROM wines');
  console.log(`Imported: ${imported}, Total wines: ${rows[0].cnt}`);
  await pg.end();
})();
