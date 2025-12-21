import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma.js'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const code = await prisma.assessmentCode.findUnique({
      where: { code: id }
    })

    if (!code) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    return NextResponse.json({
      code: {
        code: code.code,
        organization_name: code.organizationName,
        intended_recipient: code.intendedRecipient,
        expires_at: code.expiresAt,
        is_used: code.isUsed,
        usage_count: code.usageCount,
        assessment_type: code.assessmentType,
        question_list: code.questionList,
        created_at: code.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching assessment code:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment code' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if code exists first
    const existing = await prisma.assessmentCode.findUnique({
      where: { code: id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    // Handle different actions
    const { action } = body

    if (action === 'toggle_status') {
      // Handle activate/deactivate toggle
      // Since we don't have is_active column, we'll use isUsed as a workaround
      // However, the schema doesn't have an is_active field
      // For now, we'll just return success (this functionality may need schema update)
      const { active } = body

      // We can only mark as used/unused - isUsed field
      await prisma.assessmentCode.update({
        where: { code: id },
        data: {
          isUsed: !active  // If activating, set isUsed to false; if deactivating, set to true
        }
      })

      return NextResponse.json({
        message: `Assessment code ${active ? 'activated' : 'deactivated'} successfully`
      })
    } else {
      // Handle regular update
      const {
        organization_name,
        intended_recipient,
        expires_in_days,
        assessment_type = 'full',
        max_uses = 1
      } = body

      // Validate required fields for regular update
      if (!organization_name) {
        return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
      }

      // Calculate expiration date if expires_in_days is provided
      let expiresAt = null
      if (expires_in_days && expires_in_days > 0) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + parseInt(expires_in_days))
        expiresAt = expDate
      }

      // Get the current assessment type to check if it's changing
      const currentType = existing.assessmentType

      // Generate new question list if assessment type is changing
      let questionList = null
      if (currentType !== assessment_type) {
        // For now, use default question list based on type
        if (assessment_type === 'quick') {
          // Quick assessment - subset of questions
          questionList = JSON.stringify([
            'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
            'Q11', 'Q12', 'Q13', 'Q14', 'Q15'
          ])
        } else {
          // Full assessment - all questions
          questionList = JSON.stringify([
            'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
            'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20',
            'Q21', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29', 'Q30',
            'Q31', 'Q32', 'Q33', 'Q34', 'Q35'
          ])
        }
      }

      // Update the code
      const updateData = {
        organizationName: organization_name,
        intendedRecipient: intended_recipient || null,
        assessmentType: assessment_type
      }

      if (expiresAt) {
        updateData.expiresAt = expiresAt
      }

      if (questionList !== null) {
        updateData.questionList = questionList
      }

      await prisma.assessmentCode.update({
        where: { code: id },
        data: updateData
      })

      return NextResponse.json({
        message: 'Assessment code updated successfully',
        questionListUpdated: questionList !== null
      })
    }

  } catch (error) {
    console.error('Error updating assessment code:', error)
    return NextResponse.json({ error: 'Failed to update assessment code' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // Check if code exists and is not used
    const existing = await prisma.assessmentCode.findUnique({
      where: { code: id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Assessment code not found' }, { status: 404 })
    }

    if (existing.isUsed) {
      return NextResponse.json({ error: 'Cannot delete used assessment code' }, { status: 400 })
    }

    // Delete the code
    await prisma.assessmentCode.delete({
      where: { code: id }
    })

    return NextResponse.json({ message: 'Assessment code deleted successfully' })

  } catch (error) {
    console.error('Error deleting assessment code:', error)
    return NextResponse.json({ error: 'Failed to delete assessment code' }, { status: 500 })
  }
}
