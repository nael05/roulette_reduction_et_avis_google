import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const correctPassword = process.env.ADMIN_PASSWORD || "cleanwash2024";
    
    if (password === correctPassword) {
      const secret = process.env.ADMIN_SECRET || 'fallback_admin_secret_12345!';

      const cookieStore = await cookies();
      cookieStore.set({
        name: 'admin_token',
        value: secret,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
