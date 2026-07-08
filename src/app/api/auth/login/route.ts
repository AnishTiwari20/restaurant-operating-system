import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, setSession, SessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // 1. Find User by Email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // 2. Validate Password
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // 3. Create Session User Payload
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      restaurantId: user.restaurantId,
    };

    // 4. Check if Restaurant is active (if restaurant user)
    if (user.restaurantId) {
      const restaurant = await db.restaurant.findUnique({
        where: { id: user.restaurantId },
      });
      if (!restaurant || !restaurant.isActive) {
        return NextResponse.json({ message: 'Account is suspended. Please contact admin.' }, { status: 403 });
      }
    }

    // 5. Save session cookie
    await setSession(sessionUser);

    // 6. Return response with redirect route
    let redirectUrl = '/restaurant/dashboard';
    if (user.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin/dashboard';
    }

    return NextResponse.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      redirectUrl,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 });
  }
}
