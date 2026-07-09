import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      restaurantId,
      name,
      logoUrl,
      address,
      phone,
      gstNumber,
      businessHrs,
      currency,
      taxPercentage,
      paymentMethods,
      upiId,
      upiQrUrl,
    } = body;

    if (!restaurantId || !name || !address || !phone) {
      return NextResponse.json({ message: 'Missing required settings parameters.' }, { status: 400 });
    }

    // Update restaurant and settings in a single transaction
    await db.$transaction([
      db.restaurant.update({
        where: { id: restaurantId },
        data: {
          name,
          logoUrl: logoUrl || null,
          address,
          phone,
          gstNumber: gstNumber || null,
          businessHrs: businessHrs || null,
          currency,
        },
      }),
      db.restaurantSettings.update({
        where: { restaurantId },
        data: {
          taxPercentage: parseFloat(taxPercentage) || 0,
          paymentMethods,
          upiId: upiId || null,
          upiQrUrl: upiQrUrl || null,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Settings updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
