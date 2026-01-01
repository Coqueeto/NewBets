#!/usr/bin/env bash
# Local development setup script

echo "🔧 Setting up local development environment..."

# Check if config.js already exists
if [ -f "config.js" ]; then
    echo "⚠️  config.js already exists. Delete it first if you want to recreate it."
    exit 0
fi

# Prompt for API key
echo ""
echo "Enter your Odds API key for local development:"
read -s API_KEY

# Validate API key was entered
if [ -z "$API_KEY" ]; then
    echo ""
    echo "❌ Error: API key cannot be empty"
    exit 1
fi

# Generate config.js from template
# Using | as delimiter to avoid issues with / in API keys
sed "s|__ODDS_API_KEY__|${API_KEY}|g" config.template.js > config.js

echo ""
echo "✅ config.js created successfully!"
echo "🔒 This file is in .gitignore and won't be committed"
echo ""
echo "To start developing:"
echo "  1. Run: npm install"
echo "  2. Run: npm run build:css"
echo "  3. Open ai-betting-system.html in a browser"
