import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      slug,
      address,
      phone,
      gstNumber,
      currency,
      ownerName,
      ownerEmail,
      password,
    } = body;

    // 1. Validations
    if (!name || !slug || !ownerName || !ownerEmail || !password) {
      return NextResponse.json({ message: 'Missing required onboarding parameters.' }, { status: 400 });
    }

    // 2. Check if slug exists
    const existingSlug = await db.restaurant.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return NextResponse.json({ message: 'Restaurant slug already exists.' }, { status: 400 });
    }

    // 3. Check if owner email exists
    const existingEmail = await db.user.findUnique({
      where: { email: ownerEmail },
    });
    if (existingEmail) {
      return NextResponse.json({ message: 'Email address is already in use.' }, { status: 400 });
    }

    // 4. Hash owner password
    const passwordHash = await hashPassword(password);

    // 5. Create Restaurant, Settings, and User in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          slug,
          address,
          phone,
          gstNumber: gstNumber || null,
          currency: currency || 'INR',
          isActive: true,
        },
      });

      // Create Settings
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          paymentMethods: 'UPI,CARDS,NETBANKING,WALLETS',
          taxPercentage: 5.0,
        },
      });

      // Create Owner User
      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          name: ownerName,
          role: 'RESTAURANT_OWNER',
          restaurantId: restaurant.id,
        },
      });

      return { restaurant, user };
    });

    return NextResponse.json({
      message: 'Restaurant onboarded successfully.',
      restaurant: {
        id: result.restaurant.id,
        slug: result.restaurant.slug,
        name: result.restaurant.name,
        address: result.restaurant.address,
        phone: result.restaurant.phone,
        gstNumber: result.restaurant.gstNumber || '',
        businessHrs: result.restaurant.businessHrs || '',
        currency: result.restaurant.currency,
        isActive: result.restaurant.isActive,
        ownerEmail: result.user.email,
        ownerName: result.user.name,
        ownerId: result.user.id,
      },
    });
  } catch (error: any) {
    console.error('Error onboarding restaurant:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
