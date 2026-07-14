import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumberStr = searchParams.get('orderId');
    const slug = searchParams.get('slug');

    if (!orderNumberStr || !slug) {
      return NextResponse.json({ message: 'Missing orderId or slug parameter.' }, { status: 400 });
    }

    const orderNumber = parseInt(orderNumberStr, 10);
    if (isNaN(orderNumber)) {
      return NextResponse.json({ message: 'Invalid orderId format.' }, { status: 400 });
    }

    // Find the restaurant first to get the correct tenant scoping
    const restaurant = await db.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
    }

    // Retrieve order status
    const order = await db.order.findFirst({
      where: {
        orderNumber,
        restaurantId: restaurant.id,
      },
      select: {
        status: true,
        paymentStatus: true,
        preparationTime: true,
        preparingAt: true,
        servedAt: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
      status: order.status,
      paymentStatus: order.paymentStatus,
      preparationTime: order.preparationTime,
      preparingAt: order.preparingAt ? order.preparingAt.toISOString() : null,
      servedAt: order.servedAt ? order.servedAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching order status:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
