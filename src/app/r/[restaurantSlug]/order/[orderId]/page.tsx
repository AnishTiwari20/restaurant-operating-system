import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import OrderTrackingClient from './OrderTrackingClient';

interface Props {
  params: Promise<{
    restaurantSlug: string;
    orderId: string;
  }>;
}

export default async function OrderTrackingPage({ params }: Props) {
  const { restaurantSlug, orderId } = await params;

  // 1. Fetch order details from database
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      restaurant: true,
      items: true,
    },
  });

  if (!order || order.restaurant.slug !== restaurantSlug) {
    notFound();
  }

  // Format the items list
  const formattedItems = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  return (
    <OrderTrackingClient
      restaurantName={order.restaurant.name}
      restaurantSlug={restaurantSlug}
      orderId={orderId}
      orderNumber={order.orderNumber}
      tableNumber={order.table.number}
      customerName={order.customerName}
      initialStatus={order.status}
      initialPaymentStatus={order.paymentStatus}
      items={formattedItems}
      subtotal={order.totalAmount - order.taxAmount}
      taxAmount={order.taxAmount}
      grandTotal={order.totalAmount}
      currency={order.restaurant.currency}
      createdAt={order.createdAt.toISOString()}
      specialInstructions={order.specialInstructions || ''}
      initialPreparationTime={order.preparationTime || 0}
      initialPreparingAt={order.preparingAt ? order.preparingAt.toISOString() : null}
      initialServedAt={order.servedAt ? order.servedAt.toISOString() : null}
    />
  );
}
