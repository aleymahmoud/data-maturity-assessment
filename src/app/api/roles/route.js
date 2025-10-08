import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();

    // Get language from query parameter
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const [rows] = await database.execute(`
      SELECT *
      FROM roles
      ORDER BY display_order, id
    `);

    // Format for frontend
    const roles = rows.map(role => ({
      id: role.id,
      name: role.title || role.name,
      description: role.description || '',
      focus: role.description || '',
      displayOrder: role.display_order
    }));

    return NextResponse.json({
      success: true,
      roles: roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch roles',
      details: error.message
    }, { status: 500 });
  }
}