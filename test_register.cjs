const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qrxjpbvvqsbtgbferkua.supabase.co';
const supabaseKey = 'sb_publishable_LV3DB5RFYOEWFMVOmFh1vA_J3JBPwne';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegister() {
  const ts = Date.now();
  console.log('Registering user...');
  const { data, error } = await supabase.auth.signUp({
    email: `test${ts}@akurat.id`,
    password: 'Password123!',
    options: {
      data: {
        username: `testuser${ts}`,
        nama: 'Test User',
        faskes: 'RS Test',
        wa: '08123456789'
      }
    }
  });
  console.log('Register data:', data);
  if (error) console.error('Register error:', error);
}
testRegister();
