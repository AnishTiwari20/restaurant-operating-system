import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import OrdersBoard from './OrdersBoard';

export const dynamic = 'force-dynamic';

export default async function RestaurantOrdersPage() {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Fetch initial active orders (Received or Preparing)
  const initialOrders = await db.order.findMany({
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

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
  });

  const currency = restaurant?.currency || 'INR';

  // Format database orders to clean JSON structure
  const formattedOrders = initialOrders.map((order) => ({
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

  return (
    <OrdersBoard
      initialOrders={formattedOrders}
      restaurantId={restaurantId}
      currency={currency}
    />
  );
}
