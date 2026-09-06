import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

function generateDefaultSchoolSvg(prompt: string): string {
  const cleanPrompt = (prompt || "Quêssua Educação").replace(/<[^>]*>/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1e3a8a"/>
      <stop offset="100%" stopColor="#3b82f6"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f59e0b"/>
      <stop offset="100%" stopColor="#fbbf24"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.25"/>
    </filter>
  </defs>

  <!-- Escudo Principal -->
  <path d="M 200 30 C 300 30 350 70 350 170 C 350 280 250 345 200 375 C 150 345 50 280 50 170 C 50 70 100 30 200 30 Z" 
        fill="url(#shieldGrad)" stroke="url(#goldGrad)" stroke-width="8" filter="url(#shadow)"/>

  <!-- Borda interna dourada -->
  <path d="M 200 48 C 285 48 330 82 330 170 C 330 265 242 325 200 352 C 158 325 70 265 70 170 C 70 82 115 48 200 48 Z" 
        fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="6,4"/>

  <!-- Sol do Conhecimento -->
  <circle cx="200" cy="130" r="32" fill="url(#goldGrad)"/>
  <g stroke="url(#goldGrad)" stroke-width="4" stroke-linecap="round">
    <line x1="200" y1="84" x2="200" y2="72"/>
    <line x1="200" y1="176" x2="200" y2="188"/>
    <line x1="154" y1="130" x2="142" y2="130"/>
    <line x1="246" y1="130" x2="258" y2="130"/>
    <line x1="167" y1="97" x2="158" y2="88"/>
    <line x1="233" y1="163" x2="242" y2="172"/>
    <line x1="167" y1="163" x2="158" y2="172"/>
    <line x1="233" y1="97" x2="242" y2="88"/>
  </g>

  <!-- Livro Aberto do Saber -->
  <g transform="translate(200, 220)">
    <path d="M 0 -10 C -25 -25 -65 -20 -90 -5 L -90 40 C -65 25 -25 20 0 35 C 25 20 65 25 90 40 L 90 -5 C 65 -20 25 -25 0 -10 Z" 
          fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <!-- Linhas do Livro -->
    <path d="M -75 5 C -55 -5 -30 -2 -12 8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <path d="M -75 18 C -55 8 -30 11 -12 21" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <path d="M 12 8 C 30 -2 55 -5 75 5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <path d="M 12 21 C 30 11 55 8 75 18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
    <!-- Centro do Livro -->
    <line x1="0" y1="-10" x2="0" y2="35" stroke="#64748b" stroke-width="3"/>
  </g>

  <!-- Ramos de Louro -->
  <g fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round">
    <path d="M 85 240 C 80 290 120 330 160 345"/>
    <circle cx="95" cy="255" r="4" fill="url(#goldGrad)"/>
    <circle cx="115" cy="285" r="4" fill="url(#goldGrad)"/>
    <circle cx="140" cy="315" r="4" fill="url(#goldGrad)"/>

    <path d="M 315 240 C 320 290 280 330 240 345"/>
    <circle cx="305" cy="255" r="4" fill="url(#goldGrad)"/>
    <circle cx="285" cy="285" r="4" fill="url(#goldGrad)"/>
    <circle cx="260" cy="315" r="4" fill="url(#goldGrad)"/>
  </g>

  <!-- Faixa de Texto -->
  <rect x="70" y="278" width="260" height="34" rx="17" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="2"/>
  <text x="200" y="300" text-anchor="middle" fill="#ffffff" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" letter-spacing="1">
    QUÊSSUA • EDUCAÇÃO
  </text>
</svg>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // SVG AI generation proxy
  app.post("/api/svgai/generate", async (req, res) => {
    try {
      const { prompt, model = "classic", variations = 1 } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          success: false,
          error: "O campo 'prompt' é obrigatório.",
        });
      }

      const apiKey = process.env.SVGAI_API_KEY;

      if (!apiKey) {
        // Fallback when API key is not yet set in environment
        const generatedSvg = generateDefaultSchoolSvg(prompt);
        return res.json({
          success: true,
          svg: generatedSvg,
          isSimulated: true,
          message: "A chave SVGAI_API_KEY não foi detetada no ambiente. Um brasão vetorial emblemático de Quêssua foi gerado como demonstração.",
        });
      }

      // Proxy request to official svgai.org endpoint
      const response = await fetch("https://www.svgai.org/api/v1/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model,
          variations,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `SVG AI respondeu com código ${response.status}`;
        return res.status(response.status).json({
          success: false,
          error: errorMsg,
          raw: data,
        });
      }

      // Extract SVG from response payload
      let svgCode = data.svg || data.svgText;
      if (!svgCode && Array.isArray(data.data) && data.data.length > 0) {
        svgCode = data.data[0]?.svg || data.data[0]?.svgText || data.data[0]?.content;
      }
      if (!svgCode && typeof data === "string" && data.includes("<svg")) {
        svgCode = data;
      }

      if (!svgCode) {
        svgCode = generateDefaultSchoolSvg(prompt);
      }

      return res.json({
        success: true,
        svg: svgCode,
        data,
      });
    } catch (error: any) {
      console.error("Erro na rota /api/svgai/generate:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Erro de comunicação com o servidor SVG AI",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
