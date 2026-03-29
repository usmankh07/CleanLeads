# 🚀 CleanLeads - Get More Cleaning Jobs

**CleanLeads** is a high-converting lead generation funnel designed specifically for cleaning businesses. It helps you capture potential customer inquiries and manage them through a streamlined admin dashboard.

---

## ✨ Key Features

- **High-Converting Landing Page**: Modern, mobile-responsive design optimized for lead capture.
- **Admin Dashboard**: A secure area to view, search, and manage leads in real-time.
- **Instant Lead Capture**: Integration with Firebase Firestore for reliable data storage.
- **Secure Authentication**: Google Login for admin access, ensuring only you can see your data.
- **Deployment Ready**: Built-in support for Netlify and other modern hosting platforms.

---

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.0
- **Animations**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **Backend/DB**: Firebase Firestore & Firebase Auth

---

## 🚀 Quick Start

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="your-database-id"
```

### 4. Run Locally
```bash
npm run dev
```
The app will be available at `http://localhost:5173/`.

---

## 🌍 Deployment on Netlify

1. **Connect your GitHub repository** to Netlify.
2. **Set Build Settings**:
   - Build Command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Add your `.env` variables in the Netlify dashboard under **Site Settings > Build & Deploy > Environment**.
4. **Firebase Setup**: Don't forget to add your Netlify domain to the "Authorized domains" list in your Firebase Authentication settings.

---

## 📜 License

Created by [usmankh07](https://github.com/usmankh07).
