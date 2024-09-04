const fs = require('fs');
const path = require('path');

const edgeFunctionPath = path.join(__dirname, 'ai-stream.js');
const outputPath = path.join(__dirname, '.vercel', 'output', 'functions', 'api', 'ai-stream.func');

// Ensure the output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

// Read the Edge function file
const edgeFunction = fs.readFileSync(edgeFunctionPath, 'utf8');

// Create the .func directory
fs.mkdirSync(outputPath);

// Write the Edge function to the .func/index.js file
fs.writeFileSync(path.join(outputPath, 'index.js'), edgeFunction);

// Create a basic package.json for the Edge function
const packageJson = {
  "name": "ai-stream-edge-function",
  "version": "1.0.0",
  "dependencies": {
    "openai": "^4.53.0"
  }
};

fs.writeFileSync(path.join(outputPath, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Edge function built successfully');