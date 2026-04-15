import { categorizeFoodItem, computeLiveCategory } from './src/lib/smartSegregation';

function testDecay() {
  console.log("== 🍚 Testing High Risk Food (Rice at Room Temp, 30°C) ==");
  let timeStr = new Date().toISOString();
  
  // We'll simulate checking it at hour=0, 2, 4, 6, 8, 10
  for (let hours = 0; hours <= 10; hours += 2) {
    // Fake the 'timePrepared' by going backwards
    const preparedTime = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    
    // Simulate what the background job calls:
    const live = computeLiveCategory(preparedTime, 'room-temp', 30, 'rice', 'categorized');
    
    console.log(`Hour ${hours.toString().padStart(2, ' ')}: Score = ${live.safetyScore.toString().padStart(3, ' ')} | Category = ${live.category.padEnd(20)} | Reason = ${live.reason}`);
  }

  console.log("\n== 🍎 Testing Low Risk Food (Fruits Refrigerated, 4°C) ==");
  // Simulate checking it at hour=0, 24, 48, 72
  for (let hours = 0; hours <= 72; hours += 24) {
    const preparedTime = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const live = computeLiveCategory(preparedTime, 'refrigerated', 4, 'fruits', 'categorized');
    
    console.log(`Hour ${hours.toString().padStart(2, ' ')}: Score = ${live.safetyScore.toString().padStart(3, ' ')} | Category = ${live.category.padEnd(20)} | Reason = ${live.reason}`);
  }
}

testDecay();
