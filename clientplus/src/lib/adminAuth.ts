// src/lib/adminAuth.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAdmin() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    
    if (!userRole || !['SUPER_USER', 'LEAD_CONSULTANT'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return null if authorized (no error response)
    return null;
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function requireSuperUser() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    
    if (userRole !== 'SUPER_USER') {
      return NextResponse.json(
        { error: 'Super user access required' },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('Super user auth check failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}