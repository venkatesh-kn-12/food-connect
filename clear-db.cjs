// clear-db.cjs
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envString = fs.readFileSync('.env', 'utf8');
const lines = envString.split('\n');
const getVal = (key) => lines.find(l => l.startsWith(key))?.split('=')[1]?.trim()?.replace(/"/g, '')?.replace(/'/g, '');

const supabaseUrl = getVal('VITE_SUPABASE_URL');
const supabaseKey = getVal('VITE_SUPABASE_PUBLISHABLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDb() {
  console.log("Clearing distributions...");
  let { error: err1 } = await supabase
    .from('distributions')
    .delete()
    .not('id', 'is', null); 
    
  if (err1) {
    console.error("Error clearing distributions:", err1.message);
  } else {
    console.log("Distributions cleared.");
  }

  console.log("Clearing food_items...");
  let { error: err2 } = await supabase
    .from('food_items')
    .delete()
    .not('id', 'is', null); 
    
  if (err2) {
    console.error("Error clearing food_items:", err2.message);
  } else {
    console.log("Food items cleared.");
  }
}

clearDb();
