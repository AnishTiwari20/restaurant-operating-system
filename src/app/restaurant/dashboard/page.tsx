import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function RestaurantDashboardPage() {
  // 1. Verify auth session
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Fetch lifetime revenue
  const lifetimeOrders = await db.order.findMany({
    where: {
      restaurantId,
      paymentStatus: 'PAID',
    },
    select: {
      totalAmount: true,
    },
  });
  const lifetimeRevenue = lifetimeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // 3. Today's initial boundaries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Fetch initial orders for Today
  const todayOrders = await db.order.findMany({
    where: {
      restaurantId,
      paymentStatus: 'PAID',
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      table: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
  });
  const currency = restaurant?.currency || 'INR';

  // 4. Calculate initial Today's metrics
  const totalOrdersCount = todayOrders.length;
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Aggregate popular dishes today
  const dishMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
  todayOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!dishMap[item.name]) {
        dishMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      dishMap[item.name].quantity += item.quantity;
      dishMap[item.name].revenue += item.price * item.quantity;
    });
  });

  const popularDishes = Object.values(dishMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Format orders today
  const formattedOrders = todayOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerMobile: o.customerMobile,
    tableNumber: o.table.number,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod || 'UPI',
    createdAt: o.createdAt.toISOString(),
    itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  const initialMetrics = {
    totalOrdersCount,
    totalRevenue,
    averageOrderValue,
  };

  return (
    <DashboardClient
      initialMetrics={initialMetrics}
      initialPopularDishes={popularDishes}
      initialOrders={formattedOrders}
      lifetimeRevenue={lifetimeRevenue}
      currency={currency}
    />
  );
}
