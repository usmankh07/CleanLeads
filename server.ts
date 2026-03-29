import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is reachable" });
  });

  app.post("/api/onboarding", (req, res) => {
    const { name, email, phone, businessName, city } = req.body;
    
    console.log("New Onboarding Submission:", {
      name,
      email,
      phone,
      businessName,
      city,
      timestamp: new Date().toISOString()
    });

    // In a real app, you'd save this to a database or trigger an email
    res.json({ 
      success: true, 
      message: "Onboarding data received successfully",
      nextStep: "Verification"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
