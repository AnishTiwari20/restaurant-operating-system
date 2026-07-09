import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ message: 'Missing restaurantId parameter.' }, { status: 400 });
    }

    const orders = await db.order.findMany({
      where: {
        restaurantId,
        paymentStatus: {
          in: ['PAID', 'PENDING_VERIFICATION', 'PENDING'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        items: true,
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      tableNumber: order.table.number,
      status: order.status,
      paymentMethod: order.paymentMethod || 'Unknown',
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      assignedWaiter: order.assignedWaiter || '',
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('Error fetching merchant orders:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
