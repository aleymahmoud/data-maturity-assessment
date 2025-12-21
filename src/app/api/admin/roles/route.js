import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';

export async function GET(request) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' }
    });

    // Format roles for frontend
    const formattedRoles = roles.map(role => ({
      id: role.id,
      title: role.title,
      description: role.description,
      dimensions: role.dimensions ? JSON.parse(role.dimensions) : [],
      createdAt: role.createdAt
    }));

    return NextResponse.json({
      success: true,
      roles: formattedRoles
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch roles'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, title, description, dimensions } = body;

    if (!id || !title) {
      return NextResponse.json({
        success: false,
        error: 'Role ID and title are required'
      }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        id,
        title,
        description: description || null,
        dimensions: dimensions ? JSON.stringify(dimensions) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role: newRole
    });

  } catch (error) {
    console.error('Error creating role:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'A role with this ID already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create role'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, description, dimensions } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Role ID is required'
      }, { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description,
        dimensions: dimensions ? JSON.stringify(dimensions) : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: updatedRole
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update role'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Role ID is required'
      }, { status: 400 });
    }

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete role'
    }, { status: 500 });
  }
}
