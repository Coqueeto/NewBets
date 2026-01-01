# Deployment Instructions for NewBets

This guide will help you deploy the Self-Learning AI Betting System to GitHub Pages.

## Prerequisites

- A GitHub account with repository access
- An API key from [The Odds API](https://the-odds-api.com/) (free tier available)

## Steps to Deploy

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Pages** in the left sidebar
4. Under **Source**, select:
   - Source: **GitHub Actions**
   - (This will use the automated deployment workflow)

### 2. Configure API Key

You have two options for configuring your API key:

#### Option A: Using GitHub Secrets (Recommended for Production)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ODDS_API_KEY`
4. Value: Your API key from The Odds API
5. Click **Add secret**
6. The `deploy-with-secrets.yml` workflow will automatically generate `config.js` during deployment

#### Option B: Manual Configuration (For Testing)

1. Open `config.js` in the repository root
2. Replace `REPLACE_WITH_YOUR_API_KEY` with your actual API key:
   ```javascript
   window.APP_CONFIG = {
       ODDS_API_KEYS: [
           { 
               key: 'your-actual-api-key-here', 
               limit: 500, 
               name: 'Primary', 
               type: 'odds' 
           }
       ]
   };
   ```
3. **⚠️ IMPORTANT**: Never commit actual API keys to public repositories!
4. Consider adding `config.js` to `.gitignore` if using this method locally

### 3. Deploy

#### Automatic Deployment (Recommended)

The repository includes two deployment workflows:

1. **deploy-with-secrets.yml** (Recommended): 
   - Automatically builds Tailwind CSS
   - Generates `config.js` from template with GitHub Secrets
   - Deploys to GitHub Pages
   - Triggered on push to `main` branch

2. **pages.yml** (Simple deployment):
   - Basic deployment without build steps
   - Requires pre-built files

To trigger deployment:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Manual Deployment

If you prefer to build locally:

```bash
# Install dependencies
npm install

# Build Tailwind CSS
npm run build:css

# Commit and push
git add .
git commit -m "Build for deployment"
git push origin main
```

### 4. Access Your Site

After deployment completes (usually 2-3 minutes):

1. Go to **Settings** → **Pages**
2. Your site URL will be displayed at the top
3. Typically: `https://[username].github.io/NewBets/ai-betting-system.html`
4. Or if using a custom domain: `https://[custom-domain]/NewBets/ai-betting-system.html`

## Monitoring Deployment

1. Go to the **Actions** tab in your repository
2. Click on the latest workflow run
3. Monitor the build and deployment progress
4. Check for any errors in the logs

## Troubleshooting

### API Key Not Working

- Verify your API key is valid at [The Odds API Dashboard](https://the-odds-api.com/)
- Check that the GitHub Secret is named exactly `ODDS_API_KEY`
- Ensure the secret is available to the workflow (check environment settings)

### Pages Not Loading

- Verify GitHub Pages is enabled
- Check that the workflow completed successfully
- Ensure `start_url` in `manifest.json` matches your repository name
- Clear browser cache and try again

### Build Failures

- Check the Actions tab for error messages
- Ensure `package.json` and `package-lock.json` are committed
- Verify Node.js version compatibility (v18 recommended)

## Local Development

To run locally:

```bash
# Install dependencies
npm install

# Watch mode (auto-rebuild on changes)
npm run watch:css

# Open in browser
open ai-betting-system.html
# or
python3 -m http.server 8000
# Then navigate to http://localhost:8000/ai-betting-system.html
```

## Security Notes

- **Never commit API keys** to the repository
- Use GitHub Secrets for sensitive data
- Keep `config.js` in `.gitignore` if containing real keys
- Rotate API keys regularly
- Monitor API usage to prevent unexpected charges

## Updating the App

To update after initial deployment:

1. Make your changes locally
2. Test thoroughly
3. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
4. GitHub Actions will automatically redeploy

## Additional Resources

- [The Odds API Documentation](https://the-odds-api.com/liveapi/guides/v4/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
