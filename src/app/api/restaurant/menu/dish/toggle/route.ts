import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, isAvailable } = await req.json();

    if (!id || isAvailable === undefined) {
      return NextResponse.json({ message: 'Missing dish ID or isAvailable parameter.' }, { status: 400 });
    }

    const dish = await db.menuItem.update({
      where: { id },
      data: { isAvailable: isAvailable === true },
    });

    return NextResponse.json({
      message: 'Dish availability toggled successfully.',
      dish: {
        id: dish.id,
        isAvailable: dish.isAvailable,
      },
    });
  } catch (error: any) {
    console.error('Error toggling dish availability:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
