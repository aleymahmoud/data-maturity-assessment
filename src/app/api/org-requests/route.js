import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type,
      organizationName,
      organizationSize,
      contactName,
      contactEmail,
      contactPhone,
      jobTitle,
      industry,
      country,
      message
    } = body;

    // Validate required fields
    if (!type || !['dma', 'consultation'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request type. Must be "dma" or "consultation"'
      }, { status: 400 });
    }

    if (!contactName || !contactEmail) {
      return NextResponse.json({
        success: false,
        error: 'Contact name and email are required'
      }, { status: 400 });
    }

    if (!organizationName) {
      return NextResponse.json({
        success: false,
        error: 'Organization name is required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Create the request
    const newRequest = await prisma.organizationRequest.create({
      data: {
        type,
        organizationName,
        organizationSize: organizationSize || null,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        jobTitle: jobTitle || null,
        industry: industry || null,
        country: country || null,
        message: message || null,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      requestId: newRequest.id
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit request. Please try again.'
    }, { status: 500 });
  }
}
