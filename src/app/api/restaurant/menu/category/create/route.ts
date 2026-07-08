import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { restaurantId, name } = await req.json();

    if (!restaurantId || !name) {
      return NextResponse.json({ message: 'Missing restaurantId or category name.' }, { status: 400 });
    }

    // Check if category name already exists for this restaurant
    const existing = await db.menuCategory.findFirst({
      where: {
        restaurantId,
        name: name.toString().trim(),
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Category name already exists.' }, { status: 400 });
    }

    // Find the next sort order
    const maxSort = await db.menuCategory.aggregate({
      where: { restaurantId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const category = await db.menuCategory.create({
      data: {
        restaurantId,
        name: name.toString().trim(),
        sortOrder,
      },
    });

    return NextResponse.json({
      message: 'Category created successfully.',
      category: {
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
