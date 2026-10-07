import { cookies } from 'next/headers';

export async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET || 'fallback_admin_secret_12345!';
  return token === secret;
}
