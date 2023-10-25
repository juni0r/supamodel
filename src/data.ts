import { createClient } from '@supabase/supabase-js'
import { Database } from '../supabase/types'

const supabase = createClient<Database>(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
)

supabase
  .from('records')
  .select('*')
  .eq('id', 6)
  .then(({ data, error }) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(data[0])
  })
