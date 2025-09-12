import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(process.cwd(), 'data_maturity.db'))

export async function GET(request) {
  try {
    // For now, we'll skip session check to get the API working
    // In production, you should add proper authentication

    // Active Codes: Count of assessment codes that are not expired and not fully used
    const activeCodesQuery = `
      SELECT COUNT(*) as count 
      FROM assessment_codes 
      WHERE expires_at > datetime('now') 
      AND (usage_count < max_uses OR max_uses IS NULL)
    `
    const activeCodes = db.prepare(activeCodesQuery).get()

    // Completed Assessments: Count of completed assessment sessions
    const completedAssessmentsQuery = `
      SELECT COUNT(*) as count 
      FROM assessment_sessions 
      WHERE status = 'completed' OR completion_percentage >= 100
    `
    const completedAssessments = db.prepare(completedAssessmentsQuery).get()

    // Active Sessions: Count of sessions in progress
    const activeSessionsQuery = `
      SELECT COUNT(*) as count 
      FROM assessment_sessions 
      WHERE status IN ('in_progress', 'started') 
      AND (completion_percentage < 100 OR completion_percentage IS NULL)
      AND datetime(session_start) > datetime('now', '-7 days')
    `
    const activeSessions = db.prepare(activeSessionsQuery).get()

    // Recent Activity: Get latest audit log entries
    const recentActivityQuery = `
      SELECT 
        action,
        details,
        timestamp,
        user_type
      FROM audit_logs 
      WHERE timestamp > datetime('now', '-7 days')
      ORDER BY timestamp DESC 
      LIMIT 10
    `
    const recentActivity = db.prepare(recentActivityQuery).all()

    // Format activity data for display
    const formattedActivity = recentActivity.map(activity => {
      const timeAgo = getTimeAgo(activity.timestamp)
      let description = activity.action
      
      // Format different types of activities
      if (activity.action.includes('assessment_completed')) {
        description = 'Assessment completed'
      } else if (activity.action.includes('session_started')) {
        description = 'Assessment session started'
      } else if (activity.action.includes('code_generated')) {
        description = 'Assessment code generated'
      } else if (activity.action.includes('user_registered')) {
        description = 'New user registered'
      } else if (activity.action.includes('login')) {
        description = 'User logged in'
      }

      return {
        description,
        timestamp: activity.timestamp,
        timeAgo,
        details: activity.details
      }
    })

    const stats = {
      activeCodes: activeCodes.count || 0,
      completedAssessments: completedAssessments.count || 0,
      activeSessions: activeSessions.count || 0,
      recentActivity: formattedActivity
    }

    return NextResponse.json({ success: true, stats })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to format timestamps as "time ago"
function getTimeAgo(timestamp) {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  
  return activityTime.toLocaleDateString()
}