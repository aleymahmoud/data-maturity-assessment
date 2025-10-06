import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assessmentDir = path.join(__dirname, '../src/app/assessment');

// Define path replacements
const replacements = [
  // Router.push replacements
  { from: /router\.push\(`\/results/g, to: "router.push(`/assessment/results" },
  { from: /router\.push\(`\/user-info/g, to: "router.push(`/assessment/user-info" },
  { from: /router\.push\(`\/role-selection/g, to: "router.push(`/assessment/role-selection" },
  { from: /router\.push\(`\/code-entry/g, to: "router.push(`/assessment/start" },
  { from: /router\.push\(`\/assessment\?/g, to: "router.push(`/assessment/questions?" },

  // href replacements in templates
  { from: /href=\{`\/results/g, to: "href={`/assessment/results" },
  { from: /href=\{`\/user-info/g, to: "href={`/assessment/user-info" },
  { from: /href=\{`\/role-selection/g, to: "href={`/assessment/role-selection" },
  { from: /href=\{`\/code-entry/g, to: "href={`/assessment/start" },
  { from: /href=\{`\/assessment\?/g, to: "href={`/assessment/questions?" },
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
    console.log('✓ Updated:', path.relative(assessmentDir, filePath));
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

console.log('🔄 Updating assessment paths...\n');
const updated = processDirectory(assessmentDir);
console.log(`\n✅ Updated ${updated} files`);
