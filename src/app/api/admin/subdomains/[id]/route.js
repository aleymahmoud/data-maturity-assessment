import { NextResponse } from 'next/server';
import { openDatabase } from '../../../../../lib/database.js';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, domainGroup } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain name is required'
      }, { status: 400 });
    }

    const database = await openDatabase();

    const [result] = await database.execute(`
      UPDATE subdomains
      SET name_en = ?,
          name_ar = ?,
          description_en = ?,
          description_ar = ?,
          domain_id = ?
      WHERE id = ?
    `, [
      name,
      name, // Using English name for Arabic as well for now
      description || '',
      description || '', // Using English description for Arabic as well for now
      domainGroup || 'domain_1',
      id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subdomain updated successfully'
    });

  } catch (error) {
    console.error('Error updating subdomain:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update subdomain'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const database = await openDatabase();

    // Check if subdomain is referenced in any questions
    const [questionsWithSubdomain] = await database.execute(`
      SELECT COUNT(*) as count FROM questions WHERE subdomain_id = ?
    `, [id]);

    if (questionsWithSubdomain[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete subdomain. It is referenced by ${questionsWithSubdomain[0].count} question(s).`
      }, { status: 409 });
    }

    const [result] = await database.execute(`
      DELETE FROM subdomains WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subdomain deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete subdomain'
    }, { status: 500 });
  }
}
