import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ipusfdckrmhsuxgcxtfo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  console.log('🔍 Inspecting Supabase Tables via REST API for All 18 Schema Tables...');

  const tables = [
    'reports',
    'risk_zones',
    'iot_sensors',
    'shelters',
    'resources',
    'hospitals',
    'evacuation_routes',
    'facilities',
    'facility_zones',
    'blueprint_sensors',
    'muster_hubs',
    'exit_routes',
    'facility_employees',
    'facility_incidents',
    'whatsapp_dispatches',
    'agent_logs',
    'xai_recommendations',
    'decision_knowledge',
    'simulations'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(5);
      if (error) {
        console.log(`❌ Table "${table}": Error -> ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table "${table}": Found ${data?.length || 0} rows.`);
        if (data && data.length > 0) {
          console.log(`   Sample item:`, JSON.stringify(data[0]).substring(0, 100));
        }
      }
    } catch (e: any) {
      console.log(`❌ Table "${table}": Exception -> ${e.message}`);
    }
  }
}

checkSupabase();
