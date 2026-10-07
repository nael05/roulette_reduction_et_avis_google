import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const parsedClients = clients.map((c: any) => {
      const isValidated = c.won_prize.startsWith('[VALIDATED]');
      return {
        ...c,
        won_prize: c.won_prize.replace('[VALIDATED]', ''),
        is_validated: isValidated
      };
    });

    return NextResponse.json({ clients: parsedClients });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', clientId);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Client supprimé" });
    } else {
      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .not('id', 'is', null);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Historique vidé" });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
