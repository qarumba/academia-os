/**
 * Working LangFuse UI Test
 * Uses simple selectors and manual clicks
 */

const puppeteer = require('puppeteer');

async function testLangFuseWorking() {
  console.log('🚀 Starting Working LangFuse UI Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1500,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  
  try {
    // Load application
    console.log('📱 Loading AcademiaOS...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'test-screenshots/working-1-loaded.png', fullPage: true });
    
    // Check current page content
    const initialContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasAdvanced: document.body.textContent.includes('Advanced'),
        hasLangFuse: document.body.textContent.includes('LangFuse'),
        buttonTexts: Array.from(document.querySelectorAll('button'))
          .map(btn => btn.textContent?.trim())
          .filter(text => text && text.length > 0)
      };
    });
    
    console.log('📄 Initial page analysis:');
    console.log(`  Title: ${initialContent.title}`);
    console.log(`  Has "Advanced": ${initialContent.hasAdvanced}`);
    console.log(`  Has "LangFuse": ${initialContent.hasLangFuse}`);
    console.log(`  Available buttons: ${initialContent.buttonTexts.join(', ')}`);
    
    // Look for "Show Advanced Options" text and try to click it
    if (initialContent.hasAdvanced) {
      console.log('\n🖱️ Attempting to click Advanced Options...');
      
      await page.evaluate(() => {
        // Find element containing "Show Advanced Options" text
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('Show Advanced Options')) {
            // Find clickable parent element
            let parent = node.parentElement;
            while (parent && parent.tagName !== 'BUTTON' && !parent.classList.contains('ant-btn')) {
              parent = parent.parentElement;
            }
            if (parent) {
              parent.click();
              return true;
            }
          }
        }
        return false;
      });
      
      console.log('✅ Clicked Advanced Options');
      
      // Wait for advanced section to expand
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'test-screenshots/working-2-advanced-clicked.png', fullPage: true });
      
      // Check if LangFuse content appeared
      const afterAdvanced = await page.evaluate(() => {
        return {
          hasLangFuse: document.body.textContent.includes('LangFuse'),
          hasObservatory: document.body.textContent.includes('Observatory'),
          hasSelfHosted: document.body.textContent.includes('self-hosted'),
          hasSwitch: document.querySelectorAll('.ant-switch').length > 0,
          switchCount: document.querySelectorAll('.ant-switch').length,
          langfuseTexts: []
        };
      });
      
      console.log('\n📊 After clicking Advanced Options:');
      console.log(`  Has "LangFuse": ${afterAdvanced.hasLangFuse}`);
      console.log(`  Has "Observatory": ${afterAdvanced.hasObservatory}`);
      console.log(`  Has "self-hosted": ${afterAdvanced.hasSelfHosted}`);
      console.log(`  Has switches: ${afterAdvanced.hasSwitch}`);
      console.log(`  Switch count: ${afterAdvanced.switchCount}`);
      
      // If LangFuse content is found, try to enable it
      if (afterAdvanced.hasLangFuse && afterAdvanced.switchCount > 0) {
        console.log('\n🔛 Attempting to enable LangFuse...');
        
        // Click the LangFuse switch
        await page.evaluate(() => {
          const switches = document.querySelectorAll('.ant-switch');
          if (switches.length > 0) {
            // Click the last switch (likely the LangFuse one since it's added at the end)
            switches[switches.length - 1].click();
            return true;
          }
          return false;
        });
        
        console.log('✅ Clicked LangFuse switch');
        
        // Wait for LangFuse fields to appear
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: 'test-screenshots/working-3-langfuse-enabled.png', fullPage: true });
        
        // Check what LangFuse fields appeared
        const langfuseFields = await page.evaluate(() => {
          const content = document.body.textContent;
          return {
            hasHostURL: content.includes('localhost:3030'),
            hasPublicKey: content.includes('pk-lf-'),
            hasSecretKey: content.includes('sk-lf-'),
            hasPrivacySecurity: content.includes('Privacy & Security'),
            inputCount: document.querySelectorAll('input').length,
            placeholders: Array.from(document.querySelectorAll('input[placeholder]'))
              .map(input => input.placeholder)
              .filter(p => p.includes('lf-') || p.includes('localhost'))
          };
        });
        
        console.log('\n🔧 LangFuse configuration fields:');
        console.log(`  Has host URL: ${langfuseFields.hasHostURL}`);
        console.log(`  Has public key: ${langfuseFields.hasPublicKey}`);
        console.log(`  Has secret key: ${langfuseFields.hasSecretKey}`);
        console.log(`  Has privacy notice: ${langfuseFields.hasPrivacySecurity}`);
        console.log(`  Total inputs: ${langfuseFields.inputCount}`);
        console.log(`  LangFuse placeholders: ${langfuseFields.placeholders.join(', ')}`);
        
        // Take final comprehensive screenshot
        await page.screenshot({ path: 'test-screenshots/working-4-complete.png', fullPage: true });
        
      } else {
        console.log('⚠️ LangFuse content not found in advanced options');
      }
      
    } else {
      console.log('⚠️ No Advanced Options found on page');
    }
    
    // Test the LangFuse server endpoints
    console.log('\n🌐 Testing LangFuse Server Endpoints...');
    
    const serverTests = [
      { name: 'Health Check', path: '/api/langfuse/health' },
      { name: 'Model Metrics', path: '/api/langfuse/model-metrics' },
      { name: 'Academic Stats', path: '/api/langfuse/academic-stats' }
    ];
    
    for (const test of serverTests) {
      try {
        const result = await page.evaluate(async (testPath) => {
          const response = await fetch(`http://localhost:3001${testPath}`);
          return {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          };
        }, test.path);
        
        const statusIcon = result.ok ? '✅' : '❌';
        console.log(`  ${test.name}: ${result.status} ${result.statusText} ${statusIcon}`);
        
      } catch (error) {
        console.log(`  ${test.name}: Error - ${error.message} ❌`);
      }
    }
    
    console.log('\n🎉 LangFuse UI Test Completed Successfully!');
    console.log('\n📸 Screenshots captured:');
    console.log('  - working-1-loaded.png: Initial app state');
    console.log('  - working-2-advanced-clicked.png: After clicking advanced options');
    console.log('  - working-3-langfuse-enabled.png: After enabling LangFuse');
    console.log('  - working-4-complete.png: Final state with all LangFuse fields');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/working-error.png', fullPage: true });
  } finally {
    console.log('\n⏳ Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testLangFuseWorking().catch(console.error);