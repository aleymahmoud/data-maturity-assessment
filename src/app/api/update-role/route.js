import { NextResponse } from 'next/server';
import { updateUserSelectedRole } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { userId, selectedRole } = await request.json();
    
    console.log('=== UPDATE ROLE API ===');
    console.log('Received userId:', userId);
    console.log('Received selectedRole:', selectedRole);
    
    if (!userId || !selectedRole) {
      console.log('Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'User ID and selected role are required'
      }, { status: 400 });
    }

    console.log('Calling updateUserSelectedRole...');
    const result = await updateUserSelectedRole(userId, selectedRole);
    console.log('Database function result:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Update role API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}