const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qrxjpbvvqsbtgbferkua.supabase.co';
const supabaseKey = 'sb_publishable_LV3DB5RFYOEWFMVOmFh1vA_J3JBPwne';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles data:', data);
  if (error) console.error('Error:', error);
}
check();
