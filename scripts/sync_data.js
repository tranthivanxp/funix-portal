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

    console.log('--- Sync Completed Successfully ---\n');
  } catch (err) {
    console.error('Error syncing data:', err);
    process.exit(1);
  }
}

main();
