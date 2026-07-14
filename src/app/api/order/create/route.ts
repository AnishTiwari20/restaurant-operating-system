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
      amount,
      taxAmount,
      specialInstructions,
    } = body;

    // 1. Validations
    if (!restaurantSlug || !tableId || !customerName || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: 'Missing required order fields.' }, { status: 400 });
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
      // Create the order with status RECEIVED and paymentStatus PENDING_VERIFICATION
      const order = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: restaurant.id,
          tableId: table.id,
          customerName,
          customerMobile: customerMobile || '',
          status: 'RECEIVED',
          paymentStatus: 'PENDING_VERIFICATION', // Waiting for manual merchant verification
          paymentMethod,
          taxAmount,
          totalAmount: amount,
          specialInstructions: specialInstructions || '',
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

      // Generate a mock txn reference for manual tracking
      const txnRef = `MANUAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create the payment record with PENDING status
      await tx.payment.create({
        data: {
          orderId: order.id,
          transactionId: txnRef,
          amount,
          paymentMethod,
          status: 'PENDING',
          gatewayResponse: JSON.stringify({
            message: 'Manual transfer payment verification pending.',
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return order;
    });

    return NextResponse.json({
      message: 'Order created successfully. Pending verification.',
      orderId: result.id,
      orderNumber: result.orderNumber,
    });
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { message: 'Internal server error.', error: error.message },
      { status: 500 }
    );
  }
}
