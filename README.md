# BioAttend Frontend

A modern React application bootstrapped with Vite and styled with TailwindCSS.

## Tech Stack

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **TailwindCSS 3** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Prettier** - Code formatting with Tailwind plugin
- **ESLint** - Linting with Tailwind plugin

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
bioattend-frontend/
├── src/
│   ├── assets/        # Static assets
│   ├── config.js      # Application configuration
│   ├── App.jsx        # Main App component
│   ├── main.jsx       # Application entry point
│   └── index.css      # Global styles with Tailwind directives
├── public/            # Public assets
├── .env               # Local environment variables (not committed)
├── .env.example       # Example environment variables
├── index.html         # HTML template
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind configuration
├── postcss.config.js  # PostCSS configuration
├── eslint.config.js   # ESLint configuration
├── .prettierrc        # Prettier configuration
└── package.json       # Dependencies and scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env to configure your API endpoints
   # VITE_API_URL - The backend API URL
   # VITE_WS_URL - The WebSocket server URL
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Configuration

The application uses environment variables for configuration. These are managed through `.env` files:

- `.env.example` - Template file with all required environment variables (committed to git)
- `.env` - Your local configuration (ignored by git)

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|  
| `VITE_API_URL` | Backend API endpoint | `http://localhost:3000/api` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:3000` |

### Using Configuration in Code

Import and use the configuration module:

```javascript
import config from './config';

// Access API URL
const apiUrl = config.api.url;

// Access WebSocket URL  
const wsUrl = config.api.wsUrl;

// Check environment
if (config.isDevelopment) {
  console.log('Running in development mode');
}
```

## Styling with TailwindCSS

This project uses TailwindCSS for styling. Utility classes can be used directly in JSX:

```jsx
<div className="flex items-center justify-center bg-gray-100">
  <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Click me
  </button>
</div>
```

## Code Quality

- **ESLint** is configured with React and Tailwind plugins
- **Prettier** automatically formats code and sorts Tailwind classes
- Run `npm run lint` to check for linting issues
- Run `npm run format` to format all files

## Deployment

### Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist/` directory.

### Deployment Options

#### Option 1: Deploy with Django (WhiteNoise)

If serving the frontend through Django:

1. **Automatic Deployment Script**:
   ```bash
   # Set Django project path (if not in default location)
   export DJANGO_PROJECT_PATH=/path/to/django/project
   
   # Run deployment script
   ./scripts/deploy-django.sh
   ```

2. **Manual Deployment**:
   ```bash
   # Build with Django static path
   VITE_BASE_PATH="/static/front/" npm run build
   
   # Copy to Django static directory
   cp -r dist/* ../bioattend-backend/staticfiles/front/
   
   # Run Django collectstatic
   cd ../bioattend-backend
   python manage.py collectstatic --noinput
   ```

3. **Django Settings** (ensure these are configured):
   ```python
   # settings.py
   STATICFILES_DIRS = [
       BASE_DIR / "staticfiles" / "front",
   ]
   
   # If using WhiteNoise
   MIDDLEWARE = [
       'whitenoise.middleware.WhiteNoiseMiddleware',
       # ... other middleware
   ]
   
   WHITENOISE_AUTOREFRESH = True  # Development only
   WHITENOISE_USE_FINDERS = True
   WHITENOISE_SKIP_COMPRESS_EXTENSIONS = ['map']
   ```

#### Option 2: Deploy to Netlify

1. **Via Netlify CLI**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Build the project
   npm run build
   
   # Deploy to Netlify
   netlify deploy --prod --dir=dist
   ```

2. **Via GitHub Integration**:
   - Connect your GitHub repository to Netlify
   - Netlify will auto-deploy on pushes to main branch
   - Configuration is in `netlify.toml`

3. **Environment Variables** (set in Netlify dashboard):
   - `VITE_API_URL`: Your backend API URL
   - `VITE_WS_URL`: Your WebSocket server URL

#### Option 3: Deploy to AWS S3 + CloudFront

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload to S3**:
   ```bash
   # Create S3 bucket (if not exists)
   aws s3 mb s3://your-bucket-name
   
   # Enable static website hosting
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   
   # Sync build files
   aws s3 sync dist/ s3://your-bucket-name \
     --delete \
     --cache-control max-age=31536000,public
   ```

3. **Setup CloudFront** (optional but recommended):
   - Create CloudFront distribution
   - Point origin to S3 bucket
   - Configure custom error pages for SPA routing

#### Option 4: Deploy to Vercel

1. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configuration** (vercel.json):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### CI/CD Pipeline

This project includes a comprehensive GitHub Actions workflow that:

1. **On Every Push/PR**:
   - Runs ESLint for code quality
   - Checks Prettier formatting
   - Runs all tests with coverage
   - Builds the application

2. **On Pull Requests**:
   - Deploys preview to Netlify (if configured)
   - Runs Lighthouse performance audit

3. **On Main Branch**:
   - Deploys to production (S3 or Netlify)

#### Setting up CI/CD

1. **Add GitHub Secrets** (Settings → Secrets → Actions):
   
   For Netlify deployment:
   - `NETLIFY_AUTH_TOKEN`: Get from Netlify account settings
   - `NETLIFY_SITE_ID`: Get from Netlify site settings
   
   For AWS S3 deployment:
   - `AWS_S3_BUCKET`: Your S3 bucket name
   - `AWS_ACCESS_KEY_ID`: AWS access key
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key
   - `AWS_REGION`: AWS region (e.g., us-east-1)

2. **Workflow is automatically triggered on**:
   - Push to main or develop branches
   - Pull requests to main or develop branches

### Environment-Specific Builds

You can build for different environments:

```bash
# Development build
NODE_ENV=development npm run build

# Staging build
VITE_API_URL=https://staging-api.example.com npm run build

# Production build
NODE_ENV=production npm run build
```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test API connectivity
- [ ] Check browser console for errors
- [ ] Verify routing works correctly
- [ ] Test on different devices/browsers
- [ ] Monitor performance metrics
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure CDN caching headers
- [ ] Set up SSL/TLS certificates
- [ ] Enable CORS if needed

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
