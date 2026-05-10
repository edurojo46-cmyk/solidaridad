const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://spplofkotgvumfkeltsr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcGxvZmtvdGd2dW1ma2VsdHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDg3NDUsImV4cCI6MjA5MjM4NDc0NX0.GsPBPi0RbZBansH-9hBWW4iufUJBnXj89d-31nOmHM4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Checking intenciones...");
    const { data, error } = await supabase.from('intenciones').select('*').limit(5);
    console.log("Data:", data);
    console.log("Error:", error);
    
    console.log("Trying to insert...");
    const { data: d2, error: e2 } = await supabase.from('intenciones').insert({ text: 'Test DB', user_name: 'test' }).select();
    console.log("Insert Data:", d2);
    console.log("Insert Error:", e2);
}
check();
