import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge les variables d'environnement depuis .env.local ou .env s'ils existent
function loadEnv() {
  const envFiles = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env')
  ];

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
      break;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Variables Supabase introuvables ou invalides dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Envoi d'une requête keep-alive à Supabase...`);

  try {
    // 1. Tente une lecture légère sur la table 'clients'
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (error) {
      // Si la table n'existe pas ou erreur spécifique, on fait un appel REST de base
      console.warn(`⚠️ Requête table 'clients' : ${error.message}. Tentative d'un ping API général...`);
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });
      if (!res.ok && res.status !== 200) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      console.log(`✅ [${timestamp}] Ping API Supabase réussi ! Projet actif.`);
      return;
    }

    console.log(`✅ [${timestamp}] Supabase réveillé avec succès ! (${data ? data.length : 0} ligne lue)`);
  } catch (err) {
    console.error(`❌ [${timestamp}] Échec du keep-alive :`, err.message || err);
    process.exit(1);
  }
}

keepAlive();
