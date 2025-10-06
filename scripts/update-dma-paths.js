import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dmaDir = path.join(__dirname, '../src/app/dma');

// Define path replacements
const replacements = [
  // Router.push replacements
  { from: /router\.push\(`\/assessment\//g, to: "router.push(`/dma/" },
  { from: /router\.push\(`\/assessment\?/g, to: "router.push(`/dma/questions?" },

  // href replacements in templates
  { from: /href=\{`\/assessment\//g, to: "href={`/dma/" },
  { from: /href=\{`\/assessment\?/g, to: "href={`/dma/questions?" },
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Updated:', path.relative(dmaDir, filePath));
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalUpdated = 0;

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      totalUpdated += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.tsx'))) {
      if (updateFile(fullPath)) {
        totalUpdated++;
      }
    }
  });

  return totalUpdated;
}

console.log('🔄 Updating paths from /assessment to /dma...\n');
const updated = processDirectory(dmaDir);
console.log(`\n✅ Updated ${updated} files`);
