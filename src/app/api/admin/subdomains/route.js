import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')

    const where = domainId ? { domainId } : {}

    const subdomains = await prisma.subdomain.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        domain: {
          select: { id: true, name: true }
        },
        _count: {
          select: { questions: true }
        }
      }
    })

    // Map to expected format for frontend
    const mappedSubdomains = subdomains.map(sub => ({
      id: sub.id,
      domain_id: sub.domainId,
      domain_name: sub.domain.name,
      name: sub.name,
      name_en: sub.name,
      name_ar: sub.nameAr,
      description: sub.description,
      description_en: sub.description,
      description_ar: sub.descriptionAr,
      display_order: sub.displayOrder,
      is_active: sub.isActive,
      question_count: sub._count.questions
    }))

    return NextResponse.json({
      success: true,
      subdomains: mappedSubdomains
    })

  } catch (error) {
    console.error('Error fetching subdomains:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subdomains'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      domain_id,
      name_en,
      name_ar,
      description_en,
      description_ar,
      display_order
    } = body

    if (!domain_id || !name_en) {
      return NextResponse.json({
        success: false,
        error: 'Domain ID and English name are required'
      }, { status: 400 })
    }

    // Verify domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: domain_id }
    })

    if (!domain) {
      return NextResponse.json({
        success: false,
        error: 'Domain not found'
      }, { status: 404 })
    }

    // Get the next display order if not provided
    let order = display_order
    if (order === undefined || order === null) {
      const lastSubdomain = await prisma.subdomain.findFirst({
        where: { domainId: domain_id },
        orderBy: { displayOrder: 'desc' }
      })
      order = lastSubdomain ? lastSubdomain.displayOrder + 1 : 1
    }

    const newSubdomain = await prisma.subdomain.create({
      data: {
        domainId: domain_id,
        name: name_en,
        nameAr: name_ar || null,
        description: description_en || null,
        descriptionAr: description_ar || null,
        displayOrder: parseInt(order),
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subdomain created successfully',
      subdomain: {
        id: newSubdomain.id,
        domain_id: newSubdomain.domainId,
        name_en: newSubdomain.name,
        name_ar: newSubdomain.nameAr,
        description_en: newSubdomain.description,
        description_ar: newSubdomain.descriptionAr,
        display_order: newSubdomain.displayOrder,
        is_active: newSubdomain.isActive
      }
    })

  } catch (error) {
    console.error('Error creating subdomain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create subdomain'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    const { id, domain_id, name_en, name_ar, description_en, description_ar, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain ID is required'
      }, { status: 400 })
    }

    const updatedSubdomain = await prisma.subdomain.update({
      where: { id },
      data: {
        domainId: domain_id || undefined,
        name: name_en || undefined,
        nameAr: name_ar,
        description: description_en,
        descriptionAr: description_ar,
        displayOrder: display_order !== undefined ? parseInt(display_order) : undefined,
        isActive: is_active !== undefined ? is_active : undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subdomain updated successfully',
      subdomain: updatedSubdomain
    })

  } catch (error) {
    console.error('Error updating subdomain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update subdomain'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Subdomain ID is required'
      }, { status: 400 })
    }

    // Check if subdomain has questions
    const questionCount = await prisma.question.count({
      where: { subdomainId: id }
    })

    if (questionCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete: This subdomain has ${questionCount} question(s). Delete them first.`
      }, { status: 400 })
    }

    await prisma.subdomain.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Subdomain deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting subdomain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete subdomain'
    }, { status: 500 })
  }
}
