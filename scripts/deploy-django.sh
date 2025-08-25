#!/bin/bash

# Django Deployment Script
# This script builds the frontend and deploys it to Django's static directory

set -e  # Exit on error

echo "🚀 Starting frontend deployment for Django..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DJANGO_PROJECT_PATH="${DJANGO_PROJECT_PATH:-../bioattend-backend}"
DJANGO_STATIC_PATH="${DJANGO_PROJECT_PATH}/staticfiles/front"
BUILD_PATH="dist"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Django project path exists
if [ ! -d "$DJANGO_PROJECT_PATH" ]; then
    print_error "Django project not found at $DJANGO_PROJECT_PATH"
    echo "Please set DJANGO_PROJECT_PATH environment variable"
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm ci

# Step 2: Run tests
print_status "Running tests..."
npm run test:ci || {
    print_error "Tests failed! Aborting deployment."
    exit 1
}

# Step 3: Build the frontend
print_status "Building frontend for production..."
VITE_BASE_PATH="/static/front/" npm run build

# Step 4: Check if build was successful
if [ ! -d "$BUILD_PATH" ]; then
    print_error "Build failed! No dist directory found."
    exit 1
fi

# Step 5: Create Django static directory if it doesn't exist
print_status "Preparing Django static directory..."
mkdir -p "$DJANGO_STATIC_PATH"

# Step 6: Clean old files
print_status "Cleaning old static files..."
rm -rf "${DJANGO_STATIC_PATH:?}"/*

# Step 7: Copy new build files
print_status "Copying build files to Django..."
cp -r "$BUILD_PATH"/* "$DJANGO_STATIC_PATH/"

# Step 8: Run Django collectstatic
print_status "Running Django collectstatic..."
cd "$DJANGO_PROJECT_PATH"
python manage.py collectstatic --noinput

# Step 9: Compress static files for WhiteNoise
if command -v python &> /dev/null; then
    print_status "Compressing static files for WhiteNoise..."
    python manage.py compress_staticfiles || print_warning "Compression failed (optional)"
fi

print_status "Deployment complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Restart your Django application server"
echo "2. Clear any CDN caches if applicable"
echo "3. Test the deployment at your Django URL"
