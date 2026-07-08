import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable,
    } = body;

    if (!restaurantId || !categoryId || !name || price === undefined) {
      return NextResponse.json({ message: 'Missing required dish parameters.' }, { status: 400 });
    }

    const dish = await db.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name: name.toString().trim(),
        description: description ? description.toString().trim() : null,
        price: parseFloat(price) || 0,
        imageUrl: imageUrl ? imageUrl.toString().trim() : null,
        isAvailable: isAvailable !== false,
      },
    });

    return NextResponse.json({
      message: 'Dish created successfully.',
      dish: {
        id: dish.id,
        name: dish.name,
        description: dish.description || '',
        price: dish.price,
        imageUrl: dish.imageUrl || '',
        isAvailable: dish.isAvailable,
        categoryId: dish.categoryId,
      },
    });
  } catch (error: any) {
    console.error('Error creating dish:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
