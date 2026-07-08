import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantSlug = searchParams.get('restaurantSlug');
    const mobile = searchParams.get('mobile');

    if (!restaurantSlug || !mobile) {
      return NextResponse.json(
        { message: 'Missing restaurant slug or mobile number.' },
        { status: 400 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
    }

    const orders = await db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        customerMobile: mobile,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items,
      })),
    });
  } catch (error: any) {
    console.error('Customer Orders Error:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve orders.', error: error.message },
      { status: 500 }
    );
  }
}
