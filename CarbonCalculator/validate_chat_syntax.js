#!/usr/bin/env node
// Quick JavaScript syntax validator for chat.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'chat.js');

try {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Try to evaluate the code in a safe context
  new Function(code);
  
  console.log('✅ chat.js syntax is valid');
  console.log(`📄 File size: ${code.length} bytes`);
  console.log(`📊 Lines: ${code.split('\n').length}`);
  
} catch (err) {
  console.error('❌ Syntax error in chat.js:');
  console.error(err.message);
  process.exit(1);
}
