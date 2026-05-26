const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://krlabcjbqxxybuyxxgmo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybGFiY2picXh4eWJ1eXh4Z21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjM3NzAsImV4cCI6MjA1NzE5OTc3MH0.Z73jK5T4TtuRTy_r4LTKGVW6sRbrx6PddDasBd-2cPQ'

const supabase = createClient(
   SUPABASE_URL,
   SUPABASE_KEY
)

module.exports = supabase