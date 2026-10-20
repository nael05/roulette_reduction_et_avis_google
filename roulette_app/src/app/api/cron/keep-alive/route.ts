import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Empêche la mise en cache de cette route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Vérification optionnelle d'un token secret si passé en Authorization header ou query param
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('key');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Effectue une petite lecture dans la table 'clients' pour garder PostgreSQL actif
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Erreur Supabase keep-alive:', error);
      return NextResponse.json({ 
        status: 'warning', 
        message: 'Erreur sur la table clients, mais le serveur Supabase a répondu', 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase keep-alive réussi !',
      timestamp: new Date().toISOString(),
      rows: data ? data.length : 0
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message || 'Erreur interne'
    }, { status: 500 });
  }
}
