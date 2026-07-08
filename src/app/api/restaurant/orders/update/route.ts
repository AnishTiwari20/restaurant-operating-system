import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ message: 'Missing orderId or status parameter.' }, { status: 400 });
    }

    const validStatuses = ['RECEIVED', 'PREPARING', 'SERVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status value.' }, { status: 400 });
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({
      message: 'Order status updated successfully.',
      orderId: order.id,
      status: order.status,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
