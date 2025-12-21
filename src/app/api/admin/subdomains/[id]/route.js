import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const subdomain = await prisma.subdomain.findUnique({
      where: { id },
      include: {
        domain: {
          select: { id: true, name: true }
        },
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!subdomain) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subdomain: {
        id: subdomain.id,
        domain_id: subdomain.domainId,
        domain_name: subdomain.domain.name,
        name_en: subdomain.name,
        name_ar: subdomain.nameAr,
        description_en: subdomain.description,
        description_ar: subdomain.descriptionAr,
        display_order: subdomain.displayOrder,
        is_active: subdomain.isActive,
        question_count: subdomain._count.questions
      }
    });

  } catch (error) {
    console.error('Error fetching subdomain:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subdomain'
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name_en, name_ar, description_en, description_ar, domain_id, display_order, is_active } = body;

    if (!name_en) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain name is required'
      }, { status: 400 });
    }

    const updatedSubdomain = await prisma.subdomain.update({
      where: { id },
      data: {
        name: name_en,
        nameAr: name_ar || null,
        description: description_en || null,
        descriptionAr: description_ar || null,
        domainId: domain_id || undefined,
        displayOrder: display_order !== undefined ? parseInt(display_order) : undefined,
        isActive: is_active !== undefined ? is_active : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subdomain updated successfully',
      subdomain: updatedSubdomain
    });

  } catch (error) {
    console.error('Error updating subdomain:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update subdomain'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if subdomain has questions
    const questionCount = await prisma.question.count({
      where: { subdomainId: id }
    });

    if (questionCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete: This subdomain has ${questionCount} question(s). Delete them first.`
      }, { status: 409 });
    }

    await prisma.subdomain.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Subdomain deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subdomain:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Subdomain not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete subdomain'
    }, { status: 500 });
  }
}
