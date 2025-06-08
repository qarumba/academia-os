/**
 * Interactive LangFuse UI Test
 * Clicks through the interface to reveal LangFuse configuration
 */

const puppeteer = require('puppeteer');

async function testLangFuseInteraction() {
  console.log('🚀 Starting Interactive LangFuse UI Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--no-sandbox'],
    devtools: false
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    // Load the application
    console.log('📱 Loading AcademiaOS...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-screenshots/01-loaded.png', fullPage: true });
    
    // Wait a moment for the UI to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 1: Check if "Show Advanced Options" button exists and click it
    console.log('🔍 Looking for "Show Advanced Options" button...');
    
    const advancedButton = await page.$('button:has-text("Show Advanced Options")') || 
                          await page.$x('//button[contains(text(), "Show Advanced Options")]') ||
                          await page.$x('//button[contains(text(), "Advanced")]');
    
    if (advancedButton.length > 0) {
      console.log('✅ Found Advanced Options button');
      await advancedButton[0].click();
      console.log('🖱️ Clicked Advanced Options button');
      
      // Wait for advanced options to appear
      await new Promise(resolve => setTimeout(resolve, 1500));
      await page.screenshot({ path: 'test-screenshots/02-advanced-opened.png', fullPage: true });
      
      // Check if LangFuse options are now visible
      const langfuseElements = await page.evaluate(() => {
        const elements = [];
        const bodyText = document.body.textContent;
        
        if (bodyText.includes('LangFuse')) {
          elements.push('✅ LangFuse text found');
        }
        if (bodyText.includes('Observatory')) {
          elements.push('✅ Observatory text found');
        }
        if (bodyText.includes('self-hosted')) {
          elements.push('✅ Self-hosted text found');
        }
        
        // Look for switch components (LangFuse enable switch)
        const switches = document.querySelectorAll('.ant-switch');
        elements.push(`🔘 Switch components: ${switches.length}`);
        
        // Look for any new input fields
        const inputs = document.querySelectorAll('input');
        elements.push(`📝 Total input fields: ${inputs.length}`);
        
        return elements;
      });
      
      console.log('🔍 After opening advanced options:');
      langfuseElements.forEach(element => console.log(`  ${element}`));
      
      // Try to find and enable LangFuse switch
      console.log('\n🔍 Looking for LangFuse enable switch...');
      
      const langfuseSwitch = await page.$('.ant-switch') || 
                            await page.$x('//button[@role="switch"]');
      
      if (langfuseSwitch && (langfuseSwitch.length > 0 || langfuseSwitch.click)) {
        console.log('✅ Found LangFuse switch');
        
        const switchToClick = langfuseSwitch.length ? langfuseSwitch[0] : langfuseSwitch;
        await switchToClick.click();
        console.log('🖱️ Clicked LangFuse enable switch');
        
        // Wait for LangFuse fields to appear
        await new Promise(resolve => setTimeout(resolve, 1500));
        await page.screenshot({ path: 'test-screenshots/03-langfuse-enabled.png', fullPage: true });
        
        // Check what appeared
        const langfuseFields = await page.evaluate(() => {
          const fields = [];
          const bodyText = document.body.textContent;
          
          if (bodyText.includes('localhost:3030')) {
            fields.push('✅ Default LangFuse host URL visible');
          }
          if (bodyText.includes('pk-lf-')) {
            fields.push('✅ Public key placeholder visible');
          }
          if (bodyText.includes('sk-lf-')) {
            fields.push('✅ Secret key placeholder visible');
          }
          if (bodyText.includes('Privacy & Security')) {
            fields.push('✅ Privacy notice visible');
          }
          
          return fields;
        });
        
        console.log('🔍 LangFuse configuration fields:');
        langfuseFields.forEach(field => console.log(`  ${field}`));
        
        // Final comprehensive screenshot
        await page.screenshot({ path: 'test-screenshots/04-final-with-langfuse.png', fullPage: true });
        
      } else {
        console.log('⚠️ LangFuse switch not found');
      }
      
    } else {
      console.log('⚠️ Advanced Options button not found');
      
      // Take screenshot to see what's actually there
      await page.screenshot({ path: 'test-screenshots/02-no-advanced-button.png', fullPage: true });
      
      // List all visible buttons
      const allButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, .ant-btn'));
        return buttons
          .filter(btn => btn.offsetWidth > 0 && btn.offsetHeight > 0)
          .map(btn => btn.textContent?.trim())
          .filter(text => text && text.length > 0);
      });
      
      console.log('🔘 All visible buttons:');
      allButtons.forEach(btn => console.log(`  "${btn}"`));
    }
    
    // Test server endpoints again
    console.log('\n🔌 Testing LangFuse server endpoints...');
    
    try {
      const healthTest = await page.evaluate(async () => {
        const resp = await fetch('http://localhost:3001/api/langfuse/health');
        const data = await resp.json();
        return { status: resp.status, data };
      });
      
      console.log('🏥 Health endpoint:', healthTest.status, healthTest.data?.status || 'No status');
      
      const metricsTest = await page.evaluate(async () => {
        const resp = await fetch('http://localhost:3001/api/langfuse/model-metrics');
        const data = await resp.json();
        return { status: resp.status, dataLength: data?.data?.length || 0 };
      });
      
      console.log('📊 Metrics endpoint:', metricsTest.status, `${metricsTest.dataLength} metrics`);
      
    } catch (error) {
      console.log('⚠️ Server endpoint test failed:', error.message);
    }
    
    console.log('\n✅ Interactive LangFuse UI test completed!');
    console.log('📸 Check test-screenshots/ for visual verification');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error-interactive.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testLangFuseInteraction().catch(console.error);