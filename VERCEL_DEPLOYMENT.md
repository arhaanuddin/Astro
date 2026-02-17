# 🚀 Deploying Astronet to Vercel

This guide walks you through deploying your Astronet full-stack application to Vercel.

## 📋 Prerequisites

Before deploying to Vercel, ensure you have:

1. ✅ A [Vercel account](https://vercel.com/signup) (free tier works)
2. ✅ Your GitHub repository pushed with all latest changes
3. ✅ A hosted MySQL database (see [Database Setup](#-database-setup) below)
4. ✅ All environment variables ready (see [Environment Variables](#-environment-variables) below)

## 🗄️ Database Setup

> [!IMPORTANT]
> Vercel does NOT provide database hosting. You must host your MySQL database separately.

### Recommended Database Hosting Options:

1. **[PlanetScale](https://planetscale.com/)** (Recommended)
   - Free tier available
   - MySQL-compatible serverless database
   - Easy to set up and scale
   - Good Vercel integration

2. **[Railway](https://railway.app/)**
   - Simple MySQL hosting
   - Free tier with $5 credit/month
   - Easy deployment

3. **[AWS RDS](https://aws.amazon.com/rds/)** or **[Google Cloud SQL](https://cloud.google.com/sql)**
   - Production-grade solutions
   - More complex setup
   - Higher cost

4. **Existing Hosting Provider**
   - If you already have MySQL hosted elsewhere, you can use that
   - Ensure it's accessible from the internet (not localhost)

### Database Migration Steps:

1. Export your current database:
   ```bash
   mysqldump -u root -p astronet_db > astronet_backup.sql
   ```

2. Import to your cloud database provider following their documentation

3. Get your database connection details (host, port, username, password, database name)

## 🔑 Environment Variables

You'll need to configure these environment variables in Vercel:

```env
# Database Configuration
DB_HOST=your-database-host.com
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=astronet_db

# JWT Secret (generate a random secure string)
JWT_SECRET=your-very-secure-random-string-here

# Email Configuration (for nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Node Environment
NODE_ENV=production
```

> [!TIP]
> Generate a secure JWT secret using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## 📤 Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended for First-Time)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New" → "Project"**

3. **Import your GitHub repository:**
   - Select your GitHub account
   - Choose the `Astro` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset**: Select "Other"
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave empty (we're using custom build)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave default

5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add each variable from the list above
   - Use the same values for Production, Preview, and Development

6. **Click "Deploy"**
   - Vercel will build and deploy your application
   - Wait for deployment to complete (~2-3 minutes)

7. **Your app is live! 🎉**
   - Vercel will provide a URL like: `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd c:\Users\Me\Desktop\Astro\Astro
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Configure settings as needed
   - Confirm deployment

5. **Add environment variables via CLI or dashboard**

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## ⚙️ Post-Deployment Configuration

### 1. Test Your Deployment

Visit your deployed URL and test:
- ✅ Frontend loads correctly
- ✅ API health check: `https://your-project.vercel.app/api/health`
- ✅ Login functionality
- ✅ User registration
- ✅ Event management
- ✅ Gallery viewing

### 2. Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 📁 File Upload Configuration

> [!WARNING]
> **Important**: Vercel's serverless functions have a read-only filesystem. The current implementation uses local file storage which won't work in production.

### Options for File Uploads:

#### Option 1: Vercel Blob Storage (Recommended)

1. **Install Vercel Blob:**
   ```bash
   npm install @vercel/blob
   ```

2. **Update upload routes** to use Vercel Blob instead of multer
   - See [Vercel Blob documentation](https://vercel.com/docs/storage/vercel-blob)

3. **Add to environment variables:**
   ```
   BLOB_READ_WRITE_TOKEN=your-token
   ```

#### Option 2: AWS S3 or Cloudinary

1. **Install SDK:**
   ```bash
   # For AWS S3
   npm install aws-sdk multer-s3
   
   # For Cloudinary
   npm install cloudinary multer-storage-cloudinary
   ```

2. **Update multer configuration** in your routes to use cloud storage

3. **Add credentials to environment variables**

#### Option 3: Disable Uploads (Temporary)

For testing purposes, you can temporarily disable upload features until you implement cloud storage.

## 🔄 Updating Your Deployment

### Automatic Deployments (Recommended)

Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically detect the push and redeploy.

### Manual Deployments

```bash
vercel --prod
```

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Ensure all dependencies are in `backend/package.json`:
```bash
cd backend
npm install
```

### Issue: Database connection fails

**Solution**: 
- Verify environment variables are set correctly in Vercel
- Ensure database allows connections from Vercel's IP addresses
- Check database host is publicly accessible

### Issue: 500 Internal Server Error

**Solution**:
- Check Vercel function logs: Dashboard → Your Project → Deployments → [Latest] → Function Logs
- Common causes:
  - Missing environment variables
  - Database connection issues
  - File path issues (use `path.join(__dirname, ...)`)

### Issue: Frontend loads but API calls fail

**Solution**:
- Check if API routes are configured correctly in `vercel.json`
- Verify CORS settings allow requests from your Vercel domain
- Check frontend `api.js` uses correct API URLs

### Issue: File uploads don't work

**Solution**: This is expected. Implement cloud storage as described in [File Upload Configuration](#-file-upload-configuration).

## 📊 Monitoring Your Application

1. **View Function Logs:**
   - Vercel Dashboard → Your Project → Deployments
   - Click on a deployment → Function Logs

2. **Analytics:**
   - Vercel Dashboard → Your Project → Analytics
   - Monitor traffic, response times, and errors

3. **Custom Monitoring:**
   - Consider integrating tools like Sentry for error tracking
   - Use Vercel's Web Analytics for frontend monitoring

## 🔐 Security Checklist

Before going live:

- [ ] Changed all default passwords
- [ ] Using strong JWT secret
- [ ] Database credentials are secure
- [ ] Environment variables are set in Vercel (not in code)
- [ ] CORS is configured properly (not `*` in production)
- [ ] Email service credentials are secure
- [ ] SQL injection protection is in place (using parameterized queries)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Node.js Apps](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/projects/domains)

## 💡 Tips for Production

1. **Enable Vercel Analytics** for performance monitoring
2. **Set up a staging environment** using Vercel's preview deployments
3. **Implement proper error tracking** with services like Sentry
4. **Regular database backups** from your database provider
5. **Monitor API rate limits** and implement rate limiting if needed

---

**Need help?** Check the [Troubleshooting](#-troubleshooting) section or Vercel's documentation.
