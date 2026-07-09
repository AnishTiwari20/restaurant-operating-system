import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import CheckoutPageClient from './CheckoutPageClient';

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { restaurantSlug } = await params;

  // 1. Validate customer cookies
  const cookieStore = await cookies();
  const customerName = cookieStore.get('customer_name')?.value;
  const customerMobile = cookieStore.get('customer_mobile')?.value;
  const customerTableId = cookieStore.get('customer_table_id')?.value;
  const customerTableNumber = cookieStore.get('customer_table_number')?.value;

  if (!customerName || !customerTableId) {
    redirect(`/r/${restaurantSlug}/menu`);
  }

  // 2. Fetch restaurant settings and active details
  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      settings: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const taxPercentage = restaurant.settings?.taxPercentage ?? 5.0;
  const rawPaymentMethods = restaurant.settings?.paymentMethods ?? 'UPI,COUNTER';
  const paymentMethods = rawPaymentMethods.split(',').map((m) => m.trim());

  return (
    <CheckoutPageClient
      restaurantName={restaurant.name}
      restaurantSlug={restaurantSlug}
      restaurantId={restaurant.id}
      tableId={customerTableId}
      tableNumber={customerTableNumber || 'Unknown'}
      customerName={customerName}
      customerMobile={customerMobile || ''}
      currency={restaurant.currency}
      taxPercentage={taxPercentage}
      paymentMethods={paymentMethods}
    />
  );
}
