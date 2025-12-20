import { runMigration } from '@/lib/migrate';

export async function GET() {
  try {
    const result = await runMigration();

    if (result.success) {
      return Response.json({
        success: true,
        message: 'Database migration completed successfully',
        details: result.message
      });
    } else {
      return Response.json({
        success: false,
        message: 'Migration failed',
        error: result.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return Response.json({
      success: false,
      message: 'Migration failed',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
