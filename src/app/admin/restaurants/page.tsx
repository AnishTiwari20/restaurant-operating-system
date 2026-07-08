import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import RestaurantsManager from './RestaurantsManager';

export const dynamic = 'force-dynamic';

export default async function AdminRestaurantsPage() {
  // 1. Authenticate superadmin
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // 2. Load all restaurants with owners details
  const restaurants = await db.restaurant.findMany({
    orderBy: { name: 'asc' },
    include: {
      users: {
        where: { role: 'RESTAURANT_OWNER' },
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const formattedRestaurants = restaurants.map((res) => ({
    id: res.id,
    slug: res.slug,
    name: res.name,
    address: res.address,
    phone: res.phone,
    gstNumber: res.gstNumber || '',
    businessHrs: res.businessHrs || '',
    currency: res.currency,
    isActive: res.isActive,
    ownerEmail: res.users[0]?.email || '',
    ownerName: res.users[0]?.name || '',
    ownerId: res.users[0]?.id || '',
  }));

  return <RestaurantsManager initialRestaurants={formattedRestaurants} />;
}
