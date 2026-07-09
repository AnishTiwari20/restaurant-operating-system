import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function RestaurantSettingsPage() {
  // 1. Authenticate user
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Fetch restaurant along with settings
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      settings: true,
    },
  });

  if (!restaurant) {
    redirect('/login');
  }

  // Formatting settings data
  const settingsData = {
    name: restaurant.name,
    logoUrl: restaurant.logoUrl || '',
    address: restaurant.address,
    phone: restaurant.phone,
    gstNumber: restaurant.gstNumber || '',
    businessHrs: restaurant.businessHrs || '',
    currency: restaurant.currency,
    taxPercentage: restaurant.settings?.taxPercentage ?? 5.0,
    paymentMethods: restaurant.settings?.paymentMethods ?? 'UPI,COUNTER',
    upiId: restaurant.settings?.upiId || '',
    upiQrUrl: restaurant.settings?.upiQrUrl || '',
  };

  return (
    <SettingsForm
      initialSettings={settingsData}
      restaurantId={restaurantId}
    />
  );
}
