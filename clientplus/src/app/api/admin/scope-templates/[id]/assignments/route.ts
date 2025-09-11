// src/app/api/admin/scope-templates/[id]/assignments/route.ts
// New API endpoint to get all subdomains assigned to a specific scope template

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idString } = await params;
    const templateId = parseInt(idString);
    
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    // Get the scope template
    const template = await prisma.scopeTemplate.findUnique({
      where: { id: templateId },
      include: {
        domain: true
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Scope template not found' },
        { status: 404 }
      );
    }

    // Get all assignments for this scope template
    const assignments = await prisma.scope.findMany({
      where: {
        scopeName: template.templateName,
        subdomain: {
          domainId: template.domainId
        }
      },
      include: {
        subdomain: {
          include: {
            domain: true
          }
        }
      },
      orderBy: [
        { subdomain: { domain: { domainName: 'asc' } } },
        { subdomain: { subdomainName: 'asc' } }
      ]
    });

    // Get usage statistics for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        // Get usage count from historical data
        const usageCount = await prisma.histData.count({
          where: {
            scope: template.templateName,
            subdomain: assignment.subdomain.subdomainName
          }
        });

        // Get last used date
        const lastEntry = await prisma.histData.findFirst({
          where: {
            scope: template.templateName,
            subdomain: assignment.subdomain.subdomainName
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, day: true, monthNo: true, year: true }
        });

        // Get active consultants count
        const activeConsultants = await prisma.histData.findMany({
          where: {
            scope: template.templateName,
            subdomain: assignment.subdomain.subdomainName
          },
          select: { consultant: true },
          distinct: ['consultant']
        });

        return {
          id: assignment.id,
          subdomain: {
            id: assignment.subdomain.id,
            subdomainName: assignment.subdomain.subdomainName,
            domain: assignment.subdomain.domain,
            leadConsultant: assignment.subdomain.leadConsultant
          },
          createdAt: assignment.createdAt.toISOString(),
          createdBy: assignment.createdBy,
          stats: {
            usageCount,
            lastUsed: lastEntry ? lastEntry.createdAt.toISOString() : null,
            lastUsedDate: lastEntry ? `${lastEntry.year}-${lastEntry.monthNo.toString().padStart(2, '0')}-${lastEntry.day.toString().padStart(2, '0')}` : null,
            activeConsultants: activeConsultants.length,
            consultantList: activeConsultants.map(c => c.consultant)
          }
        };
      })
    );

    return NextResponse.json({
      template: {
        id: template.id,
        templateName: template.templateName,
        description: template.description,
        domain: template.domain,
        createdAt: template.createdAt.toISOString()
      },
      assignments: assignmentsWithStats,
      summary: {
        totalAssignments: assignments.length,
        totalUsage: assignmentsWithStats.reduce((sum, a) => sum + a.stats.usageCount, 0),
        activeSubdomains: assignmentsWithStats.filter(a => a.stats.usageCount > 0).length,
        uniqueConsultants: [...new Set(assignmentsWithStats.flatMap(a => a.stats.consultantList))].length
      }
    });

  } catch (error) {
    console.error('Error fetching scope assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scope assignments' },
      { status: 500 }
    );
  }
}