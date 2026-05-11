# Railway Deployment Guide - Ethara AI (Nexus Pro)

## 🎯 Deployment Status

✅ **Code committed and pushed to GitHub**: https://github.com/Siddhanth2509/Nexus-Pro-Web-App

The latest changes (Google OAuth re-enabled with real Client ID) have been pushed to the `main` branch.

---

## 📋 Required Environment Variables

### Backend Service Environment Variables

Add these to your Railway backend service:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=ethara_super_secret_jwt_key_2024
JWT_REFRESH_SECRET=ethara_refresh_secret_key_2024
GOOGLE_CLIENT_ID=303017670558-78ih5a84btn61pjsni2oluss41lgac7g.apps.googleusercontent.com
DATABASE_URL=<your-postgresql-connection-string>
```

### Frontend Service Environment Variables

Add these to your Railway frontend service:

```
VITE_GOOGLE_CLIENT_ID=303017670558-78ih5a84btn61pjsni2oluss41lgac7g.apps.googleusercontent.com
VITE_API_URL=<your-backend-domain>
```

---

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Access Railway Dashboard
1. Go to: https://railway.app/dashboard
2. Log in with your Railway account
3. Select your project (Nexus Pro Web App)

### Step 2: Configure Backend Service

1. Click on the **backend** service in your production environment
2. Go to the **Variables** tab (Settings → Variables)
3. Update or add the following environment variables:

| Variable Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `303017670558-78ih5a84btn61pjsni2oluss41lgac7g.apps.googleusercontent.com` |
| `NODE_ENV` | `production` |

4. Leave JWT secrets and DATABASE_URL as they are (if already set)
5. Click **Save** and wait for automatic redeploy

### Step 3: Configure Frontend Service

1. Click on the **frontend** service in your production environment
2. Go to the **Variables** tab (Settings → Variables)
3. Update or add the following environment variables:

| Variable Name | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `303017670558-78ih5a84btn61pjsni2oluss41lgac7g.apps.googleusercontent.com` |
| `VITE_API_URL` | `https://your-backend-domain.railway.app` |

4. Click **Save** and wait for automatic redeploy

**Note**: Replace `your-backend-domain` with your actual backend domain from Railway

### Step 4: Verify Deployment

After both services redeploy (may take 2-3 minutes):

1. Visit your frontend domain: `https://your-frontend-domain.railway.app`
2. Go to the login page
3. Verify that the **"Sign in with Google"** button is visible
4. Test email/password login with: 
   - Email: `admin@ethara.ai`
   - Password: `Admin@123`
5. Check that the dashboard loads with all data

---

## 🔧 What Changed in This Update

### Code Changes:
- ✅ Re-enabled Google OAuth on Login page with `useGoogleLogin` hook
- ✅ Re-enabled Google OAuth on Register page with `useGoogleLogin` hook
- ✅ Updated frontend `.env` with real Google Client ID
- ✅ Updated backend `.env` with real Google Client ID
- ✅ Fixed GoogleOAuthProvider wrapper to be conditional on valid Client ID

### Testing Status:
- ✅ All pages load correctly (Dashboard, Projects, Tasks, Team, Settings)
- ✅ Email/password login works
- ✅ Google OAuth button visible and interactive
- ✅ No build errors or warnings
- ✅ Database schema stable with 6 sample tasks

---

## 📱 Testing Checklist After Deployment

- [ ] Frontend loads without errors
- [ ] Login page shows "Sign in with Google" button
- [ ] Can login with `admin@ethara.ai` / `Admin@123`
- [ ] Dashboard displays all data (tasks, projects, charts)
- [ ] Can navigate to all pages (Projects, Tasks, Team, Settings)
- [ ] Settings page allows profile editing
- [ ] Logout and login again works

---

## 🆘 Troubleshooting

### If Google button still doesn't show:
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in frontend variables
- Check if frontend has redeployed after variable change
- Clear browser cache and reload

### If login fails:
- Verify `DATABASE_URL` is set correctly in backend
- Check backend logs in Railway for error messages
- Ensure GOOGLE_CLIENT_ID is set in backend variables

### If API calls fail:
- Verify `VITE_API_URL` points to correct backend domain
- Check CORS is enabled in backend (`src/index.js`)
- Verify backend is running and accessible

---

## 📊 Seed Accounts (Pre-created)

| Email | Password | Role |
|---|---|---|
| admin@ethara.ai | Admin@123 | admin |
| member@ethara.ai | Member@123 | member |

---

## 🔗 Important Links

- **GitHub Repository**: https://github.com/Siddhanth2509/Nexus-Pro-Web-App
- **Railway Dashboard**: https://railway.app/dashboard
- **Google OAuth Credentials**: https://console.cloud.google.com/apis/credentials
- **Google Client ID Used**: `303017670558-78ih5a84btn61pjsni2oluss41lgac7g.apps.googleusercontent.com`

---

## ✨ Next Steps

After deployment verification:

1. **Test Google OAuth** - Click "Sign in with Google" and authenticate
2. **Create new tasks** - Use the dashboard to create and manage tasks
3. **Invite team members** - Add users and manage roles
4. **Configure integrations** - Set up any external services

---

**Last Updated**: May 11, 2026  
**Deployment Status**: Ready for Railway (code pushed)  
**Local Testing**: ✅ All tests passed

