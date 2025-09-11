// src/app/api/entries/exceptional/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validateUserDomainEntries } from '@/lib/domainValidation'

// Validation schema for exceptional entry data
const exceptionalEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  domainName: z.string().min(1, 'Domain is required'),
  subdomainName: z.string().min(1, 'Subdomain is required'),
  scopeName: z.string().min(1, 'Scope is required'),
  hours: z.number().min(0.25, 'Hours must be at least 0.25').max(24, 'Hours cannot exceed 24'),
  notes: z.string().min(1, 'Notes are required')
})

const exceptionalEntriesSchema = z.object({
  entries: z.array(exceptionalEntrySchema).min(1, 'At least one entry is required')
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body structure
    const validationResult = exceptionalEntriesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid exceptional entry data',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { entries } = validationResult.data
    
    console.log(`Processing ${entries.length} exceptional entries for user: ${session.user.username}`)

    // SECURITY: Validate user has access to all domains in the entries
    const domainValidation = await validateUserDomainEntries(
      session.user.id,
      entries.map(e => ({ domain: e.domainName })),
      session.user.role
    )

    if (!domainValidation.isValid) {
      console.warn(`Domain access denied for exceptional entries - user ${session.user.username}: ${domainValidation.error}`)
      return NextResponse.json({
        error: domainValidation.error || 'Access denied to one or more domains',
        allowedDomains: domainValidation.allowedDomains
      }, { status: 403 })
    }

    // Process each exceptional entry
    const createdEntries = []
    
    for (const entry of entries) {
      try {
        // Parse the date
        const entryDate = new Date(entry.date)
        const year = entryDate.getFullYear()
        const monthNo = entryDate.getMonth() + 1
        const day = entryDate.getDate()
        const monthName = entryDate.toLocaleString('default', { month: 'long' })

        // Validate date is not in the future
        const today = new Date()
        if (entryDate > today) {
          return NextResponse.json({
            error: `Cannot create entries for future dates. Entry date: ${entry.date}`
          }, { status: 400 })
        }

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

        // Check for duplicate entries on the same date
        const existingEntry = await prisma.histData.findFirst({
          where: {
            consultant: session.user.username!,
            year,
            monthNo,
            day,
            domain: entry.domainName,
            subdomain: entry.subdomainName,
            scope: entry.scopeName
          }
        })

        if (existingEntry) {
          return NextResponse.json({
            error: `Entry already exists for ${entry.date} with domain '${entry.domainName}', subdomain '${entry.subdomainName}', and scope '${entry.scopeName}'`
          }, { status: 409 })
        }

        // Create the exceptional entry
        const histDataEntry = await prisma.histData.create({
          data: {
            source: 'EXCEPTIONAL_ENTRY',
            year,
            monthNo,
            day,
            month: monthName,
            consultantId: parseInt(session.user.id) || 0,
            consultant: session.user.username!,
            client: entry.subdomainName, // Using subdomain as client name
            activityType: 'Exceptional',
            workingHours: entry.hours,
            notes: entry.notes,
            domain: entry.domainName,
            subdomain: entry.subdomainName,
            scope: entry.scopeName
          }
        })

        createdEntries.push(histDataEntry)
        
        console.log(`Created exceptional entry ID: ${histDataEntry.id} for date: ${entry.date}, domain: ${entry.domainName}`)
      } catch (entryError) {
        console.error('Error creating exceptional entry:', entryError)
        return NextResponse.json({
          error: `Failed to create exceptional entry for ${entry.date}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`
        }, { status: 500 })
      }
    }

    console.log(`Successfully created ${createdEntries.length} exceptional entries`)

    return NextResponse.json({
      message: `Successfully created ${createdEntries.length} exceptional entries`,
      entries: createdEntries.map(entry => ({
        id: entry.id,
        date: `${entry.year}-${entry.monthNo.toString().padStart(2, '0')}-${entry.day.toString().padStart(2, '0')}`,
        domain: entry.domain,
        subdomain: entry.subdomain,
        scope: entry.scope,
        hours: entry.workingHours,
        notes: entry.notes
      }))
    })

  } catch (error) {
    console.error('Error in exceptional entries API:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}