import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: promotions, error } = await supabaseAdmin
      .from('promotions')
      .select('id, text_content')
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const decodedPromos = promotions.map((p: any) => {
      const parts = p.text_content.split('||');
      if (parts.length >= 5) {
        // prob||color||isLost||condition||text
        const prob = parseFloat(parts[0]);
        if (!isNaN(prob)) {
          return { ...p, probability: prob, color: parts[1], isLost: parts[2] === '1', condition: parts[3], text_content: parts.slice(4).join('||') };
        }
      } else if (parts.length === 4) {
        // prob||color||isLost||text
        const prob = parseFloat(parts[0]);
        if (!isNaN(prob)) {
          return { ...p, probability: prob, color: parts[1], isLost: parts[2] === '1', condition: '', text_content: parts.slice(3).join('||') };
        }
      } else if (parts.length >= 3) {
        // prob||color||text
        const prob = parseFloat(parts[0]);
        if (!isNaN(prob)) {
          const text = parts.slice(2).join('||');
          const isLost = text.toLowerCase().includes('perdu');
          return { ...p, probability: prob, color: parts[1], isLost: isLost, condition: '', text_content: text };
        }
      } else if (parts.length === 2) {
        const prob = parseFloat(parts[0]);
        if (!isNaN(prob)) {
          const text = parts.slice(1).join('||');
          const isLost = text.toLowerCase().includes('perdu');
          return { ...p, probability: prob, text_content: text, isLost: isLost, condition: '' };
        }
      }
      return { ...p, probability: null, isLost: false, condition: '' };
    });

    return NextResponse.json({ promotions: decodedPromos });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { promotions } = await request.json();
    
    const encodedPromos = promotions.map((p: any) => ({
      text_content: `${p.probability !== undefined ? p.probability : (100 / promotions.length)}||${p.color || '#00F0FF'}||${p.isLost ? '1' : '0'}||${p.condition || ''}||${p.text_content}`
    }));

    const { error: deleteError } = await supabaseAdmin
      .from('promotions')
      .delete()
      .neq('id', -1);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('promotions')
      .insert(encodedPromos);

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT promotions error:', error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
