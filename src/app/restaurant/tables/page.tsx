import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import TablesManager from './TablesManager';

export const dynamic = 'force-dynamic';

export default async function RestaurantTablesPage() {
  // 1. Authenticate user
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Fetch tables and restaurant slug
  const [tables, restaurant] = await Promise.all([
    db.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    }),
    db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    }),
  ]);

  if (!restaurant) {
    redirect('/login');
  }

  const formattedTables = tables.map((table) => ({
    id: table.id,
    number: table.number,
    createdAt: table.createdAt.toISOString(),
  }));

  return (
    <TablesManager
      initialTables={formattedTables}
      restaurantId={restaurantId}
      restaurantSlug={restaurant.slug}
    />
  );
}
