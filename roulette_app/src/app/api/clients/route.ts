import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdmin as checkIsAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, wonPrize, isAdmin, condition } = await request.json();

    if (!firstName || !lastName || !email || !wonPrize) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }
    
    // Verifier la sécurité de manière stricte côté serveur
    let isRequestAdmin = false;
    if (isAdmin) {
      isRequestAdmin = await checkIsAdmin();
    }

    const finalPrize = isRequestAdmin ? `[VALIDATED]${wonPrize}` : wonPrize;

    const { data: client, error: dbError } = await supabaseAdmin
      .from('clients')
      .upsert(
        { first_name: firstName, last_name: lastName, email, won_prize: finalPrize, used: false },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (dbError) {
      console.error(dbError);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde.' }, { status: 500 });
    }

    const clientId = client.id;

    if (isRequestAdmin) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${clientId}`;
      const conditionHtml = condition ? `<p style="font-size: 14px; color: #555; margin-top: 15px; font-style: italic;"><strong>Conditions d'utilisation :</strong> ${condition}</p>` : '';

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY!,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Clean Wash & Co', email: 'nael.morellon@ynov.com' },
          to: [{ email, name: `${firstName} ${lastName}` }],
          subject: `Félicitations ! Voici votre cadeau : ${wonPrize} 🎉`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #0A0E27; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #FF006E;">Bravo ${firstName} !</h1>
              <p style="font-size: 18px;">Vous avez fait tourner la roue magique et vous avez gagné :</p>
              <div style="background-color: #00F0FF; color: #0A0E27; font-size: 24px; font-weight: bold; padding: 15px; border-radius: 10px; margin: 20px 0;">
                ${wonPrize}
              </div>
              <p>Voici le QR Code à présenter au comptoir pour réclamer votre cadeau :</p>
              <img src="${qrCodeUrl}" alt="Votre QR Code" style="margin: 20px 0; border: 4px solid #0A0E27; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);" />
              ${conditionHtml}
              <p style="font-size: 12px; color: #888; margin-top: 30px;">Ce QR code est unique et n'est valable qu'une seule fois. Veuillez le conserver précieusement.</p>
            </div>
          `
        })
      });

      if (!brevoResponse.ok) {
        const errorText = await brevoResponse.text();
        console.error('Erreur Brevo:', errorText);
      }
    }

    return NextResponse.json({ success: true, clientId });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
