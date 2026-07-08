const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean up existing data to avoid conflicts
  console.log('Cleaning up existing data...');
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.restaurantSettings.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.restaurant.deleteMany({});

  console.log('Existing data cleared.');

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const ownerPasswordHash = await bcrypt.hash('owner123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  // 3. Create Super Admin user
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@restaurantos.com',
      passwordHash: adminPasswordHash,
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super Admin created:', superAdmin.email);

  // 4. Create Demo Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Cafe Delight',
      slug: 'cafe-delight',
      logoUrl: null,
      address: '123 Gourmet Street, Foodville',
      phone: '+1 555-0199',
      gstNumber: '29ABCDE1234F1Z5',
      businessHrs: '09:00 - 22:00',
      currency: 'INR',
    },
  });
  console.log('Demo Restaurant created:', restaurant.name, `(slug: ${restaurant.slug})`);

  // 5. Create Restaurant Settings
  await prisma.restaurantSettings.create({
    data: {
      restaurantId: restaurant.id,
      paymentMethods: 'UPI,CARDS,NETBANKING,WALLETS',
      taxPercentage: 5.0,
    },
  });
  console.log('Restaurant Settings created.');

  // 6. Create Restaurant Owner and Staff
  const owner = await prisma.user.create({
    data: {
      email: 'owner@cafedelight.com',
      passwordHash: ownerPasswordHash,
      name: 'John Doe (Owner)',
      role: 'RESTAURANT_OWNER',
      restaurantId: restaurant.id,
    },
  });
  console.log('Restaurant Owner created:', owner.email);

  const staff = await prisma.user.create({
    data: {
      email: 'staff@cafedelight.com',
      passwordHash: staffPasswordHash,
      name: 'Sarah Connor (Staff)',
      role: 'RESTAURANT_STAFF',
      restaurantId: restaurant.id,
    },
  });
  console.log('Restaurant Staff created:', staff.email);

  // 7. Create Tables
  const tables = [];
  const tableNumbers = ['1', '2', '3', '4', '5'];
  for (const num of tableNumbers) {
    const table = await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        number: num,
      },
    });
    tables.push(table);
  }
  console.log(`Created ${tables.length} tables.`);

  // 8. Create Menu Categories
  const categories = [
    { name: 'Beverages', sortOrder: 1 },
    { name: 'Appetizers', sortOrder: 2 },
    { name: 'Main Course', sortOrder: 3 },
    { name: 'Desserts', sortOrder: 4 },
  ];

  const dbCategories = [];
  for (const cat of categories) {
    const dbCat = await prisma.menuCategory.create({
      data: {
        restaurantId: restaurant.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });
    dbCategories.push(dbCat);
  }
  console.log(`Created ${dbCategories.length} categories.`);

  // Find category helper
  const getCatId = (name) => dbCategories.find(c => c.name === name).id;

  // 9. Create Menu Items (Dishes)
  const menuItems = [
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Beverages'),
      name: 'Fresh Mint Mojito',
      description: 'Refreshing blend of mint leaves, fresh lime juice, sugar, and sparkling soda served over crushed ice.',
      price: 180.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Beverages'),
      name: 'Iced Caramel Macchiato',
      description: 'Rich espresso poured over milk, ice, and vanilla syrup, topped with sweet caramel drizzle.',
      price: 220.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Beverages'),
      name: 'Mango Smoothie',
      description: 'Creamy blend of ripe Alphonso mangoes, Greek yogurt, and honey.',
      price: 190.0,
      isAvailable: false, // Disabled item to test visibility filters
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Appetizers'),
      name: 'Garlic Parmesan Fries',
      description: 'Crispy golden fries tossed in savory garlic butter, topped with grated parmesan cheese and fresh parsley.',
      price: 250.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Appetizers'),
      name: 'Crispy Veg Spring Rolls',
      description: 'Golden fried wrappers stuffed with seasoned shredded vegetables, served with sweet chili dipping sauce.',
      price: 280.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Main Course'),
      name: 'Truffle Mushroom Pasta',
      description: 'Fettuccine pasta in a velvety white sauce with wild mushrooms, infused with rich white truffle oil.',
      price: 550.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Main Course'),
      name: 'Gourmet Veggie Burger',
      description: 'House-made quinoa and black bean patty, melted cheddar cheese, crisp lettuce, tomatoes, and chef special sauce on a toasted brioche bun.',
      price: 450.0,
      isAvailable: true,
    },
    {
      restaurantId: restaurant.id,
      categoryId: getCatId('Desserts'),
      name: 'Molten Chocolate Lava Cake',
      description: 'Warm, rich chocolate cake with a gooey liquid chocolate center, served with a scoop of premium vanilla bean ice cream.',
      price: 320.0,
      isAvailable: true,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: item,
    });
  }
  console.log(`Created ${menuItems.length} menu items.`);

  console.log('Seeding complete! Database is ready to use.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
