import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { restaurantId, number } = await req.json();

    if (!restaurantId || !number) {
      return NextResponse.json({ message: 'Missing restaurantId or table number.' }, { status: 400 });
    }

    // Check if table number already exists for this restaurant
    const existingTable = await db.table.findFirst({
      where: {
        restaurantId,
        number: number.toString(),
      },
    });

    if (existingTable) {
      return NextResponse.json({ message: 'Table number already exists.' }, { status: 400 });
    }

    const table = await db.table.create({
      data: {
        restaurantId,
        number: number.toString(),
      },
    });

    return NextResponse.json({
      message: 'Table created successfully.',
      table: {
        id: table.id,
        number: table.number,
        createdAt: table.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
