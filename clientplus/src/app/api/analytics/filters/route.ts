// src/app/api/analytics/filters/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'SUPER_USER'
    const isLead = session.user.role === 'LEAD_CONSULTANT'
    
    // Get current filter selections from query params for universal filtering
    const { searchParams } = new URL(request.url)
    const selectedUsers = searchParams.get('users')?.split(',').filter(Boolean) || []
    const selectedUserTypes = searchParams.get('userTypes')?.split(',').filter(Boolean) || []
    const selectedActivityTypes = searchParams.get('activityTypes')?.split(',').filter(Boolean) || []
    const selectedDomains = searchParams.get('domains')?.split(',').filter(Boolean) || []
    const selectedSubdomains = searchParams.get('subdomains')?.split(',').filter(Boolean) || []
    const selectedScopes = searchParams.get('scopes')?.split(',').filter(Boolean) || []

    // Build base query conditions for hist_data filtering based on user permissions
    let baseConditions: any = {}
    
    if (!isAdmin) {
      // Non-admin users only see their own data or team data
      if (isLead) {
        // Lead consultants can see team data from same subdomains
        const userSubdomains = await prisma.histData.findMany({
          where: {
            consultant: session.user.username,
            subdomain: { not: null },
          },
          select: { domain: true, subdomain: true },
          distinct: ['domain', 'subdomain'],
        })

        if (userSubdomains.length > 0) {
          const subdomainConditions = userSubdomains.map(entry => ({
            domain: entry.domain,
            subdomain: entry.subdomain,
          }))
          baseConditions.OR = subdomainConditions
        } else {
          baseConditions.consultant = session.user.username
        }
      } else {
        baseConditions.consultant = session.user.username
      }
    }

    // Build dynamic filter conditions based on current selections
    let filterConditions: any = { ...baseConditions }
    
    // Only apply filters if selections exist, otherwise show all available data within base permissions
    if (selectedUsers.length > 0) {
      // Combine with base conditions properly
      if (baseConditions.OR) {
        // For lead consultants with OR conditions, we need to intersect with selected users
        filterConditions = {
          AND: [
            { OR: baseConditions.OR },
            { consultant: { in: selectedUsers } }
          ]
        }
      } else if (baseConditions.consultant) {
        // For regular consultants, only allow their own data
        filterConditions.consultant = baseConditions.consultant === selectedUsers[0] ? baseConditions.consultant : { in: [] }
      } else {
        filterConditions.consultant = { in: selectedUsers }
      }
    }
    
    // Add user type filtering that affects other filters
    // Note: Since histdata doesn't have a userType column, we still need to use user.role
    // but we should intersect with users who actually have histdata entries
    if (selectedUserTypes.length > 0) {
      // Get users matching selected types who actually have histdata entries
      const usersWithHistData = await prisma.histData.findMany({
        where: baseConditions, // Respect base permissions
        select: { consultant: true },
        distinct: ['consultant']
      })
      const consultantsWithData = usersWithHistData.map(h => h.consultant).filter(Boolean)
      
      const usersOfSelectedTypes = await prisma.user.findMany({
        where: {
          role: { in: selectedUserTypes },
          username: { in: consultantsWithData } // Only users who have histdata entries
        },
        select: { username: true }
      })
      const userNamesOfSelectedTypes = usersOfSelectedTypes.map(u => u.username)
      
      // Apply user type filter to consultant field
      if (filterConditions.consultant) {
        if (typeof filterConditions.consultant === 'string') {
          // Single consultant filter
          filterConditions.consultant = userNamesOfSelectedTypes.includes(filterConditions.consultant) 
            ? filterConditions.consultant 
            : { in: [] }
        } else if (filterConditions.consultant.in) {
          // Multiple consultant filter - intersect with selected types
          filterConditions.consultant = { 
            in: filterConditions.consultant.in.filter((c: string) => userNamesOfSelectedTypes.includes(c))
          }
        }
      } else if (filterConditions.AND) {
        // Handle complex AND conditions by adding user type constraint
        filterConditions.AND.push({ consultant: { in: userNamesOfSelectedTypes } })
      } else {
        filterConditions.consultant = { in: userNamesOfSelectedTypes }
      }
    }
    
    if (selectedActivityTypes.length > 0) {
      filterConditions.activityType = { in: selectedActivityTypes }
    }
    if (selectedDomains.length > 0) {
      filterConditions.domain = { in: selectedDomains }
    }
    if (selectedSubdomains.length > 0) {
      filterConditions.subdomain = { in: selectedSubdomains }
    }
    if (selectedScopes.length > 0) {
      filterConditions.scope = { in: selectedScopes }
    }

    const filterOptions: any = {
      userTypes: [],
      users: [],
      domains: [],
      subdomains: [],
      scopes: [],
      activityTypes: [],
    }

    // Get all available values from hist_data based on current filters
    const histDataQuery = {
      where: filterConditions,
      select: {
        consultant: true,
        domain: true,
        subdomain: true,
        scope: true,
        activityType: true,
      }
    }

    const filteredHistData = await prisma.histData.findMany(histDataQuery)
    
    // Get user details separately to avoid the Prisma relation issue
    const uniqueConsultants = Array.from(new Set(filteredHistData.map(entry => entry.consultant)))
    const userData = await prisma.user.findMany({
      where: {
        username: { in: uniqueConsultants }
      },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        consultantId: true,
      }
    })
    
    // Create a map for quick user lookup
    const userMap = new Map(userData.map(user => [user.username, user]))

    // Extract unique values for each filter
    const uniqueUsers = new Map()
    const uniqueUserTypes = new Set()
    const uniqueDomains = new Set()
    const uniqueSubdomains = new Map() // Use Map to store original casing
    const uniqueScopes = new Map() // Use Map to store original casing
    const uniqueActivityTypes = new Set()

    filteredHistData.forEach(entry => {
      // Users - get from userMap
      if (entry.consultant) {
        const user = userMap.get(entry.consultant)
        if (user) {
          uniqueUsers.set(user.username, user)
          
          // User Types (only for admin)
          if (isAdmin && user.role) {
            uniqueUserTypes.add(user.role)
          }
        }
      }
      
      // Domains
      if (entry.domain) uniqueDomains.add(entry.domain)
      
      // Subdomains (case-insensitive deduplication)
      if (entry.subdomain) {
        const lowerKey = entry.subdomain.toLowerCase()
        if (!uniqueSubdomains.has(lowerKey)) {
          uniqueSubdomains.set(lowerKey, entry.subdomain)
        }
      }
      
      // Scopes (case-insensitive deduplication)
      if (entry.scope) {
        const lowerKey = entry.scope.toLowerCase()
        if (!uniqueScopes.has(lowerKey)) {
          uniqueScopes.set(lowerKey, entry.scope)
        }
      }
      
      // Activity Types
      if (entry.activityType) uniqueActivityTypes.add(entry.activityType)
    })

    // Filter users by user types if selected (this happens after histdata filtering)
    if (selectedUserTypes.length > 0) {
      const filteredUsers = Array.from(uniqueUsers.values()).filter(user => 
        selectedUserTypes.includes(user.role)
      )
      uniqueUsers.clear()
      filteredUsers.forEach(user => uniqueUsers.set(user.username, user))
    }

    // Convert to filter option format
    filterOptions.users = Array.from(uniqueUsers.values())
      .sort((a, b) => parseInt(a.consultantId || '0') - parseInt(b.consultantId || '0'))
      .map(user => ({
        value: user.username,
        label: `${user.consultantId ? `[${user.consultantId}] ` : ''}${user.firstName || ''} ${user.lastName || ''} (${user.username})`.trim(),
        role: user.role,
        consultantId: user.consultantId,
      }))

    // User Types (only for admins)
    if (isAdmin) {
      const roleLabels = {
        'CONSULTANT': 'Consultant',
        'SUPPORTING': 'Supporting', 
        'LEAD_CONSULTANT': 'Lead Consultant',
        'SUPER_USER': 'Super User'
      }
      
      filterOptions.userTypes = Array.from(uniqueUserTypes)
        .filter(role => role && role !== 'SUPER_USER') // Exclude super users from filter
        .sort()
        .map(role => ({
          value: role,
          label: roleLabels[role as keyof typeof roleLabels] || role,
        }))
    }

    // Domains
    filterOptions.domains = Array.from(uniqueDomains)
      .filter(Boolean)
      .sort()
      .map(domain => ({
        value: domain,
        label: domain,
      }))

    // Subdomains (distinct names only, case-insensitive)
    filterOptions.subdomains = Array.from(uniqueSubdomains.values())
      .filter(Boolean)
      .sort()
      .map(subdomain => ({
        value: subdomain,
        label: subdomain, // Clean name without domain prefix
      }))

    // Scopes (distinct names only, case-insensitive)
    filterOptions.scopes = Array.from(uniqueScopes.values())
      .filter(Boolean)
      .sort()
      .map(scope => ({
        value: scope,
        label: scope, // Clean name without hierarchy prefix
      }))

    // Activity Types
    filterOptions.activityTypes = Array.from(uniqueActivityTypes)
      .filter(Boolean)
      .sort()
      .map(type => ({
        value: type,
        label: type,
      }))
    
    console.log('📋 ALL ACTIVITY TYPES IN DATABASE:', Array.from(uniqueActivityTypes).sort())

    console.log('=== ANALYTICS FILTERS DEBUG ===')
    console.log('User:', session.user.username, 'Role:', session.user.role)
    console.log('Selected filters:', {
      users: selectedUsers,
      userTypes: selectedUserTypes, 
      activityTypes: selectedActivityTypes,
      domains: selectedDomains,
      subdomains: selectedSubdomains,
      scopes: selectedScopes
    })
    console.log('Final filter conditions:', JSON.stringify(filterConditions, null, 2))
    console.log('Filtered histdata entries found:', filteredHistData.length)
    
    // Debug activity type filtering specifically
    if (selectedActivityTypes.length > 0) {
      console.log('🔍 ACTIVITY TYPE FILTERING DEBUG:')
      console.log('- Selected activity types:', selectedActivityTypes)
      const activityTypeEntries = filteredHistData.filter(entry => selectedActivityTypes.includes(entry.activityType || ''))
      console.log('- Entries matching activity types:', activityTypeEntries.length)
      console.log('- Sample entries:', activityTypeEntries.slice(0, 3).map(e => ({ 
        consultant: e.consultant, 
        activityType: e.activityType, 
        subdomain: e.subdomain,
        domain: e.domain 
      })))
      const uniqueSubdomainsFromActivity = [...new Set(activityTypeEntries.map(e => e.subdomain).filter(Boolean))]
      console.log('- Unique subdomains for this activity type:', uniqueSubdomainsFromActivity.slice(0, 10))
    }
    
    console.log('Returned filter options:', {
      users: filterOptions.users.length,
      userTypes: filterOptions.userTypes.length,
      domains: filterOptions.domains.length,
      subdomains: filterOptions.subdomains.length,
      scopes: filterOptions.scopes.length,
      activityTypes: filterOptions.activityTypes.length
    })
    if (selectedActivityTypes.length > 0) {
      console.log('Activity-filtered results:')
      console.log('- Users:', filterOptions.users.map(u => u.value))
      console.log('- Domains:', filterOptions.domains.map(d => d.value))
      console.log('- Subdomains (first 10):', filterOptions.subdomains.slice(0, 10).map(s => s.value))
    }
    
    return NextResponse.json(filterOptions)
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch filter options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}