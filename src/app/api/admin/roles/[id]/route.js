import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        title: role.title,
        description: role.description,
        dimensions: role.dimensions ? JSON.parse(role.dimensions) : [],
        createdAt: role.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch role'
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, dimensions } = body;

    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Role title is required'
      }, { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        title,
        description: description || null,
        dimensions: dimensions ? JSON.stringify(dimensions) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: updatedRole
    });

  } catch (error) {
    console.error('Error updating role:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update role'
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'Role not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete role'
    }, { status: 500 });
  }
}
