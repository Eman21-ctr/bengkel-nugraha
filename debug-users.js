
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://lppqlzrzmiyefcggnwlx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcHFsenJ6bWl5ZWZjZ2dud2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDEwOTcsImV4cCI6MjA4NDExNzA5N30.Dy-uhtH7uGGOLXB9N-AU3X3dgFU_scuNbrJNStpolVs'
);

async function checkUsers() {
    console.log('Checking profiles...');
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) console.error('Error profiles:', error);
    else console.log('Profiles found:', profiles);
}

checkUsers();
