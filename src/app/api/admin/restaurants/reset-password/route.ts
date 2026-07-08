import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { ownerId, password } = await req.json();

    if (!ownerId || !password) {
      return NextResponse.json({ message: 'Missing ownerId or new password.' }, { status: 400 });
    }

    if (password.toString().length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: ownerId },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: 'Password reset successfully.',
    });
  } catch (error: any) {
    console.error('Error resetting tenant password:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
