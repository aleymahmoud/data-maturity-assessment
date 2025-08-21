import { NextResponse } from 'next/server';
import { updateUserSelectedRole } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { userId, selectedRole } = await request.json();
    
    if (!userId || !selectedRole) {
      return NextResponse.json({
        success: false,
        error: 'User ID and selected role are required'
      }, { status: 400 });
    }

    const result = await updateUserSelectedRole(userId, selectedRole);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}