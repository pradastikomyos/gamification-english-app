import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvyvkyspbqcqcsgdvzjp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXZreXNwYnFjcWNzZ2R2empwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjUzNTEsImV4cCI6MjA2NjA0MTM1MX0.INWnez88XgQs4R5yo685k86_2A92auI_qgCFt3_FJIM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
