const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const getDomainFromConstants = () => {
  try {
    const constantsPath = path.join(__dirname, '../src/config/constants.js');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');
    
    const defaultMatch = constantsContent.match(/DOMAIN\s*=\s*process\.env\.REACT_APP_DOMAIN\s*\|\|\s*["']([^"']+)["']/);
    const defaultDomain = defaultMatch ? defaultMatch[1] : 'http://localhost:3000';
    
    return process.env.REACT_APP_DOMAIN || defaultDomain;
  } catch (error) {
    console.warn('Could not read constants.js, using default:', error.message);
    return process.env.REACT_APP_DOMAIN || 'http://localhost:3000';
  }
};

const getPortFromDomain = (domain) => {
  if (!domain) return 3000;
  try {
    const url = new URL(domain);
    return url.port || (url.protocol === 'https:' ? 443 : 80);
  } catch (e) {
    const match = domain.match(/:(\d+)/);
    return match ? parseInt(match[1]) : 3000;
  }
};

const domain = getDomainFromConstants();
const port = getPortFromDomain(domain);

process.env.PORT = port.toString();

const reactScriptsStart = spawn('react-scripts', ['start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

reactScriptsStart.on('error', (error) => {
  console.error('Error starting React app:', error);
  process.exit(1);
});

reactScriptsStart.on('exit', (code) => {
  process.exit(code);
});

