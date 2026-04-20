# Netlify Functions Setup Guide

This guide will help you set up and deploy the Netlify Functions API for the UW Rizz Lords project.

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Git repository
- Netlify account

## 1. Install Netlify CLI

### Option A: Using npm (Recommended)
```bash
npm install -g netlify-cli
```

### Option B: Using yarn
```bash
yarn global add netlify-cli
```

### Option C: Using curl (Linux/macOS)
```bash
curl -L https://github.com/netlify/cli/releases/latest/download/netlify-linux-amd64.tar.gz | tar -xz
sudo mv netlify /usr/local/bin/
```

### Option D: Using Homebrew (macOS)
```bash
brew install netlify-cli
```

## 2. Verify Installation

```bash
netlify --version
```

## 3. Login to Netlify

```bash
netlify login
```

This will open your browser to authenticate with Netlify.

## 4. Deploy Your Site

### Option A: Deploy from Git (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Netlify will automatically deploy when you push changes

### Option B: Deploy from Local Directory
```bash
# Build your project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Option C: Deploy Functions Only
```bash
# Deploy just the functions
netlify functions:create hello
netlify deploy --functions
```

## 5. Test Your API

Once deployed, your API will be available at:
```
https://your-site-name.netlify.app/.netlify/functions/hello
```

### Test with curl:
```bash
# GET request
curl "https://your-site-name.netlify.app/.netlify/functions/hello?paperId=1"

# POST request
curl -X POST "https://your-site-name.netlify.app/.netlify/functions/hello" \
  -H "Content-Type: application/json" \
  -d '{"paperId": "1"}'
```

## 6. Local Development

### Start Netlify Dev Server
```bash
netlify dev
```

This will start a local development server with your functions available at:
```
http://localhost:8888/.netlify/functions/hello
```

### Test Locally
```bash
# GET request
curl "http://localhost:8888/.netlify/functions/hello?paperId=1"

# POST request
curl -X POST "http://localhost:8888/.netlify/functions/hello" \
  -H "Content-Type: application/json" \
  -d '{"paperId": "1"}'
```

## 7. Project Structure

```
uw-rizzlords/
├── netlify/
│   └── functions/
│       ├── hello.ts          # TypeScript function
│       └── tsconfig.json     # TypeScript config
├── src/
│   └── components/
│       └── ApiTestPage.tsx   # Test page component
├── netlify.toml              # Netlify configuration
└── package.json              # Dependencies and scripts
```

## 8. Available Scripts

```bash
# Build the project
npm run build

# Build functions only
npm run build:functions

# Start development server
npm run dev

# Start Netlify dev server
netlify dev
```

## 9. Troubleshooting

### Function Not Found (404)
- Make sure the function is in `netlify/functions/` directory
- Check that the function is properly exported
- Verify the function name matches the URL path

### CORS Issues
- The function includes CORS headers
- Make sure you're testing from the correct domain

### TypeScript Compilation Errors
- Check `netlify/functions/tsconfig.json`
- Ensure all dependencies are installed
- Run `npm run build:functions` to test compilation

### Deployment Issues
- Check Netlify build logs
- Verify `netlify.toml` configuration
- Ensure all required files are committed to git

## 10. API Test Page

The project includes a comprehensive API test page at `/api-test` that allows you to:
- Test both GET and POST requests
- View real-time API status
- See response history
- Test with different paper IDs
- View detailed error messages

## Next Steps

1. Install Netlify CLI using one of the methods above
2. Login to your Netlify account
3. Deploy your site
4. Test the API using the test page or curl commands
5. Integrate the API calls into your main application

For more information, visit the [Netlify Functions documentation](https://docs.netlify.com/functions/overview/).
