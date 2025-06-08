/**
 * Test LangFuse Connection with Real Keys
 * Run this after you get your API keys to verify everything works
 */

const fetch = require('node-fetch');

async function testLangFuseConnection() {
  console.log('🧪 Testing LangFuse Connection...');
  
  // You'll need to fill these in with your real keys:
  const LANGFUSE_CONFIG = {
    host: 'http://localhost:3030',
    publicKey: 'pk-lf-b2a12baf-af76-44fe-8442-77dba8dcaed6',
    secretKey: 'sk-lf-646ee6de-810d-46f6-bbe5-0e1efc57c2bb'
  };
  
  console.log('📋 Configuration:');
  console.log(`  Host: ${LANGFUSE_CONFIG.host}`);
  console.log(`  Public Key: ${LANGFUSE_CONFIG.publicKey.substring(0, 15)}...`);
  console.log(`  Secret Key: ${LANGFUSE_CONFIG.secretKey.substring(0, 15)}...`);
  
  if (LANGFUSE_CONFIG.publicKey.includes('YOUR_PUBLIC_KEY_HERE')) {
    console.log('\n⚠️  Please update the keys in this script first!');
    console.log('📝 Edit test-langfuse-connection.js and replace:');
    console.log('   pk-lf-YOUR_PUBLIC_KEY_HERE → your actual public key');
    console.log('   sk-lf-YOUR_SECRET_KEY_HERE → your actual secret key');
    return;
  }
  
  try {
    // Test 1: Basic connection
    console.log('\n🔍 Test 1: Basic LangFuse connection...');
    const healthResponse = await fetch(`${LANGFUSE_CONFIG.host}/api/health`);
    console.log(`  Status: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);
    
    // Test 2: API key validation (if LangFuse v2 has this endpoint)
    console.log('\n🔍 Test 2: Testing through our AcademiaOS endpoints...');
    
    const endpoints = [
      '/api/langfuse/health',
      '/api/langfuse/model-metrics',
      '/api/langfuse/academic-stats'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3001${endpoint}`);
        const data = await response.json();
        
        console.log(`  ${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
        if (data.status) console.log(`    → ${data.status}`);
        
      } catch (error) {
        console.log(`  ${endpoint}: Error - ${error.message} ❌`);
      }
    }
    
    console.log('\n✅ Connection test completed!');
    console.log('🎯 Next: Update AcademiaOS with these keys for full integration!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testLangFuseConnection().catch(console.error);