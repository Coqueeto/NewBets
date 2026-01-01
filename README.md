# NewBets - AI-Powered Betting System

AI-powered betting system with secure API key management for analyzing sports betting odds.

## Features

- 🤖 AI-powered predictions using machine learning
- 📊 Real-time odds comparison
- 🔒 Secure API key management
- 📱 Progressive Web App (PWA) support
- 🎯 Multi-sport support

## Security & API Keys

⚠️ **IMPORTANT**: API keys are never committed to the repository.

### For Production (GitHub Pages)
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ODDS_API_KEY`
4. Value: Your API key from https://the-odds-api.com/
5. The deployment workflow will automatically inject it during build

### For Local Development
1. Run: `bash scripts/setup-local-dev.sh`
2. Enter your development API key when prompted
3. The script creates `config.js` (which is gitignored)
4. Start developing normally

### Never commit:
- ❌ config.js (generated file with actual keys)
- ❌ .env files
- ❌ Any file containing API keys

## Getting Started

### Prerequisites
- A modern web browser
- An API key from [The Odds API](https://the-odds-api.com/)

### Local Development Setup
```bash
# 1. Clone the repository
git clone https://github.com/Coqueeto/NewBets.git
cd NewBets

# 2. Set up your local development environment
bash scripts/setup-local-dev.sh

# 3. Open in browser
# Simply open ai-betting-system.html in your browser
```

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch. The secure deployment workflow injects the API key from GitHub Secrets during the build process.

## Project Structure

```
NewBets/
├── ai-betting-system.html    # Main application
├── config.template.js         # Template for API configuration
├── config.js                  # Generated config (gitignored)
├── scripts/
│   └── setup-local-dev.sh    # Local setup script
├── .github/workflows/
│   └── deploy-with-secrets.yml # Secure deployment workflow
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.
