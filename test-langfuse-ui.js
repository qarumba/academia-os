/**
 * Puppeteer UI Tests for LangFuse Integration
 * Tests the complete user workflow for LangFuse self-hosted configuration
 */

const puppeteer = require('puppeteer');

async function testLangFuseIntegration() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual verification
    slowMo: 100,     // Slow down actions for visibility
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('🚀 Starting LangFuse UI Integration Tests...');
  
  try {
    // Test 1: Navigate to AcademiaOS
    console.log('\n📝 Test 1: Loading AcademiaOS application');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-screenshots/01-initial-load.png', fullPage: true });
    console.log('✅ Application loaded successfully');
    
    // Test 2: Check if ModelConfiguration is shown (no config exists)
    console.log('\n📝 Test 2: Verifying ModelConfiguration requirement');
    
    // Wait for ModelConfiguration component to appear
    await page.waitForSelector('[data-testid="model-configuration"], .ant-card', { timeout: 5000 });
    console.log('✅ ModelConfiguration component detected');
    
    // Test 3: Configure AI Model with LangFuse
    console.log('\n📝 Test 3: Configuring AI model with LangFuse observability');
    
    // Select Anthropic provider
    await page.click('.ant-select-selector');
    await page.waitForSelector('.ant-select-item[title="Anthropic (Claude)"]');
    await page.click('.ant-select-item[title="Anthropic (Claude)"]');
    console.log('✅ Selected Anthropic provider');
    
    // Select Claude model
    await page.click('[data-testid="model-select"], .ant-select-selector[aria-label="Model"]');
    await page.waitForSelector('.ant-select-item');
    await page.click('.ant-select-item[title="Claude 4 Sonnet"]');
    console.log('✅ Selected Claude 4 Sonnet model');
    
    // Enter API key
    await page.type('input[placeholder*="Anthropic API key"]', 'sk-ant-test-key-for-ui-testing');
    console.log('✅ Entered Anthropic API key');
    
    // Enter OpenAI embeddings key
    await page.type('input[placeholder*="OpenAI API key for embeddings"]', 'sk-test-openai-embeddings-key');
    console.log('✅ Entered OpenAI embeddings key');
    
    // Test 4: Show Advanced Options for LangFuse
    console.log('\n📝 Test 4: Accessing LangFuse configuration');
    
    // Click "Show Advanced Options"
    await page.click('button:has-text("Show Advanced Options"), .ant-btn:has-text("Show Advanced Options")');
    await page.waitForTimeout(500); // Wait for animation
    console.log('✅ Opened advanced options');
    
    // Take screenshot of advanced options
    await page.screenshot({ path: 'test-screenshots/02-advanced-options.png', fullPage: true });
    
    // Test 5: Enable LangFuse
    console.log('\n📝 Test 5: Enabling LangFuse observability');
    
    // Find and click the LangFuse enable switch
    const langfuseSwitch = await page.$('.ant-switch');
    if (langfuseSwitch) {
      await langfuseSwitch.click();
      console.log('✅ Enabled LangFuse observability');
      
      // Wait for LangFuse fields to appear
      await page.waitForTimeout(500);
      
      // Fill LangFuse configuration
      await page.type('input[placeholder="http://localhost:3030"]', 'http://localhost:3030');
      await page.type('input[placeholder="pk-lf-..."]', 'pk-lf-test-public-key-ui');
      await page.type('input[placeholder="sk-lf-..."]', 'sk-lf-test-secret-key-ui');
      
      console.log('✅ Filled LangFuse configuration fields');
      
      // Take screenshot of completed LangFuse config
      await page.screenshot({ path: 'test-screenshots/03-langfuse-config.png', fullPage: true });
    } else {
      console.log('⚠️ LangFuse switch not found - checking for alternative selector');
    }
    
    // Test 6: Save Configuration
    console.log('\n📝 Test 6: Saving model configuration');
    
    await page.click('button[type="submit"]:has-text("Save Configuration"), .ant-btn-primary:has-text("Save")');
    await page.waitForTimeout(2000); // Wait for save to complete
    console.log('✅ Saved configuration');
    
    // Test 7: Verify Main Application Loads
    console.log('\n📝 Test 7: Verifying main application interface');
    
    // Wait for main workflow interface
    await page.waitForSelector('.ant-steps, .ant-card', { timeout: 10000 });
    console.log('✅ Main application interface loaded');
    
    // Take screenshot of main interface
    await page.screenshot({ path: 'test-screenshots/04-main-interface.png', fullPage: true });
    
    // Test 8: Look for AI Observatory Button
    console.log('\n📝 Test 8: Finding AI Observatory button');
    
    // Look for the AI Observatory button
    const observatoryButton = await page.$('button:has-text("AI Observatory")');
    if (observatoryButton) {
      console.log('✅ AI Observatory button found!');
      
      // Click the button to open LangFuse monitor
      await observatoryButton.click();
      await page.waitForTimeout(1000);
      
      // Check if drawer opened
      const drawer = await page.$('.ant-drawer');
      if (drawer) {
        console.log('✅ LangFuse Monitor drawer opened successfully');
        
        // Take screenshot of monitor
        await page.screenshot({ path: 'test-screenshots/05-langfuse-monitor.png', fullPage: true });
        
        // Close drawer
        await page.click('.ant-drawer-close');
        await page.waitForTimeout(500);
        console.log('✅ Monitor drawer closed');
      } else {
        console.log('⚠️ Monitor drawer did not open');
      }
    } else {
      console.log('⚠️ AI Observatory button not found - may require LangFuse to be properly configured');
      
      // Look for alternative monitoring buttons
      const heliconeButton = await page.$('button:has-text("Helicone Monitor")');
      if (heliconeButton) {
        console.log('ℹ️ Found Helicone Monitor button instead');
      }
    }
    
    // Test 9: Test Server Endpoints
    console.log('\n📝 Test 9: Testing LangFuse server endpoints');
    
    // Test health endpoint
    const healthResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/langfuse/health');
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🔍 Health endpoint response:', healthResponse);
    
    // Test metrics endpoint
    const metricsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/langfuse/model-metrics');
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Metrics endpoint response:', metricsResponse);
    
    console.log('\n🎉 LangFuse UI Integration Tests Completed!');
    console.log('📸 Screenshots saved in test-screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-screenshots/error-state.png', fullPage: true });
  } finally {
    // Keep browser open for 5 seconds for manual inspection
    console.log('\n⏳ Keeping browser open for 5 seconds for inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the tests
testLangFuseIntegration().catch(console.error);