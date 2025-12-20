import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const organization = searchParams.get('organization') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (organization !== 'all') {
      where.user = { organization };
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get sessions with user details
    const sessions = await prisma.assessmentSession.findMany({
      where,
      include: {
        user: true,
        codeRef: true
      },
      orderBy: { sessionStart: 'desc' },
      skip,
      take: limit
    });

    // Get total count
    const totalSessions = await prisma.assessmentSession.count({ where });

    // Get overview statistics
    const activeSessions = await prisma.assessmentSession.count({
      where: { status: 'in_progress' }
    });

    const completedSessions = await prisma.assessmentSession.count({
      where: { status: 'completed' }
    });

    const abandonedSessions = await prisma.assessmentSession.count({
      where: { status: 'abandoned' }
    });

    const stats = {
      activeSessions,
      completedSessions,
      abandonedSessions,
      averageDuration: 0,
      totalSessions
    };

    // Get unique organizations
    const users = await prisma.user.findMany({
      where: {
        organization: { not: null }
      },
      select: { organization: true },
      distinct: ['organization']
    });

    const organizations = users.map(u => u.organization).filter(Boolean);

    // Transform sessions
    const transformedSessions = sessions.map(session => {
      const durationMs = session.sessionEnd
        ? new Date(session.sessionEnd) - new Date(session.sessionStart)
        : new Date() - new Date(session.sessionStart);
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      return {
        id: session.id,
        code: session.code,
        assessmentCode: session.code,
        userId: session.userId,
        status: session.status,
        createdAt: session.sessionStart,
        completedAt: session.sessionEnd,
        sessionStart: session.sessionStart,
        sessionEnd: session.sessionEnd,
        totalQuestions: session.totalQuestions,
        questionsAnswered: session.questionsAnswered,
        completionPercentage: session.completionPercentage,
        languagePreference: session.languagePreference,
        durationMinutes,
        userName: session.user?.name,
        userEmail: session.user?.email,
        organization: session.user?.organization,
        roleTitle: session.user?.roleTitle,
        roleName: session.user?.selectedRoleId,
        assessmentType: session.codeRef?.assessmentType,
        codeOrganization: session.codeRef?.organizationName,
        overallScore: null,
        maturityLevel: null
      };
    });

    return NextResponse.json({
      success: true,
      sessions: transformedSessions,
      stats,
      organizations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sessions: ' + error.message
    }, { status: 500 });
  }
}
