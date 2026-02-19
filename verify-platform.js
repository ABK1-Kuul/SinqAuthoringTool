// verify-platform.js
const os = require('os');
const path = require('path');

const platform = process.platform;
const binaryName = platform === 'win32' ? 'mongod.exe' : 'mongod';
const expectedPath = path.join('bin', platform, binaryName);

console.log(`--- SINQ Platform Diagnostic ---`);
console.log(`Detected Platform: ${platform}`);
console.log(`Architecture:      ${os.arch()}`);
console.log(`Expected Binary:   ${binaryName}`);
console.log(`Target Path:       ${expectedPath}`);
console.log(`--------------------------------`);
