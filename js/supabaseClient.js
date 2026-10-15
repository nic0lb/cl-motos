// ==========================================
// CONFIGURAÇÃO DO CLIENTE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://viblfvxzvgsbqfzqbcqx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vohTebF6MMwKHJn9e_QUGA_-bkDgDfA';

// Inicializa o cliente global do Supabase via CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);