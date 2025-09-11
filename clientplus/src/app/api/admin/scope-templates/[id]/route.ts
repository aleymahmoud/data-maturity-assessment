// src/app/api/admin/scope-templates/[id]/route.ts - Individual Template Operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { z } from 'zod';

const updateScopeTemplateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  description: z.string().optional(),
});

// PUT /api/admin/scope-templates/[id] - Update scope template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateScopeTemplateSchema.parse(body);

    // Check if template exists
    const existingTemplate = await prisma.scopeTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Scope template not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing template in same domain
    if (existingTemplate.templateName !== validatedData.templateName) {
      const conflictingTemplate = await prisma.scopeTemplate.findFirst({
        where: {
          domainId: existingTemplate.domainId,
          templateName: validatedData.templateName,
          id: { not: id }
        }
      });

      if (conflictingTemplate) {
        return NextResponse.json(
          { error: 'Template name already exists in this domain' },
          { status: 400 }
        );
      }
    }

    const updatedTemplate = await prisma.scopeTemplate.update({
      where: { id },
      data: {
        templateName: validatedData.templateName,
        description: validatedData.description || null,
        updatedAt: new Date()
      },
      include: {
        domain: true
      }
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating scope template:', error);
    return NextResponse.json(
      { error: 'Failed to update scope template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scope-templates/[id] - Delete scope template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    // Check if template exists
    const existingTemplate = await prisma.scopeTemplate.findUnique({
      where: { id },
      include: {
        domain: true
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Scope template not found' },
        { status: 404 }
      );
    }

    // Check if template is being used in scope assignments
    const assignmentCount = await prisma.scope.count({
      where: {
        scopeName: existingTemplate.templateName,
        subdomain: {
          domainId: existingTemplate.domainId
        }
      }
    });

    // Check if template is being used in historical data
    const historyCount = await prisma.histData.count({
      where: {
        scope: existingTemplate.templateName
      }
    });

    if (assignmentCount > 0 || historyCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete universal scope with existing assignments or historical data',
          details: `This scope has ${assignmentCount} active assignments and ${historyCount} historical entries. Remove assignments first or keep for historical reference.`
        },
        { status: 400 }
      );
    }

    await prisma.scopeTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Universal scope deleted successfully',
      deletedTemplateId: id,
      templateName: existingTemplate.templateName,
      domain: existingTemplate.domain.domainName
    });

  } catch (error) {
    console.error('Error deleting scope template:', error);
    return NextResponse.json(
      { error: 'Failed to delete scope template' },
      { status: 500 }
    );
  }
}