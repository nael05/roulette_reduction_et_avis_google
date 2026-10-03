import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email manquant' }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('used')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 });
    }

    // Si le client existe et que son offre N'EST PAS encore utilisée
    if (client && client.used === false) {
      return NextResponse.json({ canPlay: false });
    }

    // S'il n'existe pas, ou si son offre a été utilisée, il peut rejouer
    return NextResponse.json({ canPlay: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
