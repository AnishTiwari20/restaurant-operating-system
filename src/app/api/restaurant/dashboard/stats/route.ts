import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getSession();
    if (!session || !session.restaurantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const restaurantId = session.restaurantId;

    // 2. Parse date range query params
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    if (!startStr || !endStr) {
      return NextResponse.json({ message: 'Missing startDate or endDate parameters' }, { status: 400 });
    }

    // Set time boundaries
    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endStr);
    endDate.setHours(23, 59, 59, 999);

    // 3. Query all PAID orders within this date range
    const orders = await db.order.findMany({
      where: {
        restaurantId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        table: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Calculate date-scoped metrics
    const totalOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // Aggregate popular dishes
    const dishMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    orders.forEach((order) => {
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
      .slice(0, 5); // top 5 dishes

    // Format orders for the UI list
    const formattedOrders = orders.map((o) => ({
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

    return NextResponse.json({
      metrics: {
        totalOrdersCount,
        totalRevenue,
        averageOrderValue,
      },
      popularDishes,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats API:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
