import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildCrayonFurnitureSvg,
  buildFixedAiFurniturePrompt,
  svgMarkupToDataUrl,
  type AiFurnitureSvgSpec,
} from './src/utils/therapyRoomLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/therapy-room/generate-furniture', async (req, res) => {
    const rawObjectName = typeof req.body?.objectName === 'string' ? req.body.objectName.trim() : '';
    if (!rawObjectName) {
      res.status(400).json({
        error: 'Digite o nome do objeto ou móvel que deseja criar.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    const objectName = rawObjectName.slice(0, 120);
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Chave Gemini (GEMINI_API_KEY) não configurada. Adicione ou selecione uma chave no painel Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const fixedPrompt = buildFixedAiFurniturePrompt(objectName);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Crie os traços vetoriais SVG (viewBox 0 0 320 320, margem segura entre x=36..284 e y=36..284) para o objeto "${objectName}" seguindo exatamente este estilo visual:\n${fixedPrompt}\n\nRegras do desenho:\n- Desenhe em perspectiva isométrica ou 3/4 de ponto de fuga único, harmonizando com uma sala de terapia editorial.\n- Use 8 a 22 caminhos SVG (<path>) expressivos e detalhados com curvas orgânicas (C, Q, L, M) para formar o contorno e detalhes estruturais reconhecíveis de "${objectName}".\n- Atribua role="primary_blue" para contornos principais (#2071B8), role="secondary_blue" para hachuras/detalhes finos (#2071B8), e use 1 a 4 elementos com role="pink_accent" ou role="pink_fill" (#F8CCE1) em almofadas, estofado, cúpula ou detalhes sutis.\n- Não desenhe piso ou fundo no vetor — apenas o objeto isolado e centralizado.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Você é uma ilustradora editorial especializada em desenhos a lápis de cera / pastel seco para zines literários. Retorne apenas JSON válido no schema solicitado.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              label: {
                type: Type.STRING,
                description: 'Nome curto e elegante do objeto em português (máx 28 caracteres).',
              },
              paths: {
                type: Type.ARRAY,
                description: 'Lista de caminhos SVG <path> no sistema de coordenadas 0..320 x 0..320.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    d: {
                      type: Type.STRING,
                      description: 'Atributo SVG d válido (ex: M60 220 L240 220 ...).',
                    },
                    role: {
                      type: Type.STRING,
                      description: 'Um entre: primary_blue, secondary_blue, pink_accent, pink_fill.',
                    },
                    strokeWidth: {
                      type: Type.NUMBER,
                      description: 'Espessura do traço entre 2 e 6.',
                    },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      let parsed: Partial<AiFurnitureSvgSpec> = {};
      try {
        parsed = JSON.parse(rawText) as Partial<AiFurnitureSvgSpec>;
      } catch {
        parsed = {};
      }

      const normalizedSpec: AiFurnitureSvgSpec = {
        label:
          typeof parsed.label === 'string' && parsed.label.trim()
            ? parsed.label.trim().slice(0, 32)
            : objectName.slice(0, 32),
        paths: Array.isArray(parsed.paths) ? parsed.paths : [],
      };

      const transparentSvg = buildCrayonFurnitureSvg(normalizedSpec, { includeBlackBg: false });
      const pitchBlackSvg = buildCrayonFurnitureSvg(normalizedSpec, { includeBlackBg: true });

      res.json({
        id: `ai-furniture-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: normalizedSpec.label,
        imageUrl: svgMarkupToDataUrl(transparentSvg),
        previewOnBlackUrl: svgMarkupToDataUrl(pitchBlackSvg),
        promptUsed: fixedPrompt,
        isAiGenerated: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao gerar móvel com IA.';
      const status =
        message.includes('403') || message.includes('PERMISSION_DENIED')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : message.includes('400') || message.includes('API_KEY_INVALID')
              ? 400
              : 500;

      res.status(status).json({
        error:
          status === 400 || status === 403
            ? 'Erro de autenticação na API do Gemini. Verifique sua chave em Settings > Secrets.'
            : status === 429
              ? 'Limite de requisições atingido na API do Gemini. Aguarde alguns instantes ou verifique sua chave em Settings > Secrets.'
              : `Não foi possível gerar o móvel agora: ${message}`,
        code: status === 429 ? 'RESOURCE_EXHAUSTED' : status === 403 ? 'PERMISSION_DENIED' : 'GEMINI_ERROR',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Megera Cordial server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
