import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const b2cSrc = path.join(__dirname, '../../b2c-mkt-dashboard/public/data.json');
const mentorSrc = path.join(__dirname, '../../MENTOR/mentor_data.json');

const destDir = path.join(__dirname, '../public/data');
const b2cDest = path.join(destDir, 'b2c_data.json');
const mentorDest = path.join(destDir, 'mentor_data.json');

// Helper to strip trailing slash from URL
const cleanUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

async function syncB2c() {
  const envUrl = process.env.VITE_B2C_MKT_URL || process.env.B2C_MKT_DATA_URL;
  if (envUrl) {
    const onlineUrl = `${cleanUrl(envUrl)}/data.json`;
    console.log(`Attempting to fetch B2C data from online source: ${onlineUrl}`);
    try {
      const res = await fetch(onlineUrl);
      if (res.ok) {
        const data = await res.json();
        fs.writeFileSync(b2cDest, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Successfully downloaded B2C data from ${onlineUrl} to ${b2cDest}`);
        return;
      }
      console.warn(`Fetch B2C failed with status: ${res.status}`);
    } catch (err) {
      console.warn(`Fetch B2C data from online URL failed: ${err.message}`);
    }
  }

  // Fallback to local copy
  if (fs.existsSync(b2cSrc)) {
    fs.copyFileSync(b2cSrc, b2cDest);
    console.log(`Synced B2C data locally from ${b2cSrc} to ${b2cDest}`);
  } else {
    console.warn(`Warning: B2C source data not found at ${b2cSrc} and no online source succeeded.`);
  }
}

async function syncMentor() {
  const envUrl = process.env.VITE_MENTOR_URL || process.env.MENTOR_DATA_URL;
  if (envUrl) {
    const onlineUrl = `${cleanUrl(envUrl)}/mentor_data.json`;
    console.log(`Attempting to fetch Mentor data from online source: ${onlineUrl}`);
    try {
      const res = await fetch(onlineUrl);
      if (res.ok) {
        const data = await res.json();
        fs.writeFileSync(mentorDest, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Successfully downloaded Mentor data from ${onlineUrl} to ${mentorDest}`);
        return;
      }
      console.warn(`Fetch Mentor failed with status: ${res.status}`);
    } catch (err) {
      console.warn(`Fetch Mentor data from online URL failed: ${err.message}`);
    }
  }

  // Fallback to local copy
  if (fs.existsSync(mentorSrc)) {
    fs.copyFileSync(mentorSrc, mentorDest);
    console.log(`Synced Mentor data locally from ${mentorSrc} to ${mentorDest}`);
  } else {
    console.warn(`Warning: Mentor source data not found at ${mentorSrc} and no online source succeeded.`);
  }
}

function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

async function syncKhaoThi() {
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1CkYyhewjNOIuYrMhtNP5pUF05C-hv8vTkaBbdbPMoUQ/export?format=csv&gid=1035019380";
  const destFile = path.join(destDir, 'khaothi_data.json');
  const localSrc = path.join(__dirname, '../../test/khaothi_actual_data.csv');
  
  console.log(`Attempting to fetch Khao Thi data from online Google Sheet...`);
  let csvText = "";
  try {
    const res = await fetch(sheetUrl);
    if (res.ok) {
      csvText = await res.text();
      console.log(`Successfully fetched Khao Thi CSV data from Google Sheet.`);
    } else {
      console.warn(`Fetch Khao Thi from Google Sheet failed with status: ${res.status}`);
    }
  } catch (err) {
    console.warn(`Fetch Khao Thi from Google Sheet failed: ${err.message}`);
  }
  
  // Fallback to local copy if fetch failed or returned empty
  if (!csvText && fs.existsSync(localSrc)) {
    console.log(`Using fallback local source at: ${localSrc}`);
    csvText = fs.readFileSync(localSrc, 'utf-8');
  }
  
  if (csvText) {
    try {
      const rows = parseCSV(csvText);
      if (rows.length > 0) {
        const headers = rows[0].map(h => h.trim());
        const data = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < headers.length) continue;
          
          // Skip entirely empty rows
          if (row.every(cell => !cell || cell.trim() === "")) continue;
          
          const obj = {};
          headers.forEach((header, index) => {
            if (header) {
              obj[header] = (row[index] || "").trim();
            }
          });
          data.push(obj);
        }
        
        fs.writeFileSync(destFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Successfully synced ${data.length} Khao Thi records to ${destFile}`);
      } else {
        console.error("Parsed CSV has 0 rows.");
      }
    } catch (parseErr) {
      console.error(`Error parsing CSV data: ${parseErr.message}`);
    }
  } else {
    console.error("No CSV source data found for Khao Thi.");
  }
}

async function main() {
  console.log('--- Syncing Data from Sibling Dashboards / Online Sources ---');

  try {
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log(`Created directory: ${destDir}`);
    }

    await syncB2c();
    await syncMentor();
    await syncKhaoThi();

    console.log('--- Sync Completed Successfully ---\n');
  } catch (err) {
    console.error('Error syncing data:', err);
    process.exit(1);
  }
}

main();
