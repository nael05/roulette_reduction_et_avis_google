import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { clientId, firstName, lastName, email, wonPrize, condition } = await request.json();

    if (!clientId || !firstName || !lastName || !email || !wonPrize) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Save validation status in DB
    const { error: dbError } = await supabaseAdmin
      .from('clients')
      .update({ won_prize: `[VALIDATED]${wonPrize.replace('[VALIDATED]', '')}` })
      .eq('id', clientId);

    if (dbError) {
      console.error(dbError);
      return NextResponse.json({ error: 'Erreur lors de la validation' }, { status: 500 });
    }

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
        subject: `Rappel : Voici votre cadeau : ${wonPrize} 🎉`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; text-align: center; color: #0A0E27; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF006E;">Bonjour ${firstName} !</h1>
            <p style="font-size: 18px;">Suite à votre demande, voici le rappel de votre cadeau gagné à la roulette :</p>
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
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
