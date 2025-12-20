import { NextResponse } from 'next/server';

// Note: organization_assessment_requests table is not yet in the schema
// For now, return empty array. Add the table to Prisma schema if needed.

export async function GET(request) {
  try {
    // Return empty array - table not yet migrated
    return NextResponse.json({
      success: true,
      requests: []
    });

  } catch (error) {
    console.error('Error fetching organization requests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    // Table not yet migrated
    return NextResponse.json({
      success: false,
      error: 'Feature not yet available'
    }, { status: 501 });

  } catch (error) {
    console.error('Error updating request status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update status'
    }, { status: 500 });
  }
}
