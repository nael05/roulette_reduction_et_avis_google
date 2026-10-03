import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      // Supprimer un seul client
      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', clientId);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Client supprimé" });
    } else {
      // Tout supprimer
      // Pour contourner les restrictions de Supabase sur les delete sans filtre (qui bloquent parfois par sécurité), 
      // on utilise un filtre toujours vrai qui ne pose pas de problème de type UUID.
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
