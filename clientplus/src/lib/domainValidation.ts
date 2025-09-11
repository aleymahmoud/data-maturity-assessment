// src/lib/domainValidation.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface DomainValidationResult {
  isValid: boolean
  error?: string
  allowedDomains?: string[]
}

/**
 * Validates if a user has access to a specific domain
 */
export async function validateUserDomainAccess(
  userId: string, 
  domainName: string,
  userRole?: string
): Promise<DomainValidationResult> {
  try {
    // Super users and admins have access to all domains
    if (userRole === 'SUPER_USER' || userRole === 'LEAD_CONSULTANT') {
      return { isValid: true }
    }

    // Check if the domain exists first
    const domain = await prisma.domain.findFirst({
      where: { domainName }
    })

    if (!domain) {
      return {
        isValid: false,
        error: `Domain '${domainName}' does not exist`
      }
    }

    // Check if user has access to this domain
    const userDomain = await prisma.userDomain.findFirst({
      where: {
        userId: userId,
        domainId: domain.id
      }
    })

    if (!userDomain) {
      // Get user's allowed domains for better error message
      const allowedDomains = await getUserAllowedDomains(userId)
      
      return {
        isValid: false,
        error: `You don't have access to domain '${domainName}'. You are assigned to: ${allowedDomains.join(', ')}`,
        allowedDomains
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error validating domain access:', error)
    return {
      isValid: false,
      error: 'Error validating domain access'
    }
  }
}

/**
 * Gets all domains a user has access to
 */
export async function getUserAllowedDomains(userId: string): Promise<string[]> {
  try {
    const userDomains = await prisma.userDomain.findMany({
      where: { userId },
      include: {
        domain: {
          select: { domainName: true }
        }
      }
    })

    return userDomains.map(ud => ud.domain.domainName)
  } catch (error) {
    console.error('Error getting user allowed domains:', error)
    return []
  }
}

/**
 * Validates multiple domain entries for a user
 */
export async function validateUserDomainEntries(
  userId: string,
  entries: Array<{ domain: string }>,
  userRole?: string
): Promise<DomainValidationResult> {
  try {
    // Super users and admins can access all domains
    if (userRole === 'SUPER_USER' || userRole === 'LEAD_CONSULTANT') {
      return { isValid: true }
    }

    // Get unique domains from entries
    const uniqueDomains = [...new Set(entries.map(entry => entry.domain))]
    
    // Validate each domain
    for (const domainName of uniqueDomains) {
      const validation = await validateUserDomainAccess(userId, domainName, userRole)
      if (!validation.isValid) {
        return validation
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error validating domain entries:', error)
    return {
      isValid: false,
      error: 'Error validating domain entries'
    }
  }
}

/**
 * Middleware function to validate domain access in API routes
 */
export async function validateDomainAccessMiddleware(
  domainName: string
): Promise<{ error?: any; userId?: string; userRole?: string }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        error: new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const validation = await validateUserDomainAccess(
      session.user.id, 
      domainName, 
      session.user.role
    )

    if (!validation.isValid) {
      return {
        error: new Response(
          JSON.stringify({ 
            error: validation.error || 'Access denied to domain',
            allowedDomains: validation.allowedDomains 
          }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return { 
      userId: session.user.id, 
      userRole: session.user.role 
    }
  } catch (error) {
    console.error('Domain validation middleware error:', error)
    return {
      error: new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * Validates subdomain access based on domain permissions
 */
export async function validateSubdomainAccess(
  userId: string,
  subdomainId: number,
  userRole?: string
): Promise<DomainValidationResult> {
  try {
    // Super users and admins have access to all subdomains
    if (userRole === 'SUPER_USER' || userRole === 'LEAD_CONSULTANT') {
      return { isValid: true }
    }

    // Get subdomain with its domain
    const subdomain = await prisma.subdomain.findUnique({
      where: { id: subdomainId },
      include: {
        domain: {
          select: { id: true, domainName: true }
        }
      }
    })

    if (!subdomain) {
      return {
        isValid: false,
        error: `Subdomain with ID ${subdomainId} does not exist`
      }
    }

    // Check if user has access to the parent domain
    const userDomain = await prisma.userDomain.findFirst({
      where: {
        userId: userId,
        domainId: subdomain.domain.id
      }
    })

    if (!userDomain) {
      return {
        isValid: false,
        error: `You don't have access to domain '${subdomain.domain.domainName}' required for this subdomain`
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error validating subdomain access:', error)
    return {
      isValid: false,
      error: 'Error validating subdomain access'
    }
  }
}