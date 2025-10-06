import { openDatabase } from '../src/lib/database.js';

async function cleanupDuplicateUsers() {
  try {
    const db = await openDatabase();
    const code = '3ANPQ91I';

    console.log('=== CLEANING UP DUPLICATE USERS FOR CODE 3ANPQ91I ===\n');

    // Find duplicate users
    const [duplicates] = await db.execute(`
      SELECT u.*, s.id as session_id, s.status
      FROM users u
      JOIN assessment_sessions s ON u.id = s.user_id
      WHERE s.code = ?
      ORDER BY u.created_at ASC
    `, [code]);

    if (duplicates.length <= 1) {
      console.log('No duplicates found. Nothing to clean.');
      await db.end();
      return;
    }

    console.log(`Found ${duplicates.length} users for code ${code}. Keeping the first one.`);

    // Keep the first user (oldest)
    const keepUser = duplicates[0];
    const deleteUsers = duplicates.slice(1);

    console.log('\nKeeping user:');
    console.log('- ID:', keepUser.id);
    console.log('- Name:', keepUser.name);
    console.log('- Email:', keepUser.email);
    console.log('- Session:', keepUser.session_id);

    console.log('\nDeleting duplicate users:');
    for (const user of deleteUsers) {
      console.log(`- User ${user.id} (Session: ${user.session_id})`);

      // Delete user responses first
      const [respDelete] = await db.execute(`
        DELETE FROM user_responses WHERE session_id = ?
      `, [user.session_id]);
      console.log(`  Deleted ${respDelete.affectedRows} responses`);

      // Delete session
      const [sessDelete] = await db.execute(`
        DELETE FROM assessment_sessions WHERE id = ?
      `, [user.session_id]);
      console.log(`  Deleted ${sessDelete.affectedRows} session`);

      // Delete user
      const [userDelete] = await db.execute(`
        DELETE FROM users WHERE id = ?
      `, [user.id]);
      console.log(`  Deleted ${userDelete.affectedRows} user`);
    }

    console.log('\n✅ Cleanup completed successfully!');
    await db.end();
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicateUsers();