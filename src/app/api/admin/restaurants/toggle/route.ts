import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, isActive } = await req.json();

    if (!id || isActive === undefined) {
      return NextResponse.json({ message: 'Missing restaurant ID or isActive parameter.' }, { status: 400 });
    }

    const restaurant = await db.restaurant.update({
      where: { id },
      data: { isActive: isActive === true },
    });

    return NextResponse.json({
      message: 'Restaurant activation status updated.',
      id: restaurant.id,
      isActive: restaurant.isActive,
    });
  } catch (error: any) {
    console.error('Error toggling restaurant status:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
