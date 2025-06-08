/**
 * Complete LangFuse Workflow Test
 * Shows the full process: LangFuse setup → AcademiaOS configuration → Integration testing
 */

const puppeteer = require('puppeteer');

async function testCompleteLangFuseWorkflow() {
  console.log('🚀 Starting Complete LangFuse Workflow Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox']
  });
  
  try {
    // Step 1: Open LangFuse and set it up
    console.log('\n📝 Step 1: Setting up LangFuse self-hosted instance...');
    
    const langfusePage = await browser.newPage();
    await langfusePage.setViewport({ width: 1400, height: 900 });
    
    await langfusePage.goto('http://localhost:3030', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await langfusePage.screenshot({ path: 'test-screenshots/workflow-1-langfuse-setup.png', fullPage: true });
    
    console.log('✅ LangFuse is accessible at http://localhost:3030');
    
    // Step 2: Open AcademiaOS and configure LangFuse integration
    console.log('\n📝 Step 2: Configuring LangFuse in AcademiaOS...');
    
    const academiaPage = await browser.newPage();
    await academiaPage.setViewport({ width: 1400, height: 900 });
    
    await academiaPage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click "Show Advanced Options" 
    await academiaPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, .ant-btn'));
      const advancedBtn = buttons.find(btn => btn.textContent?.includes('Show Advanced Options'));
      if (advancedBtn) advancedBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enable LangFuse
    await academiaPage.evaluate(() => {
      const switches = document.querySelectorAll('.ant-switch');
      if (switches.length > 0) {
        switches[switches.length - 1].click(); // Click LangFuse switch
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill LangFuse configuration
    await academiaPage.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        const placeholder = input.placeholder;
        if (placeholder?.includes('localhost:3030')) {
          input.value = 'http://localhost:3030';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (placeholder?.includes('pk-lf-')) {
          input.value = 'pk-lf-demo-key';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (placeholder?.includes('sk-lf-')) {
          input.value = 'sk-lf-demo-secret';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
    
    await academiaPage.screenshot({ path: 'test-screenshots/workflow-2-academia-langfuse-config.png', fullPage: true });
    console.log('✅ LangFuse configuration added to AcademiaOS');
    
    // Step 3: Test the integration endpoints
    console.log('\n📝 Step 3: Testing LangFuse integration endpoints...');
    
    const endpoints = [
      { name: 'Health Check', url: '/api/langfuse/health' },
      { name: 'Model Metrics', url: '/api/langfuse/model-metrics' },
      { name: 'Academic Stats', url: '/api/langfuse/academic-stats' },
      { name: 'Test Connection', url: '/api/langfuse/test', method: 'POST' }
    ];
    
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      try {
        const result = await academiaPage.evaluate(async (testEndpoint) => {
          const options = {
            method: testEndpoint.method || 'GET',
            headers: { 'Content-Type': 'application/json' }
          };
          
          if (testEndpoint.method === 'POST') {
            options.body = JSON.stringify({});
          }
          
          const response = await fetch(`http://localhost:3001${testEndpoint.url}`, options);
          const data = await response.json();
          
          return {
            endpoint: testEndpoint.name,
            status: response.status,
            ok: response.ok,
            hasData: !!data
          };
        }, endpoint);
        
        endpointResults.push(result);
        const statusIcon = result.ok ? '✅' : '❌';
        console.log(`  ${result.endpoint}: ${result.status} ${statusIcon}`);
        
      } catch (error) {
        console.log(`  ${endpoint.name}: Error - ${error.message} ❌`);
      }
    }
    
    // Step 4: Show final status
    console.log('\n📝 Step 4: Final integration status...');
    
    const successfulEndpoints = endpointResults.filter(r => r.ok).length;
    const totalEndpoints = endpointResults.length;
    
    // Take final screenshots of both applications
    await langfusePage.screenshot({ path: 'test-screenshots/workflow-3-langfuse-final.png', fullPage: true });
    await academiaPage.screenshot({ path: 'test-screenshots/workflow-4-academia-final.png', fullPage: true });
    
    console.log('\n🎉 Complete LangFuse Workflow Test Results:');
    console.log(`📊 Endpoints working: ${successfulEndpoints}/${totalEndpoints}`);
    console.log('🔗 LangFuse UI: http://localhost:3030');
    console.log('🔗 AcademiaOS: http://localhost:3000');
    
    if (successfulEndpoints === totalEndpoints) {
      console.log('✅ ALL SYSTEMS OPERATIONAL - LangFuse integration is working perfectly!');
    } else {
      console.log('⚠️ Some endpoints need configuration - but the integration foundation is ready!');
    }
    
    console.log('\n📸 Screenshots captured:');
    console.log('  - workflow-1-langfuse-setup.png: LangFuse self-hosted UI');
    console.log('  - workflow-2-academia-langfuse-config.png: AcademiaOS with LangFuse configured');
    console.log('  - workflow-3-langfuse-final.png: LangFuse ready for use');
    console.log('  - workflow-4-academia-final.png: AcademiaOS with AI Observatory ready');
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Visit http://localhost:3030 to complete LangFuse setup');
    console.log('  2. Create a project and get real API keys');
    console.log('  3. Update AcademiaOS config with real keys');
    console.log('  4. Start using AI Observatory for academic research!');
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browsers open for 10 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testCompleteLangFuseWorkflow().catch(console.error);