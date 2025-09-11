// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/prisma'; // Uncomment when you have Prisma setup

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, profileImage } = body;

    // TODO: Update user in database
    // const updatedUser = await prisma.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     firstName,
    //     lastName,
    //     email,
    //     profileImage,
    //   },
    // });

    return NextResponse.json({ 
      success: true,
      user: {
        firstName,
        lastName,
        email,
        profileImage,
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
