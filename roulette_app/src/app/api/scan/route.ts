import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { clientId } = await request.json();

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (error || !client) {
      return NextResponse.json({ error: "QR Code Invalide ou Client introuvable." }, { status: 404 });
    }

    if (client.used) {
      return NextResponse.json({ error: "⚠️ ATTENTION : Cette promotion a DÉJÀ été utilisée !" }, { status: 400 });
    }

    await supabaseAdmin
      .from('clients')
      .update({ used: true })
      .eq('id', clientId);

    return NextResponse.json({ success: true, client });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
