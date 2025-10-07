import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, examples, estimatedTime, icon, subdomains, displayOrder } = body;

    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Role title is required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    // Calculate dimension count from subdomains
    const dimensionCount = Array.isArray(subdomains) ? subdomains.length : 0;

    const [result] = await database.execute(`
      UPDATE roles
      SET title = ?,
          description = ?,
          examples = ?,
          estimated_time = ?,
          dimension_count = ?,
          icon = ?,
          subdomains = ?,
          display_order = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title,
      description || '',
      JSON.stringify(examples || []),
      estimatedTime || '',
      dimensionCount,
      icon || '📋',
      JSON.stringify(subdomains || []),
      displayOrder || 0,
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully'
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update role'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const database = await openDatabase();

    // Check if role is in use by any users
    const [usersWithRole] = await database.execute(`
      SELECT COUNT(*) as count FROM users WHERE selected_role_id = ?
    `, [id]);

    if (usersWithRole[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete role. It is currently assigned to ${usersWithRole[0].count} user(s).`
      }, { status: 409 });
    }

    const [result] = await database.execute(`
      DELETE FROM roles WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete role'
    }, { status: 500 });
  }
}
