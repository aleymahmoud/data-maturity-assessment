import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function GET(request) {
  try {
    const database = await openDatabase();

    const [levels] = await database.execute(`
      SELECT
        level_number,
        level_name,
        level_description_en,
        level_description_ar,
        score_range_min,
        score_range_max,
        color_code
      FROM maturity_levels
      ORDER BY level_number
    `);

    return NextResponse.json({
      success: true,
      levels
    });

  } catch (error) {
    console.error('Error fetching maturity levels:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch maturity levels'
    }, { status: 500 });
  }
}
