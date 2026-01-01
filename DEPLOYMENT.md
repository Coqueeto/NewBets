# Deployment Instructions for NewBets

This guide will help you deploy the Self-Learning AI Betting System to GitHub Pages.

## Prerequisites

- A GitHub account with repository access
- An API key from [The Odds API](https://the-odds-api.com/) (free tier available)

## Quick Start (Recommended)

Follow these steps to deploy your site with automated secret management:

### 1. Add Your API Key Secret

1. Navigate to https://github.com/Coqueeto/NewBets/settings/secrets/actions
2. Click **New repository secret**
3. Name: `ODDS_API_KEY`
4. Value: Paste your API key from The Odds API
5. Click **Add secret**

### 2. Configure GitHub Pages

1. Go to **Settings** → **Pages** (or visit https://github.com/Coqueeto/NewBets/settings/pages)
2. Under **Source**, select: **GitHub Actions**
3. Save your changes

### 3. Deploy Your Site

The deployment is fully automated! The `deploy.yml` workflow will:

- **Automatically run** on every push to the `main` branch
- Generate `config.js` with your API key from GitHub Secrets
- Deploy your site to GitHub Pages with the working API key
- Keep your API key secure (never exposed in the repository)

**To trigger a deployment:**

```bash
git add .
git commit -m "Update site"
git push origin main
```

Or trigger a manual deployment:
1. Go to the **Actions** tab
2. Select the **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

Your site will be available at: `https://coqueeto.github.io/NewBets/`

---

## Alternative Configuration Options

### Option A: Using GitHub Secrets (Recommended - Configured Above)

This is the preferred method and is configured through the steps above. The `deploy.yml` workflow automatically generates `config.js` during deployment.

#### Option B: Manual Configuration (For Local Testing Only)

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

---

## Deployment Workflows

The repository includes multiple deployment workflows:

1. **deploy.yml** (Recommended - Primary Deployment): 
   - Automatically generates `config.js` from GitHub Secrets
   - Simple, secure deployment to GitHub Pages
   - Triggered on push to `main` branch or manual workflow dispatch
   - **This is the main deployment workflow described in the Quick Start above**

2. **deploy-with-secrets.yml** (Alternative with Build Steps): 
   - Includes Tailwind CSS build step
   - Generates `config.js` from template with GitHub Secrets
   - Deploys to GitHub Pages
   - Use if you need custom build processes

3. **pages.yml** (Basic deployment):
   - Simple deployment without build steps or secret management
   - Requires pre-built files and manual config.js setup
   - Only use for testing purposes

### Automatic Deployment

Push to the `main` branch to trigger automatic deployment:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

The workflow will automatically:
1. Generate `config.js` with your API key from secrets
2. Package all files for deployment
3. Deploy to GitHub Pages
4. Make your site available within 2-3 minutes

### Manual Deployment Trigger

You can also manually trigger a deployment without pushing code:

1. Go to the **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select the `main` branch
5. Click **Run workflow**

### Local Development Builds (Optional)

If you prefer to build locally before pushing:

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

---

## Monitoring Deployment

### Watch Deployment Progress

1. Go to the **Actions** tab in your repository
2. Click on the latest workflow run
3. Monitor the build and deployment progress
4. Check for any errors in the logs

### Access Your Site

After deployment completes (usually 2-3 minutes):

1. Go to **Settings** → **Pages**
2. Your site URL will be displayed at the top
3. Typically: `https://coqueeto.github.io/NewBets/ai-betting-system.html`
4. Or if using a custom domain: `https://[custom-domain]/NewBets/ai-betting-system.html`

---

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
