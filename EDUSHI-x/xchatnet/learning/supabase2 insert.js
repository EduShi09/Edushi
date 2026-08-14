const SUPABASE_URL = "https://sxrdpcfyvmicjqzzwjqv.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_NapVtLJzaIpxmvrcY4TT7A_D1ll1tfp";
// Initialize Supabase
const { createClient } = window.supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Insert Data
const { data, error } = await _supabase
  .from('talky_users')
  .insert([
    { 
      name: 'robin', 
      uid: '00000000-0000-0000-0000-000000000000', 
      key: '@@1122', 
      status: 'active', 
      last_seen: new Date().toISOString()
    }
  ]);

if (error) console.error('Error:', error);
else console.log('Data added successfully:', data);