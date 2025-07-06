#!/usr/bin/env node

/**
 * Simple file-based verification script for minimal-think-mcp
 * This validates files, package.json structure, and basic content
 * without running the server or requiring dependencies
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory of current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing minimal-think-mcp files...\n');

// Test 1: Check all required files exist
console.log('1. Testing file structure...');

const requiredFiles = [
  'index.js',
  'package.json', 
  'README.md',
  'LICENSE',
  '.gitignore',
  'EXAMPLES.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
}

// Test 2: Validate package.json
console.log('\n2. Testing package.json...');

try {
  const packageJsonPath = join(__dirname, 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  // Check required fields
  const requiredFields = ['name', 'version', 'bin', 'dependencies', 'description'];
  for (const field of requiredFields) {
    if (packageJson[field]) {
      console.log(`✅ Field "${field}" exists`);
    } else {
      console.log(`❌ Field "${field}" missing`);
    }
  }
  
  // Check version
  if (packageJson.version === '1.2.3') {
    console.log('✅ Version is 1.2.3');
  } else {
    console.log(`❌ Version should be 1.2.3, found ${packageJson.version}`);
  }
  
  // Check binary
  if (packageJson.bin && packageJson.bin['minimal-think-mcp'] === 'index.js') {
    console.log('✅ Binary entry point is correct');
  } else {
    console.log('❌ Binary entry point is incorrect');
  }
  
  // Check dependencies
  const requiredDeps = ['@modelcontextprotocol/sdk', 'zod'];
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dependency "${dep}" configured`);
    } else {
      console.log(`❌ Dependency "${dep}" missing`);
    }
  }
} catch (error) {
  console.log(`❌ Failed to parse package.json: ${error.message}`);
}

// Test 3: Basic content checks
console.log('\n3. Testing file content...');

try {
  // Check index.js
  const indexPath = join(__dirname, 'index.js');
  const indexContent = readFileSync(indexPath, 'utf8');
  
  const codeFeatures = [
    'useDefaultSession',
    'setAsDefault',
    'getDefaultSession',
    'setDefaultSession',
    'SESSION_DIR',
    'registerTool',
    'think',
    'list_sessions',
    'view_session',
    'delete_session',
    'set_default_session',
    'cleanup_sessions'
  ];
  
  for (const feature of codeFeatures) {
    if (indexContent.includes(feature)) {
      console.log(`✅ Code feature "${feature}" found`);
    } else {
      console.log(`❌ Code feature "${feature}" missing`);
    }
  }
  
  // Check README.md
  const readmePath = join(__dirname, 'README.md');
  const readmeContent = readFileSync(readmePath, 'utf8');
  
  const docTopics = [
    'Default Session',
    'useDefaultSession',
    'setAsDefault',
    'persistent',
    'thinking modes'
  ];
  
  for (const topic of docTopics) {
    if (readmeContent.toLowerCase().includes(topic.toLowerCase())) {
      console.log(`✅ Documentation for "${topic}" exists`);
    } else {
      console.log(`❌ Documentation for "${topic}" missing`);
    }
  }
  
  // Check EXAMPLES.md
  const examplesPath = join(__dirname, 'EXAMPLES.md');
  const examplesContent = readFileSync(examplesPath, 'utf8');
  
  if (examplesContent.includes('useDefaultSession')) {
    console.log('✅ Examples for default session exist');
  } else {
    console.log('❌ Examples for default session missing');
  }
} catch (error) {
  console.log(`❌ Content check failed: ${error.message}`);
}

// Installation and usage instructions
console.log('\n📦 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Test the server: node index.js');
console.log('3. Publish to npm: npm publish');
console.log('4. Configure in Claude Desktop:');
console.log('   {"command": "npx", "args": ["-y", "minimal-think-mcp@latest"]}');

console.log('\n✨ Verification complete!');
