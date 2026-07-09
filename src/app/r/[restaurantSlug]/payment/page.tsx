import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import PaymentClient from './PaymentClient';

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
  searchParams: Promise<{
    method?: string;
  }>;
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const { restaurantSlug } = await params;
  const { method } = await searchParams;

  // 1. Validate customer session cookies
  const cookieStore = await cookies();
  const customerName = cookieStore.get('customer_name')?.value;
  const customerMobile = cookieStore.get('customer_mobile')?.value;
  const customerTableId = cookieStore.get('customer_table_id')?.value;
  const customerTableNumber = cookieStore.get('customer_table_number')?.value;

  if (!customerName || !customerTableId) {
    redirect(`/r/${restaurantSlug}/menu`);
  }

  // 2. Fetch restaurant details along with UPI settings
  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      settings: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  return (
    <PaymentClient
      restaurantSlug={restaurantSlug}
      restaurantName={restaurant.name}
      currency={restaurant.currency}
      taxPercentage={restaurant.settings?.taxPercentage ?? 5.0}
      upiId={restaurant.settings?.upiId || ''}
      upiQrUrl={restaurant.settings?.upiQrUrl || ''}
      paymentMethod={method || 'UPI'}
      customerName={customerName}
      customerMobile={customerMobile || ''}
      tableId={customerTableId}
      tableNumber={customerTableNumber || 'Unknown'}
    />
  );
}
