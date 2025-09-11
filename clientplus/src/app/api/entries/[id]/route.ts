// src/app/api/entries/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validateUserDomainAccess } from '@/lib/domainValidation'

// Validation schema for updating entry data
const updateEntrySchema = z.object({
  hours: z.number().min(0.25, 'Hours must be at least 0.25').max(24, 'Hours cannot exceed 24').optional(),
  notes: z.string().min(1, 'Notes cannot be empty').optional(),
  domain: z.string().min(1, 'Domain cannot be empty').optional(),
  subdomain: z.string().min(1, 'Subdomain cannot be empty').optional(),
  scope: z.string().min(1, 'Scope cannot be empty').optional()
})

// GET /api/entries/[id] - Get specific entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }

    // Find the entry
    const entry = await prisma.histData.findUnique({
      where: { id: entryId }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // SECURITY: Verify user owns this entry or is admin
    if (entry.consultant !== session.user.username && 
        session.user.role !== 'SUPER_USER' && 
        session.user.role !== 'LEAD_CONSULTANT') {
      return NextResponse.json({ error: 'Access denied to this entry' }, { status: 403 })
    }

    // SECURITY: Verify user has access to the entry's domain
    if (session.user.role !== 'SUPER_USER' && session.user.role !== 'LEAD_CONSULTANT') {
      const domainValidation = await validateUserDomainAccess(
        session.user.id,
        entry.domain!,
        session.user.role
      )

      if (!domainValidation.isValid) {
        return NextResponse.json({
          error: domainValidation.error || 'Access denied to this entry\'s domain'
        }, { status: 403 })
      }
    }

    return NextResponse.json({
      id: entry.id,
      consultant: entry.consultant,
      domain: entry.domain,
      subdomain: entry.subdomain,
      scope: entry.scope,
      hours: entry.workingHours,
      notes: entry.notes,
      date: `${entry.year}-${entry.monthNo.toString().padStart(2, '0')}-${entry.day.toString().padStart(2, '0')}`,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    })

  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/entries/[id] - Update specific entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateEntrySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid update data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const updateData = validationResult.data

    // Find the existing entry
    const existingEntry = await prisma.histData.findUnique({
      where: { id: entryId }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // SECURITY: Verify user owns this entry or is admin
    if (existingEntry.consultant !== session.user.username && 
        session.user.role !== 'SUPER_USER' && 
        session.user.role !== 'LEAD_CONSULTANT') {
      return NextResponse.json({ error: 'Access denied to this entry' }, { status: 403 })
    }

    // SECURITY: If domain is being changed, validate access to new domain
    if (updateData.domain && updateData.domain !== existingEntry.domain) {
      const domainValidation = await validateUserDomainAccess(
        session.user.id,
        updateData.domain,
        session.user.role
      )

      if (!domainValidation.isValid) {
        return NextResponse.json({
          error: domainValidation.error || 'Access denied to the new domain',
          allowedDomains: domainValidation.allowedDomains
        }, { status: 403 })
      }

      // Validate that the new domain/subdomain/scope combination exists
      if (updateData.subdomain || updateData.scope) {
        const domain = await prisma.domain.findFirst({
          where: { domainName: updateData.domain }
        })

        if (!domain) {
          return NextResponse.json({
            error: `Domain '${updateData.domain}' not found`
          }, { status: 400 })
        }

        if (updateData.subdomain) {
          const subdomain = await prisma.subdomain.findFirst({
            where: {
              subdomainName: updateData.subdomain,
              domainId: domain.id
            }
          })

          if (!subdomain) {
            return NextResponse.json({
              error: `Subdomain '${updateData.subdomain}' not found in domain '${updateData.domain}'`
            }, { status: 400 })
          }

          if (updateData.scope) {
            const scope = await prisma.scope.findFirst({
              where: {
                scopeName: updateData.scope,
                subdomainId: subdomain.id
              }
            })

            if (!scope) {
              return NextResponse.json({
                error: `Scope '${updateData.scope}' not found in subdomain '${updateData.subdomain}'`
              }, { status: 400 })
            }
          }
        }
      }
    }

    // SECURITY: Verify user has access to the existing entry's domain
    if (session.user.role !== 'SUPER_USER' && session.user.role !== 'LEAD_CONSULTANT') {
      const domainValidation = await validateUserDomainAccess(
        session.user.id,
        existingEntry.domain!,
        session.user.role
      )

      if (!domainValidation.isValid) {
        return NextResponse.json({
          error: domainValidation.error || 'Access denied to this entry\'s domain'
        }, { status: 403 })
      }
    }

    // Update the entry
    const updatedEntry = await prisma.histData.update({
      where: { id: entryId },
      data: {
        ...(updateData.hours !== undefined && { workingHours: updateData.hours }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(updateData.domain !== undefined && { domain: updateData.domain }),
        ...(updateData.subdomain !== undefined && { 
          subdomain: updateData.subdomain,
          client: updateData.subdomain // Update client field to match subdomain
        }),
        ...(updateData.scope !== undefined && { scope: updateData.scope }),
        updatedAt: new Date()
      }
    })

    console.log(`Entry ${entryId} updated by user: ${session.user.username}`)

    return NextResponse.json({
      id: updatedEntry.id,
      consultant: updatedEntry.consultant,
      domain: updatedEntry.domain,
      subdomain: updatedEntry.subdomain,
      scope: updatedEntry.scope,
      hours: updatedEntry.workingHours,
      notes: updatedEntry.notes,
      date: `${updatedEntry.year}-${updatedEntry.monthNo.toString().padStart(2, '0')}-${updatedEntry.day.toString().padStart(2, '0')}`,
      updatedAt: updatedEntry.updatedAt
    })

  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/entries/[id] - Delete specific entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entryId = parseInt(id)

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 })
    }

    // Find the existing entry
    const existingEntry = await prisma.histData.findUnique({
      where: { id: entryId }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // SECURITY: Verify user owns this entry or is admin
    if (existingEntry.consultant !== session.user.username && 
        session.user.role !== 'SUPER_USER' && 
        session.user.role !== 'LEAD_CONSULTANT') {
      return NextResponse.json({ error: 'Access denied to this entry' }, { status: 403 })
    }

    // SECURITY: Verify user has access to the entry's domain
    if (session.user.role !== 'SUPER_USER' && session.user.role !== 'LEAD_CONSULTANT') {
      const domainValidation = await validateUserDomainAccess(
        session.user.id,
        existingEntry.domain!,
        session.user.role
      )

      if (!domainValidation.isValid) {
        return NextResponse.json({
          error: domainValidation.error || 'Access denied to this entry\'s domain'
        }, { status: 403 })
      }
    }

    // Delete the entry
    await prisma.histData.delete({
      where: { id: entryId }
    })

    console.log(`Entry ${entryId} deleted by user: ${session.user.username}`)

    return NextResponse.json({
      message: 'Entry deleted successfully',
      deletedId: entryId
    })

  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}