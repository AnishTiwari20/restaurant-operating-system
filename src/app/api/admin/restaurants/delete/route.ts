import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Missing restaurant ID parameter.' }, { status: 400 });
    }

    // SQLite cascade delete will clean up tables, settings, categories, items, orders, etc.
    // because we defined cascade relations in our schema!
    await db.restaurant.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Restaurant tenant deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting restaurant tenant:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
