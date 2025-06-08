/**
 * Simple LangFuse UI Validation Test
 * Takes screenshots and validates key elements are present
 */

const puppeteer = require('puppeteer');

async function validateLangFuseUI() {
  console.log('🚀 Starting LangFuse UI Validation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 250,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    // Load the application
    console.log('📱 Loading AcademiaOS...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-screenshots/01-app-loaded.png', fullPage: true });
    console.log('✅ App loaded - screenshot saved');
    
    // Check what's visible on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Look for any configuration-related elements
    const configElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for form elements
      const forms = document.querySelectorAll('form, .ant-form');
      elements.push(`Forms found: ${forms.length}`);
      
      // Look for inputs
      const inputs = document.querySelectorAll('input');
      elements.push(`Inputs found: ${inputs.length}`);
      
      // Look for select elements
      const selects = document.querySelectorAll('.ant-select, select');
      elements.push(`Select elements found: ${selects.length}`);
      
      // Look for cards
      const cards = document.querySelectorAll('.ant-card');
      elements.push(`Cards found: ${cards.length}`);
      
      // Look for specific text content
      const hasModelConfig = document.body.textContent.includes('Model Configuration');
      const hasLangFuse = document.body.textContent.includes('LangFuse');
      const hasObservatory = document.body.textContent.includes('Observatory');
      const hasAnthropic = document.body.textContent.includes('Anthropic');
      
      elements.push(`Has "Model Configuration": ${hasModelConfig}`);
      elements.push(`Has "LangFuse": ${hasLangFuse}`);
      elements.push(`Has "Observatory": ${hasObservatory}`);
      elements.push(`Has "Anthropic": ${hasAnthropic}`);
      
      return elements;
    });
    
    console.log('🔍 Page analysis:');
    configElements.forEach(element => console.log(`  ${element}`));
    
    // Try to scroll down to see more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take another screenshot after scrolling
    await page.screenshot({ path: 'test-screenshots/02-after-scroll.png', fullPage: true });
    console.log('✅ Scrolled and captured full page');
    
    // Check for any buttons
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, .ant-btn'));
      return btns.map(btn => ({
        text: btn.textContent?.trim() || '',
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      })).filter(btn => btn.text.length > 0);
    });
    
    console.log('🔘 Buttons found:');
    buttons.forEach(btn => console.log(`  "${btn.text}" (visible: ${btn.visible})`));
    
    // Test server endpoints
    console.log('\n🔌 Testing LangFuse server endpoints...');
    
    const endpoints = [
      '/api/langfuse/health',
      '/api/langfuse/model-metrics',
      '/api/langfuse/academic-stats'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await page.evaluate(async (url) => {
          const resp = await fetch(`http://localhost:3001${url}`);
          return {
            status: resp.status,
            statusText: resp.statusText,
            ok: resp.ok
          };
        }, endpoint);
        
        console.log(`  ${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`  ${endpoint}: Error - ${error.message}`);
      }
    }
    
    // Check if we can find any advanced options or configuration
    const advancedElements = await page.evaluate(() => {
      const advanced = [];
      
      // Look for "Advanced" text
      if (document.body.textContent.includes('Advanced')) {
        advanced.push('Found "Advanced" text');
      }
      
      // Look for switch components
      const switches = document.querySelectorAll('.ant-switch');
      advanced.push(`Switch components: ${switches.length}`);
      
      // Look for password inputs
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      advanced.push(`Password inputs: ${passwordInputs.length}`);
      
      return advanced;
    });
    
    console.log('\n⚙️ Advanced features:');
    advancedElements.forEach(element => console.log(`  ${element}`));
    
    // Final screenshot
    await page.screenshot({ path: 'test-screenshots/03-final-state.png', fullPage: true });
    
    console.log('\n✅ LangFuse UI validation completed!');
    console.log('📸 Screenshots saved in test-screenshots/');
    console.log('🔍 Check the screenshots to verify UI integration');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

validateLangFuseUI().catch(console.error);