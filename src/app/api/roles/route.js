import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();
    
    // Get language from query parameter
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';
    
    const roles = await database.all(`
      SELECT 
        id,
        ${language === 'ar' ? 'name_ar as name' : 'name_en as name'},
        ${language === 'ar' ? 'description_ar as description' : 'description_en as description'},
        ${language === 'ar' ? 'focus_ar as focus' : 'focus_en as focus'},
        ${language === 'ar' ? 'recommendations_ar as recommendations' : 'recommendations_en as recommendations'},
        display_order
      FROM roles 
      ORDER BY display_order
    `);

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