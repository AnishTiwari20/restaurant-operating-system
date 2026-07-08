import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { orderId, assignedWaiter } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Missing orderId parameter.' }, { status: 400 });
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: { assignedWaiter: assignedWaiter || '' },
    });

    return NextResponse.json({
      message: 'Waiter updated successfully.',
      orderId: order.id,
      assignedWaiter: order.assignedWaiter,
    });
  } catch (error: any) {
    console.error('Error updating waiter:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
