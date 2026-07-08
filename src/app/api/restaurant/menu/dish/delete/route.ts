import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Missing dish ID parameter.' }, { status: 400 });
    }

    await db.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Dish deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting dish:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
