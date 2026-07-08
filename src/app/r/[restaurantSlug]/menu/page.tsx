import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import MenuBrowser from './MenuBrowser';

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default async function CustomerMenuPage({ params }: Props) {
  const { restaurantSlug } = await params;

  // 1. Validate customer cookies
  const cookieStore = await cookies();
  const customerName = cookieStore.get('customer_name')?.value;
  const customerTableId = cookieStore.get('customer_table_id')?.value;
  const customerTableNumber = cookieStore.get('customer_table_number')?.value;

  // If no customer details, we don't know who is ordering or what table they are at.
  // We should redirect them to a helper page or ask them to scan the QR code.
  if (!customerName || !customerTableId) {
    // Find any table for this restaurant to redirect to as a fallback, or show scan prompt
    const restaurant = await db.restaurant.findUnique({
      where: { slug: restaurantSlug },
      include: { tables: { take: 1 } },
    });

    if (!restaurant) notFound();

    const fallbackTable = restaurant.tables[0];
    if (fallbackTable) {
      redirect(`/r/${restaurantSlug}/t/${fallbackTable.id}`);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-amber-500 mb-2">Scan QR Code</h1>
          <p className="text-zinc-400 mb-6">
            Please scan the QR code on your table to access the restaurant menu.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch restaurant data with categories and menu items
  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      settings: true,
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            orderBy: { name: 'asc' },
          },
        },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  // Formatting categories and items for the browser
  const menuData = restaurant.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: cat.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    })),
  }));

  const taxPercentage = restaurant.settings?.taxPercentage ?? 5.0;

  return (
    <MenuBrowser
      restaurantName={restaurant.name}
      restaurantSlug={restaurantSlug}
      tableNumber={customerTableNumber || 'Unknown'}
      customerName={customerName}
      menuData={menuData}
      currency={restaurant.currency}
      taxPercentage={taxPercentage}
    />
  );
}
