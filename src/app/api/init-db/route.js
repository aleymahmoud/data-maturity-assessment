import { NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseStatus } from '../../../lib/initDatabase.js';

export async function GET() {
  try {
    // Check current database status
    const status = await checkDatabaseStatus();
    
    return NextResponse.json({
      success: true,
      status: status
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Initialize the database
    const result = await initializeDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}