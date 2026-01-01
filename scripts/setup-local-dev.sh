#!/bin/bash
echo "🔧 Setting up local development environment..."

if [ -f "config.js" ]; then
    echo "⚠️  config.js already exists."
    exit 0
fi

echo "Enter your Odds API key for local development:"
read -s API_KEY

sed "s/__ODDS_API_KEY__/${API_KEY}/g" config.template.js > config.js

echo "✅ config.js created successfully!"
echo "🔒 This file is in .gitignore and won't be committed"
