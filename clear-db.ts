import { supabase } from './src/integrations/supabase/client';

async function clearDb() {
  console.log("Clearing distributions...");
  // Delete all distributions
  let { error: err1 } = await supabase
    .from('distributions')
    .delete()
    .neq('id', 'dummy'); 
    
  if (err1) {
    console.error("Error clearing distributions:", err1.message);
  } else {
    console.log("Distributions cleared.");
  }

  console.log("Clearing food_items...");
  // Delete all food_items
  let { error: err2 } = await supabase
    .from('food_items')
    .delete()
    .neq('id', 'dummy'); 
    
  if (err2) {
    console.error("Error clearing food_items:", err2.message);
  } else {
    console.log("Food items cleared.");
  }
}

clearDb();
