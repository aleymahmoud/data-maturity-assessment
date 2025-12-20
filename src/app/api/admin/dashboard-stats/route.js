import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    // Get active assessment codes count
    const activeCodes = await prisma.assessmentCode.count({
      where: {
        expiresAt: { gt: new Date() },
        isUsed: false
      }
    })

    // Get completed assessments count
    const completedAssessments = await prisma.assessmentSession.count({
      where: { status: 'completed' }
    })

    // Get active sessions count
    const activeSessions = await prisma.assessmentSession.count({
      where: { status: 'in_progress' }
    })

    // Get recent activity from audit logs
    const recentActivityResult = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    const recentActivity = recentActivityResult.map(log => ({
      description: `${log.action}: ${log.details || ''}`,
      timeAgo: formatTimeAgo(log.timestamp)
    }))

    const stats = {
      activeCodes,
      completedAssessments,
      activeSessions,
      recentActivity
    }

    return Response.json({ success: true, stats })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return Response.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(timestamp) {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now - past

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`
  } else {
    return `${diffDays} days ago`
  }
}
