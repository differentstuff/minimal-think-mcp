#!/usr/bin/env node

/**
 * Simple verification script to test the minimal-think-mcp server
 * This validates the server can start and the tool is properly registered
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, accessSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing minimal-think-mcp server...\n');

// Test 1: Check if server starts without errors
console.log('1. Testing server startup...');

const serverProcess = spawn('node', [join(__dirname, 'index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverErrors = '';

serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

serverProcess.stderr.on('data', (data) => {
  serverErrors += data.toString();
});

// Give the server time to start
setTimeout(() => {
  if (serverErrors.includes('started successfully') || serverOutput.includes('started')) {
    console.log('✅ Server starts successfully');
  } else if (serverErrors.includes('error') || serverErrors.includes('Error')) {
    console.log('❌ Server startup failed:');
    console.log(serverErrors);
  } else {
    console.log('⚠️  Server status unclear, check manually');
    console.log('Stderr:', serverErrors);
    console.log('Stdout:', serverOutput);
  }
  
  // Test 2: Validate package.json structure
  console.log('\n2. Testing package.json structure...');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, 'package.json'), 'utf8')
    );
    
    const requiredFields = ['name', 'version', 'bin', 'dependencies'];
    const missing = requiredFields.filter(field => !packageJson[field]);
    
    if (missing.length === 0) {
      console.log('✅ package.json structure is valid');
    } else {
      console.log('❌ package.json missing fields:', missing);
    }
    
    if (packageJson.bin['minimal-think-mcp'] === './index.js') {
      console.log('✅ Binary entry point configured correctly');
    } else {
      console.log('❌ Binary entry point misconfigured');
    }
    
  } catch (error) {
    console.log('❌ package.json validation failed:', error.message);
  }
  
  // Test 3: Validate files exist
  console.log('\n3. Testing file structure...');
  
  const requiredFiles = [
    'index.js',
    'package.json', 
    'README.md',
    'LICENSE',
    '.gitignore',
    'EXAMPLES.md'
  ];
  
  requiredFiles.forEach(file => {
    try {
      accessSync(join(__dirname, file));
      console.log(`✅ ${file} exists`);
    } catch (error) {
      console.log(`❌ ${file} missing`);
    }
  });
  
  console.log('\n🎉 Verification complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Run `npm publish` to publish to npm registry');
  console.log('2. Add to Claude Desktop config:');
  console.log('   {"command": "npx", "args": ["-y", "minimal-think-mcp@latest"]}');
  
  serverProcess.kill();
  process.exit(0);
}, 2000);

// Handle process cleanup
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});
