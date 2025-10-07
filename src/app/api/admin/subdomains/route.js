import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();

    const [rows] = await database.execute(`
      SELECT id, name_en as name, description_en as description, domain_id as domainGroup, display_order
      FROM subdomains
      ORDER BY display_order, id
    `);

    return NextResponse.json({
      success: true,
      subdomains: rows
    });

  } catch (error) {
    console.error('Error fetching subdomains:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subdomains'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, name, description, domainGroup } = body;

    if (!id || !name) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain ID and name are required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Get the highest display_order and increment
    const [maxOrder] = await database.execute(`
      SELECT MAX(display_order) as max_order FROM subdomains
    `);
    const displayOrder = (maxOrder[0].max_order || 0) + 1;

    // Use first domain as default if domainGroup not provided
    const [domains] = await database.execute('SELECT id FROM domains LIMIT 1');
    const defaultDomainId = domainGroup || domains[0]?.id || 'domain_1';

    await database.execute(`
      INSERT INTO subdomains (id, domain_id, name_en, name_ar, description_en, description_ar, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      defaultDomainId,
      name,
      name, // Using English name for Arabic as well for now
      description || '',
      description || '', // Using English description for Arabic as well for now
      displayOrder
    ]);

    return NextResponse.json({
      success: true,
      message: 'Subdomain created successfully'
    });

  } catch (error) {
    console.error('Error creating subdomain:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        error: 'A subdomain with this ID already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create subdomain'
    }, { status: 500 });
  }
}
