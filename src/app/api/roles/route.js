import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();

    // Get language from query parameter
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    const [rows] = await database.execute(`
      SELECT
        id,
        title as name,
        description,
        examples,
        estimated_time as estimatedTime,
        dimension_count as dimensionCount,
        icon,
        subdomains,
        display_order
      FROM roles
      ORDER BY display_order, id
    `);

    // Parse JSON fields and format for frontend
    const roles = rows.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      focus: role.description, // Use description as focus for now
      recommendations: `Personalized recommendations for ${role.name}`,
      examples: typeof role.examples === 'string' ? JSON.parse(role.examples) : role.examples,
      subdomains: typeof role.subdomains === 'string' ? JSON.parse(role.subdomains) : role.subdomains,
      estimatedTime: role.estimatedTime,
      dimensionCount: role.dimensionCount,
      icon: role.icon,
      displayOrder: role.display_order
    }));

    return NextResponse.json({
      success: true,
      roles: roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch roles'
    }, { status: 500 });
  }
}