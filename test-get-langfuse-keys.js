/**
 * LangFuse API Keys Setup Helper
 * Helps navigate to get the API keys from your LangFuse project
 */

const puppeteer = require('puppeteer');

async function getLangFuseKeys() {
  console.log('🔑 LangFuse API Keys Setup Helper');
  console.log('📋 Your project info:');
  console.log('  Project: academia-os');
  console.log('  Project ID: cmbmxw8q10006phznx484msvv');
  console.log('  Organization: AcademiaOS');
  console.log('  Org ID: cmbmxvzzc0001phzn9trezqzt');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('\n🌐 Opening LangFuse dashboard...');
    await page.goto('http://localhost:3030', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'test-screenshots/keys-1-dashboard.png', fullPage: true });
    
    console.log('\n📝 Instructions to get your API keys:');
    console.log('1. 🔐 Complete any initial setup/login if needed');
    console.log('2. 🏠 Navigate to your "academia-os" project');
    console.log('3. ⚙️  Go to Project Settings');
    console.log('4. 🔑 Find the "API Keys" section');
    console.log('5. 📋 Copy the Public Key (pk-lf-...)');
    console.log('6. 📋 Copy the Secret Key (sk-lf-...)');
    
    console.log('\n🔍 Look for:');
    console.log('  • Public Key: pk-lf-[random-string]');
    console.log('  • Secret Key: sk-lf-[random-string]');
    console.log('  • Host URL: http://localhost:3030');
    
    console.log('\n⏳ Browser will stay open for 60 seconds...');
    console.log('💡 Once you have the keys, we can update AcademiaOS!');
    
    // Wait for user to get the keys
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('\n✅ Time\'s up! Did you get the keys?');
    console.log('📝 When you have them, we\'ll update the configuration!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

getLangFuseKeys().catch(console.error);