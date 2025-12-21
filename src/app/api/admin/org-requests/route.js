import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

export async function GET(request) {
  try {
    const requests = await prisma.organizationRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match the expected format in the admin page
    const transformedRequests = requests.map(req => ({
      id: req.id,
      type: req.type,
      organization_name: req.organizationName,
      organization_size: req.organizationSize,
      user_name: req.contactName,
      user_email: req.contactEmail,
      phone_number: req.contactPhone,
      job_title: req.jobTitle,
      industry: req.industry,
      country: req.country,
      message: req.message,
      status: req.status,
      created_at: req.createdAt,
      updated_at: req.updatedAt
    }));

    return NextResponse.json({
      success: true,
      requests: transformedRequests
    });

  } catch (error) {
    console.error('Error fetching organization requests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Request ID and status are required'
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'contacted', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status value'
      }, { status: 400 });
    }

    const updatedRequest = await prisma.organizationRequest.update({
      where: { id: requestId },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        updated_at: updatedRequest.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating request status:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Request not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update status'
    }, { status: 500 });
  }
}
