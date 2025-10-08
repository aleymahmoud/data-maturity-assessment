import { NextResponse } from 'next/server';
import { openDatabase } from '../../../lib/database.js';

export async function POST(request) {
  try {
    const { page, sessionId, userAgent } = await request.json();
    const database = await openDatabase();

    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Log page visit
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await database.execute(`
      INSERT INTO audit_logs (id, user_type, user_id, action, details, ip_address, timestamp)
      VALUES (?, 'visitor', ?, 'page_view', ?, ?, NOW())
    `, [logId, sessionId || null, page, ip]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking visit:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
