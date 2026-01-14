const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking if node_modules exists...');
const nodeModulesPath = path.join(__dirname, '../node_modules');
const reactScriptsPath = path.join(nodeModulesPath, 'react-scripts');

if (!fs.existsSync(reactScriptsPath)) {
  console.log('react-scripts not found. Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('Dependencies already installed.');
}

console.log('Running build...');
try {
  execSync('npx react-scripts build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

