import { createClient } from '@supabase/supabase-js'

// GANTI URL DI BAWAH INI DENGAN PROJECT URL SUPABASE ANDA
const supabaseUrl = 'https://qrxjpbvvqsbtgbferkua.supabase.co';
const supabaseKey = 'sb_publishable_LV3DB5RFYOEWFMVOmFh1vA_J3JBPwne'

export const supabase = createClient(supabaseUrl, supabaseKey)
