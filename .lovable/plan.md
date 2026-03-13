

## Problem

The Render URL `https://restaurant-demand-forecasting-1.onrender.com` returns `{"detail":"Not Found"}` because it's a FastAPI backend API with no root (`/`) route defined. The API itself is working fine -- its health check and other endpoints respond correctly. The auto-generated API documentation is available at `/docs`.

This is **not** caused by any changes in your Lovable app. The Render deployment is a pure API backend, not a dashboard with a UI. The root path simply has no handler.

## Fix

Update the Forecasting button URL to point to the API's documentation page which is the only UI available on that deployment:

**File: `src/pages/RestaurantDashboard.tsx`**
- Change `EXTERNAL_DASHBOARD_URL` from `https://restaurant-demand-forecasting-1.onrender.com` to `https://restaurant-demand-forecasting-1.onrender.com/docs`

This is a one-line change. The `/docs` path serves the FastAPI Swagger UI where users can see and interact with the API endpoints (dashboard data, usage history, ingredient flow debug, health check).

## Alternative

If you previously had a separate frontend dashboard (the GitHub Pages one at `https://kleinboy100.github.io/Dashboard/`) that consumed this API, you could revert the button to point there instead. The Render URL is just an API, not a visual dashboard.

