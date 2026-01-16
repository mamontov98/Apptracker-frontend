# AppTracker Frontend Dashboard

A modern React dashboard for visualizing analytics data, built with TypeScript, Vite, and TailwindCSS.

**🏗️ Standalone Repository** - This is an independent repository that can be deployed to cloud services.

## Features

- **Real-time Analytics**: View overview metrics, top events, time series, funnels, and conversion rates
- **Project Management**: Select and filter by projects
- **Interactive Charts**: Time series visualization with Recharts
- **Dark Theme**: Clean, professional dark theme with blue accents
- **Responsive Design**: Optimized for wide screens
- **Auto-refresh**: Automatic data refresh with configurable intervals

## Tech Stack

- **React** 19.2.0 - UI library
- **TypeScript** 5.9.3 - Type safety
- **Vite** 7.2.5 - Build tool and dev server
- **React Router** 7.10.1 - Client-side routing
- **TailwindCSS** 3.4.17 - Utility-first CSS
- **shadcn/ui** - UI component library
- **Recharts** 3.6.0 - Chart library
- **Axios** 1.13.2 - HTTP client

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure the backend URL:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Running the Application

### Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/
│   └── apiClient.ts          # API client and type definitions
├── components/
│   ├── common/
│   │   └── ErrorBanner.tsx   # Reusable error display component
│   ├── layout/
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   └── Topbar.tsx        # Top bar with filters
│   └── ui/                   # shadcn/ui components
├── context/
│   └── FiltersContext.tsx    # Global filter state management
├── layout/
│   └── DashboardLayout.tsx   # Main layout wrapper
├── pages/
│   ├── OverviewPage.tsx      # Overview metrics dashboard
│   ├── TopEventsPage.tsx     # Top events table
│   ├── TimeSeriesPage.tsx    # Time series chart
│   ├── FunnelPage.tsx        # Funnel analysis
│   ├── ConversionPage.tsx    # Conversion rate analysis
│   ├── SettingsPage.tsx      # Settings page
│   └── PageShell.tsx         # Page wrapper component
├── lib/
│   └── utils.ts              # Utility functions (cn, etc.)
├── App.tsx                   # Main app component with routing
├── main.tsx                  # Application entry point
└── index.css                 # Global styles and theme
```

## Pages

### Overview

Displays high-level metrics:
- Total Events
- Unique Users
- Conversion Rate (for purchase_success event)

### Top Events

Shows the most frequent events in a sortable table with:
- Event name
- Count
- Client-side search filtering

### Time Series

Visualizes events over time using a line chart:
- Configurable date range
- Day/hour intervals
- Interactive tooltips

### Funnel

Analyzes user progression through defined steps:
- Step-by-step user counts
- Drop-off percentages
- Visual bar representation

### Conversion

Tracks conversion rates for specific events:
- Total Users
- Converted Users
- Conversion Rate percentage
- Configurable conversion event (purchase_success, signup_success, login_success)

## Global Filters

The top bar provides global filters shared across all pages:

- **Project**: Select a project to analyze
- **Date Range**: Filter by `from` and `to` timestamps (ISO 8601 format)
- **Event Name**: Filter by specific event name
- **User ID**: Filter by user ID
- **Anonymous ID**: Filter by anonymous ID
- **Auto-refresh**: Enable automatic data refresh (30s or 60s intervals)
- **Refresh Button**: Manually trigger data refresh

Filter state is persisted in `localStorage` and shared across all pages.

## API Integration

The dashboard connects to the backend API at `VITE_API_BASE_URL`. All API calls are made through `src/api/apiClient.ts`:

- `fetchProjects()` - Get list of projects
- `fetchOverview()` - Get overview metrics
- `fetchTopEvents()` - Get top events
- `fetchTimeSeries()` - Get time series data
- `fetchFunnel()` - Get funnel analysis
- `fetchConversion()` - Get conversion rate

## Styling

The dashboard uses:

- **TailwindCSS** for utility-first styling
- **shadcn/ui** for consistent component design
- **CSS Variables** for theme customization
- **Dark mode** by default

Theme colors are defined in `src/index.css` using CSS variables, allowing easy customization.

## State Management

Global filter state is managed using React Context (`FiltersContext`):

- Filter values are stored in `localStorage` for persistence
- `refreshToken` triggers data refresh across all pages
- Auto-refresh uses `setInterval` to update `refreshToken`

## Development

### TypeScript

The project uses strict TypeScript configuration. Type definitions are available for all API responses in `src/api/apiClient.ts`.

### Linting

```bash
npm run lint
```

### Hot Module Replacement (HMR)

Vite provides instant HMR during development - changes are reflected immediately without full page reload.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |

**Note:** All Vite environment variables must be prefixed with `VITE_` to be accessible in the application.

**For Production/Cloud:** Set `VITE_API_BASE_URL` to your deployed backend URL (e.g., `https://apptracker-backend.herokuapp.com`)

## 🚀 Cloud Deployment

### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variable:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `VITE_API_BASE_URL=https://your-backend-url.com`

4. **Redeploy after setting environment variables**

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build locally first:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Set environment variable:**
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `VITE_API_BASE_URL=https://your-backend-url.com`

5. **Redeploy**

### Deploy to Render

1. **Create a new Static Site on Render**

2. **Connect your repository**

3. **Configure:**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Set environment variable:**
   - `VITE_API_BASE_URL=https://your-backend-url.com`

### Deploy to GitHub Pages

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
     "homepage": "https://yourusername.github.io/apptracker-frontend"
   }
   ```

3. **Build with production API URL:**
   ```bash
   VITE_API_BASE_URL=https://your-backend-url.com npm run build
   npm run deploy
   ```

### Important Notes for Production

- **Environment Variables:** Build-time variables (VITE_*) are baked into the build
- **API URL:** Must be set at build time, not runtime
- **CORS:** Ensure your backend allows requests from your frontend domain
- **HTTPS:** Use HTTPS URLs in production for security

## Browser Support

Modern browsers with ES6+ support:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The dashboard requires the backend API to be running
- All date/time filters use ISO 8601 format (e.g., `2025-01-06T10:00:00Z`)
- Reports filter by event `timestamp` (not server `receivedAt`)
- Filter state persists across page refreshes via `localStorage`
