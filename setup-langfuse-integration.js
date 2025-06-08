/**
 * Automated LangFuse Integration Setup
 * Configures AcademiaOS with real LangFuse keys and tests the AI Observatory
 */

const puppeteer = require('puppeteer');

async function setupLangFuseIntegration() {
  console.log('🚀 Setting up LangFuse Integration with Real Keys...');
  
  // Your real LangFuse configuration
  const LANGFUSE_CONFIG = {
    host: 'http://localhost:3030',
    publicKey: 'pk-lf-b2a12baf-af76-44fe-8442-77dba8dcaed6',
    secretKey: 'sk-lf-646ee6de-810d-46f6-bbe5-0e1efc57c2bb'
  };
  
  console.log('🔑 Using configuration:');
  console.log(`  Host: ${LANGFUSE_CONFIG.host}`);
  console.log(`  Public Key: ${LANGFUSE_CONFIG.publicKey.substring(0, 20)}...`);
  console.log(`  Secret Key: ${LANGFUSE_CONFIG.secretKey.substring(0, 20)}...`);
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1500,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Step 1: Open AcademiaOS
    console.log('\n📱 Step 1: Opening AcademiaOS...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ path: 'test-screenshots/setup-1-academia-loaded.png', fullPage: true });
    
    // Step 2: Open Advanced Options
    console.log('\n⚙️ Step 2: Opening Advanced Options...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, .ant-btn'));
      const advancedBtn = buttons.find(btn => btn.textContent?.includes('Show Advanced Options'));
      if (advancedBtn) {
        advancedBtn.click();
        return true;
      }
      return false;
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-screenshots/setup-2-advanced-opened.png', fullPage: true });
    
    // Step 3: Enable LangFuse
    console.log('\n🔛 Step 3: Enabling LangFuse...');
    await page.evaluate(() => {
      const switches = document.querySelectorAll('.ant-switch');
      if (switches.length > 0) {
        // Find the LangFuse switch (should be the last one)
        const langfuseSwitch = switches[switches.length - 1];
        langfuseSwitch.click();
        return true;
      }
      return false;
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'test-screenshots/setup-3-langfuse-enabled.png', fullPage: true });
    
    // Step 4: Fill in the real LangFuse configuration
    console.log('\n📝 Step 4: Configuring with real API keys...');
    await page.evaluate((config) => {
      const inputs = document.querySelectorAll('input');
      let filled = 0;
      
      inputs.forEach(input => {
        const placeholder = input.placeholder;
        if (placeholder?.includes('localhost:3030')) {
          input.value = config.host;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        } else if (placeholder?.includes('pk-lf-')) {
          input.value = config.publicKey;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        } else if (placeholder?.includes('sk-lf-')) {
          input.value = config.secretKey;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        }
      });
      
      return filled;
    }, LANGFUSE_CONFIG);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-screenshots/setup-4-keys-configured.png', fullPage: true });
    
    // Step 5: Save the configuration
    console.log('\n💾 Step 5: Saving configuration...');
    await page.evaluate(() => {
      const saveButtons = Array.from(document.querySelectorAll('button'));
      const saveBtn = saveButtons.find(btn => 
        btn.textContent?.includes('Save Configuration') || 
        btn.textContent?.includes('Save')
      );
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'test-screenshots/setup-5-configuration-saved.png', fullPage: true });
    
    // Step 6: Look for AI Observatory button
    console.log('\n🔍 Step 6: Looking for AI Observatory button...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const observatoryFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, .ant-btn'));
      const observatoryBtn = buttons.find(btn => btn.textContent?.includes('AI Observatory'));
      return !!observatoryBtn;
    });
    
    if (observatoryFound) {
      console.log('✅ AI Observatory button found!');
      
      // Click the AI Observatory button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, .ant-btn'));
        const observatoryBtn = buttons.find(btn => btn.textContent?.includes('AI Observatory'));
        if (observatoryBtn) {
          observatoryBtn.click();
          return true;
        }
        return false;
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'test-screenshots/setup-6-ai-observatory-opened.png', fullPage: true });
      
      console.log('🎉 AI Observatory opened successfully!');
      
    } else {
      console.log('⚠️ AI Observatory button not found - configuration may need refresh');
    }
    
    // Step 7: Test the integration endpoints with real keys
    console.log('\n🧪 Step 7: Testing integration with real keys...');
    
    const endpointTests = await page.evaluate(async () => {
      const endpoints = [
        '/api/langfuse/health',
        '/api/langfuse/model-metrics',
        '/api/langfuse/academic-stats'
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:3001${endpoint}`);
          const data = await response.json();
          
          results.push({
            endpoint,
            status: response.status,
            ok: response.ok,
            message: data.status || data.message || 'OK'
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'Error',
            ok: false,
            message: error.message
          });
        }
      }
      
      return results;
    });
    
    console.log('\n📊 Integration Test Results:');
    endpointTests.forEach(test => {
      const statusIcon = test.ok ? '✅' : '❌';
      console.log(`  ${test.endpoint}: ${test.status} ${statusIcon}`);
      if (test.message) console.log(`    → ${test.message}`);
    });
    
    const successCount = endpointTests.filter(t => t.ok).length;
    const totalCount = endpointTests.length;
    
    console.log('\n🎯 Final Results:');
    console.log(`📊 Endpoints: ${successCount}/${totalCount} working`);
    console.log(`🔗 LangFuse UI: ${LANGFUSE_CONFIG.host}`);
    console.log(`🔗 AcademiaOS: http://localhost:3000`);
    
    if (observatoryFound) {
      console.log('✅ AI Observatory: Available and configured!');
    }
    
    console.log('\n🎊 LangFuse Integration Setup Complete!');
    console.log('📸 Screenshots saved showing the complete setup process');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/setup-error.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 15 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

setupLangFuseIntegration().catch(console.error);