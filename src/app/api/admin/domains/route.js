import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma.js'

export async function GET(request) {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { subdomains: true }
        }
      }
    })

    // Map to expected format for frontend
    const mappedDomains = domains.map(domain => ({
      id: domain.id,
      name_en: domain.name,
      name_ar: domain.nameAr,
      description_en: domain.description,
      description_ar: domain.descriptionAr,
      display_order: domain.displayOrder,
      is_active: domain.isActive,
      subdomain_count: domain._count.subdomains
    }))

    return NextResponse.json({
      success: true,
      domains: mappedDomains
    })

  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch domains'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      name_en,
      name_ar,
      description_en,
      description_ar,
      display_order
    } = body

    if (!name_en) {
      return NextResponse.json({
        success: false,
        error: 'English name is required'
      }, { status: 400 })
    }

    // Get the next display order if not provided
    let order = display_order
    if (order === undefined || order === null) {
      const lastDomain = await prisma.domain.findFirst({
        orderBy: { displayOrder: 'desc' }
      })
      order = lastDomain ? lastDomain.displayOrder + 1 : 1
    }

    const newDomain = await prisma.domain.create({
      data: {
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
      message: 'Domain created successfully',
      domain: {
        id: newDomain.id,
        name_en: newDomain.name,
        name_ar: newDomain.nameAr,
        description_en: newDomain.description,
        description_ar: newDomain.descriptionAr,
        display_order: newDomain.displayOrder,
        is_active: newDomain.isActive
      }
    })

  } catch (error) {
    console.error('Error creating domain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create domain'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()

    const { id, name_en, name_ar, description_en, description_ar, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Domain ID is required'
      }, { status: 400 })
    }

    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: {
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
      message: 'Domain updated successfully',
      domain: updatedDomain
    })

  } catch (error) {
    console.error('Error updating domain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update domain'
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
        error: 'Domain ID is required'
      }, { status: 400 })
    }

    // Check if domain has subdomains
    const subdomainCount = await prisma.subdomain.count({
      where: { domainId: id }
    })

    if (subdomainCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete: This domain has ${subdomainCount} subdomain(s). Delete them first.`
      }, { status: 400 })
    }

    await prisma.domain.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete domain'
    }, { status: 500 })
  }
}
