#!/bin/bash
# Deploy Profile Verification Fix Script

echo "🛠️  Deploying Profile Verification Fix..."
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! $(grep -q "tradesource" package.json) ]]; then
    echo "❌ Error: Run this script from the tradesource project root"
    exit 1
fi

# Backup original files
echo "📋 Creating backups..."
if [[ -f "src/app/profile/page.tsx" ]]; then
    cp src/app/profile/page.tsx src/app/profile/page-BACKUP-$(date +%Y%m%d-%H%M%S).tsx
    echo "   ✅ Original profile page backed up"
fi

# Deploy fixed profile page
if [[ -f "src/app/profile/page-FIXED.tsx" ]]; then
    mv src/app/profile/page-FIXED.tsx src/app/profile/page.tsx
    echo "   ✅ Fixed profile page deployed"
else
    echo "   ❌ page-FIXED.tsx not found"
    exit 1
fi

# Check if migration file exists
if [[ ! -f "supabase/migrations/001_fix_verification_schema.sql" ]]; then
    echo "   ❌ Migration file not found"
    exit 1
fi

# Run migration (if supabase is set up)
echo ""
echo "🗄️  Running database migration..."
if command -v npx &> /dev/null && [[ -f "supabase/config.toml" ]]; then
    npx supabase db push
    echo "   ✅ Database migration completed"
else
    echo "   ⚠️  Please run database migration manually:"
    echo "      npx supabase db push"
    echo "   Or apply the SQL in Supabase Dashboard"
fi

# Install missing dependencies (if any)
echo ""
echo "📦 Checking dependencies..."
npm install
echo "   ✅ Dependencies updated"

# Build check
echo ""
echo "🔨 Running build check..."
npm run build
if [[ $? -eq 0 ]]; then
    echo "   ✅ Build successful - ready to deploy!"
else
    echo "   ❌ Build failed - check the errors above"
    exit 1
fi

echo ""
echo "🎉 Profile Fix Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Deploy to Vercel: npx vercel --prod"
echo "   2. Set Jack as admin in Supabase SQL Editor:"
echo "      UPDATE users SET is_admin = true WHERE email LIKE '%jack%';"
echo "   3. Test the verification flow"
echo ""
echo "📖 See PROFILE_FIX_README.md for detailed testing instructions"