# TaskFlow Pro - Deployment Guide

This guide provides step-by-step instructions for deploying the TaskFlow Pro application to various hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Platform-Specific Guides](#platform-specific-guides)

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git repository initialized
- Accounts on chosen hosting platforms

## Environment Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd taskflow-pro

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../app
npm install
```

### 2. Environment Variables

#### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=taskflow_pro
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_MAX=100
```

#### Frontend (.env)

Create a `.env` file in the `app` directory:

```env
VITE_API_URL=https://your-backend-url.render.com/api
VITE_APP_NAME=TaskFlow Pro
VITE_APP_VERSION=1.0.0
```

## Database Setup

### Option 1: Supabase PostgreSQL (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection String
4. Copy the connection string and update your `.env` file
5. Run the schema SQL:

```bash
psql "your-connection-string" -f database/schema.sql
```

### Option 2: Neon PostgreSQL

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Get the connection string from the dashboard
4. Update your `.env` file
5. Run the schema SQL

### Option 3: Railway PostgreSQL

1. Create an account at [railway.app](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database
4. Copy the connection details
5. Update your `.env` file

## Backend Deployment

### Option 1: Render (Recommended)

1. Create a free account at [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: taskflow-pro-api
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables from your `.env` file
6. Click "Create Web Service"
7. Wait for deployment to complete

### Option 2: Railway

1. Create an account at [railway.app](https://railway.app)
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your repository
4. Add a start command: `npm start`
5. Add environment variables
6. Deploy

### Option 3: Heroku

```bash
# Login to Heroku
heroku login

# Create a new app
heroku create taskflow-pro-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Create a free account at [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_URL`: Your backend URL + `/api`
6. Click "Deploy"

### Option 2: Netlify

1. Create an account at [netlify.com](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to GitHub
4. Configure build settings:
   - **Base directory**: `app`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables
6. Deploy

### Option 3: GitHub Pages

```bash
# Build the frontend
cd app
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Platform-Specific Guides

### Complete Deployment on Render + Vercel

#### Step 1: Deploy Backend to Render

1. Push your code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click "New +" > "Web Service"
4. Connect your GitHub repo
5. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy and copy the URL (e.g., `https://taskflow-pro-api.onrender.com`)

#### Step 2: Setup Database

1. Create a Supabase account
2. Create a new project
3. Run the schema.sql file
4. Copy the connection string
5. Add it to Render environment variables

#### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repo
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `app`
5. Add environment variable:
   - `VITE_API_URL`: `https://taskflow-pro-api.onrender.com/api`
6. Deploy

#### Step 4: Update CORS

1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend

### Complete Deployment on Railway

1. Create a Railway account
2. Create a new project
3. Add PostgreSQL database
4. Deploy the backend from GitHub
5. Deploy the frontend from GitHub
6. Add environment variables to both services

## Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Database is connected
- [ ] Frontend loads correctly
- [ ] API calls from frontend work
- [ ] Authentication works
- [ ] All features tested

## Troubleshooting

### CORS Issues

If you see CORS errors, ensure:
1. `FRONTEND_URL` in backend matches your frontend URL exactly
2. Backend is deployed and running
3. No trailing slashes in URLs

### Database Connection Issues

1. Verify connection string is correct
2. Check if database allows external connections
3. Ensure SSL is enabled for cloud databases

### Build Failures

1. Check Node.js version (18+ required)
2. Verify all dependencies are installed
3. Check build logs for errors

## Security Considerations

1. **Never commit `.env` files**
2. Use strong JWT secrets (32+ characters)
3. Enable SSL for database connections
4. Set up rate limiting
5. Use HTTPS in production
6. Regularly update dependencies

## Monitoring

- Render: Built-in monitoring dashboard
- Vercel: Analytics and monitoring
- Supabase: Database metrics

## Support

For issues and questions:
- Check the logs in your hosting platform
- Review the troubleshooting section
- Open an issue in the GitHub repository
