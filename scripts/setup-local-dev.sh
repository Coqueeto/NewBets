#!/bin/bash
echo "🔧 Setting up local development environment..."

if [ -f "config.js" ]; then
    echo "⚠️  config.js already exists."
    exit 0
fi

echo "Enter your Odds API key for local development:"
read -s API_KEY

# Use Node.js for safe string replacement (handles all special characters)
node -e "
const fs = require('fs');
const template = fs.readFileSync('config.template.js', 'utf8');
const config = template.replace(/__ODDS_API_KEY__/g, process.env.API_KEY);
fs.writeFileSync('config.js', config);
" 

echo "✅ config.js created successfully!"
echo "🔒 This file is in .gitignore and won't be committed"
