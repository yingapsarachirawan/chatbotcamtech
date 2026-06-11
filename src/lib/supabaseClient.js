import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xrloyjpmkcnumyglobtc.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG95anBta2NudW15Z2xvYnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTg1NDksImV4cCI6MjA5NjY3NDU0OX0.Inss64qgtoU3569yu0eUbh5CUumdFMSaI4kGwtMLRNQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);