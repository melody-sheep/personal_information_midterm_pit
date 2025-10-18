import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bbfllwqnypzyzaygpjva.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZmxsd3FueXB6eXpheWdwanZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODE0NDQsImV4cCI6MjA3NTc1NzQ0NH0.flJxLzjv6UeWkfZJ_CcekrA5f97COjeX0df5RtWI9jQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)