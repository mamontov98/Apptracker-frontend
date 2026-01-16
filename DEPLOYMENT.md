# 🚀 Deployment Guide - AppTracker Frontend

This guide covers deploying the AppTracker Frontend Dashboard to various cloud platforms.

## Prerequisites

- Backend API deployed and accessible
- Git repository
- Account on your chosen cloud platform

## 📋 Pre-Deployment Checklist

- [ ] Backend API deployed and URL known
- [ ] Backend CORS configured to allow your frontend domain
- [ ] Environment variable `VITE_API_BASE_URL` set to production backend URL

## 🎯 Quick Deploy Options

### Vercel (Recommended - Easiest)

1. **Connect repository to Vercel**
2. **Set environment variable:**
   - `VITE_API_BASE_URL=https://your-backend-api.com`
3. **Deploy automatically on push**

**Advantages:** Zero config, automatic HTTPS, CDN, great performance

### Netlify

1. **Connect repository to Netlify**
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set environment variable:**
   - `VITE_API_BASE_URL=https://your-backend-api.com`
4. **Deploy**

### Render

1. **Create Static Site on Render**
2. **Connect repository**
3. **Configure:**
   - Build: `npm install && npm run build`
   - Publish: `dist`
4. **Set environment variable:**
   - `VITE_API_BASE_URL=https://your-backend-api.com`

### GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://username.github.io/apptracker-frontend"
   }
   ```

3. **Build and deploy:**
   ```bash
   VITE_API_BASE_URL=https://your-backend-api.com npm run build
   npm run deploy
   ```

## 🔐 Environment Variables

**Important:** Vite environment variables are embedded at build time, not runtime.

For production builds, set the variable before building:

```bash
VITE_API_BASE_URL=https://apptracker-backend.herokuapp.com npm run build
```

Or configure in your deployment platform's environment settings (which will be used during the build process).

## 🌐 CORS Configuration

Ensure your backend allows your frontend domain:

```python
# In backend/app.py
CORS(app, origins=[
    "https://your-frontend-domain.vercel.app",
    "https://apptracker-frontend.netlify.app",
    # Add your actual frontend URL
])
```

## ✅ Post-Deployment

1. Visit your deployed URL
2. Test project selection
3. Verify API calls in browser DevTools Network tab
4. Check that data loads correctly

## 🔄 Continuous Deployment

All platforms support automatic deployment:
- **Vercel:** Automatic on push to main branch
- **Netlify:** Automatic on push to main branch
- **Render:** Automatic on push to main branch
- **GitHub Pages:** Manual or via GitHub Actions

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
