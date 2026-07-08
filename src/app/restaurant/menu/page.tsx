import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import MenuEditor from './MenuEditor';

export const dynamic = 'force-dynamic';

export default async function RestaurantMenuPage() {
  // 1. Authenticate user
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Fetch categories with items
  const [categories, restaurant] = await Promise.all([
    db.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          orderBy: { name: 'asc' },
        },
      },
    }),
    db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { currency: true },
    }),
  ]);

  if (!restaurant) {
    redirect('/login');
  }

  // Format data for component
  const formattedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    sortOrder: cat.sortOrder,
    items: cat.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,
    })),
  }));

  return (
    <MenuEditor
      initialCategories={formattedCategories}
      restaurantId={restaurantId}
      currency={restaurant.currency}
    />
  );
}
