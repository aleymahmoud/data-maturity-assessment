import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';
import { roles as staticRoles } from '../../../data/roles.js';

export async function GET(request) {
  try {
    // Get language from query parameter
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en';

    // Try to get roles from database first
    let dbRoles = [];
    try {
      dbRoles = await prisma.role.findMany({
        orderBy: { id: 'asc' }
      });
    } catch (dbError) {
      console.log('Database roles not available, using static roles');
    }

    // If we have roles in database, use those
    if (dbRoles && dbRoles.length > 0) {
      const roles = dbRoles.map(role => ({
        id: role.id,
        name: role.title,
        description: role.description || '',
        focus: role.description || ''
      }));

      return NextResponse.json({
        success: true,
        roles: roles
      });
    }

    // Fallback to static roles
    const roles = Object.values(staticRoles).map(role => ({
      id: role.id,
      name: role.title,
      description: role.description,
      focus: role.description,
      examples: role.examples,
      estimatedTime: role.estimatedTime,
      dimensionCount: role.dimensionCount,
      icon: role.icon
    }));

    return NextResponse.json({
      success: true,
      roles: roles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    console.error('Error details:', error.message);

    // Ultimate fallback - return static roles even on error
    try {
      const roles = Object.values(staticRoles).map(role => ({
        id: role.id,
        name: role.title,
        description: role.description,
        focus: role.description,
        examples: role.examples,
        estimatedTime: role.estimatedTime,
        dimensionCount: role.dimensionCount,
        icon: role.icon
      }));

      return NextResponse.json({
        success: true,
        roles: roles
      });
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch roles',
        details: error.message
      }, { status: 500 });
    }
  }
}
