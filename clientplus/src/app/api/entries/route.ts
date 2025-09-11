// src/app/api/entries/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validateUserDomainEntries } from '@/lib/domainValidation'

// Validation schema for entry data
const entrySchema = z.object({
  domainName: z.string().min(1, 'Domain is required'),
  subdomainName: z.string().min(1, 'Subdomain is required'),
  scopeName: z.string().min(1, 'Scope is required'),
  hours: z.number().min(0.25, 'Hours must be at least 0.25').max(24, 'Hours cannot exceed 24'),
  notes: z.string().min(1, 'Notes are required')
})

const entriesSchema = z.object({
  entries: z.array(entrySchema).min(1, 'At least one entry is required')
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body structure
    const validationResult = entriesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid entry data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { entries } = validationResult.data
    
    console.log(`Processing ${entries.length} entries for user: ${session.user.username}`)

    // SECURITY: Validate user has access to all domains in the entries
    const domainValidation = await validateUserDomainEntries(
      session.user.id,
      entries.map(e => ({ domain: e.domainName })),
      session.user.role
    )

    if (!domainValidation.isValid) {
      console.warn(`Domain access denied for user ${session.user.username}: ${domainValidation.error}`)
      return NextResponse.json({
        error: domainValidation.error || 'Access denied to one or more domains',
        allowedDomains: domainValidation.allowedDomains
      }, { status: 403 })
    }

    // Get current date components
    const now = new Date()
    const year = now.getFullYear()
    const monthNo = now.getMonth() + 1
    const day = now.getDate()
    const monthName = now.toLocaleString('default', { month: 'long' })

    // Process each entry
    const createdEntries = []
    
    for (const entry of entries) {
      try {
        // Additional validation: Verify domain/subdomain/scope relationships exist
        const domain = await prisma.domain.findFirst({
          where: { domainName: entry.domainName }
        })

        if (!domain) {
          return NextResponse.json({
            error: `Domain '${entry.domainName}' not found`
          }, { status: 400 })
        }

        const subdomain = await prisma.subdomain.findFirst({
          where: {
            subdomainName: entry.subdomainName,
            domainId: domain.id
          }
        })

        if (!subdomain) {
          return NextResponse.json({
            error: `Subdomain '${entry.subdomainName}' not found in domain '${entry.domainName}'`
          }, { status: 400 })
        }

        const scope = await prisma.scope.findFirst({
          where: {
            scopeName: entry.scopeName,
            subdomainId: subdomain.id
          }
        })

        if (!scope) {
          return NextResponse.json({
            error: `Scope '${entry.scopeName}' not found in subdomain '${entry.subdomainName}'`
          }, { status: 400 })
        }

        // Create the entry
        const histDataEntry = await prisma.histData.create({
          data: {
            source: 'WEB_ENTRY',
            year,
            monthNo,
            day,
            month: monthName,
            consultantId: parseInt(session.user.id) || 0,
            consultant: session.user.username!,
            client: entry.subdomainName, // Using subdomain as client name
            activityType: 'Regular',
            workingHours: entry.hours,
            notes: entry.notes,
            domain: entry.domainName,
            subdomain: entry.subdomainName,
            scope: entry.scopeName
          }
        })

        createdEntries.push(histDataEntry)
        
        console.log(`Created entry ID: ${histDataEntry.id} for domain: ${entry.domainName}`)
      } catch (entryError) {
        console.error('Error creating entry:', entryError)
        return NextResponse.json({
          error: `Failed to create entry for ${entry.domainName}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`
        }, { status: 500 })
      }
    }

    console.log(`Successfully created ${createdEntries.length} entries`)

    return NextResponse.json({
      message: `Successfully created ${createdEntries.length} entries`,
      entries: createdEntries.map(entry => ({
        id: entry.id,
        domain: entry.domain,
        subdomain: entry.subdomain,
        scope: entry.scope,
        hours: entry.workingHours,
        notes: entry.notes
      }))
    })

  } catch (error) {
    console.error('Error in entries API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}