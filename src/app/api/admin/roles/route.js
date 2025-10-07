import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();

    const [rows] = await database.execute(`
      SELECT * FROM roles ORDER BY display_order, id
    `);

    // Parse JSON fields
    const roles = rows.map(role => ({
      ...role,
      examples: typeof role.examples === 'string' ? JSON.parse(role.examples) : role.examples,
      subdomains: typeof role.subdomains === 'string' ? JSON.parse(role.subdomains) : role.subdomains,
      dimensionCount: role.dimension_count,
      displayOrder: role.display_order
    }));

    return NextResponse.json({
      success: true,
      roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch roles'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, title, description, examples, estimatedTime, icon, subdomains, displayOrder } = body;

    if (!id || !title) {
      return NextResponse.json({
        success: false,
        error: 'Role ID and title are required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Calculate dimension count from subdomains
    const dimensionCount = Array.isArray(subdomains) ? subdomains.length : 0;

    await database.execute(`
      INSERT INTO roles (id, title, description, examples, estimated_time, dimension_count, icon, subdomains, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      title,
      description || '',
      JSON.stringify(examples || []),
      estimatedTime || '',
      dimensionCount,
      icon || '📋',
      JSON.stringify(subdomains || []),
      displayOrder || 0
    ]);

    return NextResponse.json({
      success: true,
      message: 'Role created successfully'
    });

  } catch (error) {
    console.error('Error creating role:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        error: 'A role with this ID already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create role'
    }, { status: 500 });
  }
}
