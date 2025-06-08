/**
 * Final LangFuse UI Test with Proper Selectors
 * Tests the complete LangFuse integration workflow
 */

const puppeteer = require('puppeteer');

async function testLangFuseFinal() {
  console.log('🚀 Starting Final LangFuse UI Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    // Load application
    console.log('📱 Loading AcademiaOS...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-screenshots/step1-loaded.png', fullPage: true });
    
    // Wait for UI to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 1: Find and click "Show Advanced Options"
    console.log('🔍 Step 1: Looking for Advanced Options...');
    
    const advancedButtons = await page.$x('//button[contains(text(), "Show Advanced Options")]');
    
    if (advancedButtons.length > 0) {
      console.log('✅ Found "Show Advanced Options" button');
      await advancedButtons[0].click();
      console.log('🖱️ Clicked Advanced Options');
      
      // Wait for expansion
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'test-screenshots/step2-advanced-opened.png', fullPage: true });
      
      // Step 2: Look for LangFuse content
      console.log('\n🔍 Step 2: Checking for LangFuse content...');
      
      const langfuseContent = await page.evaluate(() => {
        const content = {
          hasLangFuse: document.body.textContent.includes('LangFuse'),
          hasObservatory: document.body.textContent.includes('Observatory'),
          hasSelfHosted: document.body.textContent.includes('self-hosted'),
          hasPrivacy: document.body.textContent.includes('Privacy'),
          switchCount: document.querySelectorAll('.ant-switch').length,
          inputCount: document.querySelectorAll('input').length
        };
        
        // Look for specific LangFuse-related text
        const langfuseElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent && el.textContent.includes('LangFuse'))
          .map(el => el.tagName + ': ' + el.textContent.substring(0, 100));
        
        content.langfuseElements = langfuseElements.slice(0, 5); // First 5 matches
        
        return content;
      });
      
      console.log(`🔍 LangFuse content analysis:`);
      console.log(`  Has "LangFuse": ${langfuseContent.hasLangFuse}`);
      console.log(`  Has "Observatory": ${langfuseContent.hasObservatory}`);
      console.log(`  Has "self-hosted": ${langfuseContent.hasSelfHosted}`);
      console.log(`  Has "Privacy": ${langfuseContent.hasPrivacy}`);
      console.log(`  Switch components: ${langfuseContent.switchCount}`);
      console.log(`  Input fields: ${langfuseContent.inputCount}`);
      
      if (langfuseContent.langfuseElements.length > 0) {
        console.log(`  LangFuse elements found:`);
        langfuseContent.langfuseElements.forEach(el => console.log(`    ${el}`));
      }
      
      // Step 3: Try to enable LangFuse if switch is found
      if (langfuseContent.switchCount > 0) {
        console.log('\n🔍 Step 3: Attempting to enable LangFuse...');
        
        // Find all switches and try to click the LangFuse one
        const switches = await page.$$('.ant-switch');
        
        if (switches.length > 0) {
          // Try clicking the first switch (likely the LangFuse one)
          console.log(`Found ${switches.length} switch(es), clicking the first one...`);
          await switches[0].click();
          
          // Wait for fields to appear
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.screenshot({ path: 'test-screenshots/step3-langfuse-enabled.png', fullPage: true });
          
          // Check what appeared after enabling
          const afterEnable = await page.evaluate(() => {
            const results = {
              hasHost: document.body.textContent.includes('localhost:3030'),
              hasPublicKey: document.body.textContent.includes('pk-lf-'),
              hasSecretKey: document.body.textContent.includes('sk-lf-'),
              hasPrivacyAlert: document.body.textContent.includes('Privacy & Security'),
              totalInputs: document.querySelectorAll('input').length
            };
            
            // Get all placeholder texts
            const placeholders = Array.from(document.querySelectorAll('input[placeholder]'))
              .map(input => input.placeholder)
              .filter(p => p && p.length > 0);
            
            results.placeholders = placeholders;
            
            return results;
          });
          
          console.log('\n🔍 After enabling LangFuse:');
          console.log(`  Has host URL: ${afterEnable.hasHost}`);
          console.log(`  Has public key field: ${afterEnable.hasPublicKey}`);
          console.log(`  Has secret key field: ${afterEnable.hasSecretKey}`);
          console.log(`  Has privacy alert: ${afterEnable.hasPrivacyAlert}`);
          console.log(`  Total inputs: ${afterEnable.totalInputs}`);
          
          if (afterEnable.placeholders.length > 0) {
            console.log('  Input placeholders:');
            afterEnable.placeholders.forEach(p => console.log(`    "${p}"`));
          }
          
          // Take final screenshot
          await page.screenshot({ path: 'test-screenshots/step4-final-state.png', fullPage: true });
          
        } else {
          console.log('⚠️ No switches found to click');
        }
      } else {
        console.log('⚠️ No switches found in advanced options');
      }
      
    } else {
      console.log('⚠️ "Show Advanced Options" button not found');
      
      // Show what buttons are actually available
      const availableButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, .ant-btn'))
          .filter(btn => btn.offsetWidth > 0 && btn.offsetHeight > 0)
          .map(btn => btn.textContent?.trim())
          .filter(text => text && text.length > 0);
      });
      
      console.log('Available buttons:');
      availableButtons.forEach(btn => console.log(`  "${btn}"`));
    }
    
    // Step 4: Test server endpoints
    console.log('\n🔍 Step 4: Testing LangFuse server endpoints...');
    
    const endpointTests = [
      { name: 'Health', url: '/api/langfuse/health' },
      { name: 'Metrics', url: '/api/langfuse/model-metrics' },
      { name: 'Academic Stats', url: '/api/langfuse/academic-stats' },
      { name: 'Test Connection', url: '/api/langfuse/test', method: 'POST' }
    ];
    
    for (const test of endpointTests) {
      try {
        const result = await page.evaluate(async (testConfig) => {
          const options = {
            method: testConfig.method || 'GET',
            headers: { 'Content-Type': 'application/json' }
          };
          
          if (testConfig.method === 'POST') {
            options.body = JSON.stringify({});
          }
          
          const response = await fetch(`http://localhost:3001${testConfig.url}`, options);
          const data = await response.json();
          
          return {
            status: response.status,
            ok: response.ok,
            data: data
          };
        }, test);
        
        console.log(`  ${test.name}: ${result.status} ${result.ok ? '✅' : '❌'}`);
        if (result.data && typeof result.data === 'object') {
          if (result.data.status) console.log(`    Status: ${result.data.status}`);
          if (result.data.message) console.log(`    Message: ${result.data.message}`);
          if (result.data.timeframe) console.log(`    Timeframe: ${result.data.timeframe}`);
        }
        
      } catch (error) {
        console.log(`  ${test.name}: Error - ${error.message}`);
      }
    }
    
    console.log('\n✅ Final LangFuse UI test completed successfully!');
    console.log('📸 Screenshots saved:');
    console.log('  - step1-loaded.png: Initial app load');
    console.log('  - step2-advanced-opened.png: Advanced options opened');
    console.log('  - step3-langfuse-enabled.png: LangFuse enabled');
    console.log('  - step4-final-state.png: Final configuration state');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error-final.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

testLangFuseFinal().catch(console.error);