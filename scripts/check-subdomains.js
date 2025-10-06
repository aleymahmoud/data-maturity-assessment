// scripts/check-subdomains.js
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data_maturity.db'));

try {
  const subdomains = db.prepare('SELECT * FROM subdomains ORDER BY id').all();
  console.log('Available subdomains:');
  subdomains.forEach(subdomain => {
    console.log(`${subdomain.id}: ${subdomain.name_en}`);
  });

  console.log('\nTotal subdomains:', subdomains.length);
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}