import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { orderId, status, paymentStatus } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Missing orderId parameter.' }, { status: 400 });
    }

    const dataToUpdate: any = {};

    if (status) {
      const validStatuses = ['RECEIVED', 'PREPARING', 'SERVED', 'FAILED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: 'Invalid status value.' }, { status: 400 });
      }
      dataToUpdate.status = status;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['PENDING', 'PENDING_VERIFICATION', 'PAID', 'FAILED'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json({ message: 'Invalid payment status value.' }, { status: 400 });
      }
      dataToUpdate.paymentStatus = paymentStatus;
    }

    // Run updates in a transaction to keep Payment table in sync
    const order = await db.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: dataToUpdate,
      });

      if (paymentStatus) {
        // Find corresponding payment and update it
        const payment = await tx.payment.findFirst({
          where: { orderId },
        });

        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: paymentStatus === 'PAID' ? 'SUCCESS' : 'FAILED',
              gatewayResponse: JSON.stringify({
                message: `Payment status updated manually to ${paymentStatus}.`,
                timestamp: new Date().toISOString(),
              }),
            },
          });
        }
      }

      return updatedOrder;
    });

    return NextResponse.json({
      message: 'Order updated successfully.',
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
