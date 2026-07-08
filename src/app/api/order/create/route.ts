import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      restaurantSlug,
      tableId,
      customerName,
      customerMobile,
      cartItems,
      paymentMethod,
      transactionId,
      amount,
      taxAmount,
      gatewayResponse,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    // 1. Validations
    if (!restaurantSlug || !tableId || !customerName || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: 'Missing required order fields.' }, { status: 400 });
    }

    // Cryptographic signature verification for Razorpay payments
    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json(
          { message: 'Payment verification failed. Invalid signature.' },
          { status: 400 }
        );
      }
    }

    // 2. Fetch Restaurant
    const restaurant = await db.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ message: 'Restaurant not found or inactive.' }, { status: 404 });
    }

    // 3. Fetch Table
    const table = await db.table.findFirst({
      where: {
        id: tableId,
        restaurantId: restaurant.id,
      },
    });

    if (!table) {
      return NextResponse.json({ message: 'Table not found for this restaurant.' }, { status: 404 });
    }

    // 4. Calculate Sequential Order Number for this Restaurant
    const maxOrder = await db.order.aggregate({
      where: { restaurantId: restaurant.id },
      _max: { orderNumber: true },
    });
    const orderNumber = (maxOrder._max.orderNumber ?? 0) + 1;

    // 5. Create Order & Payment in a Database Transaction
    const result = await db.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: restaurant.id,
          tableId: table.id,
          customerName,
          customerMobile: customerMobile || '',
          status: 'RECEIVED',
          paymentStatus: 'PAID',
          paymentMethod,
          taxAmount,
          totalAmount: amount,
          items: {
            create: cartItems.map((item: any) => ({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
      });

      // Create the payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          transactionId,
          amount,
          paymentMethod,
          status: 'SUCCESS',
          gatewayResponse,
        },
      });

      return order;
    });

    return NextResponse.json({
      message: 'Order created successfully.',
      orderId: result.id,
      orderNumber: result.orderNumber,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
