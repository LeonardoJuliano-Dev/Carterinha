import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'custom_gemini_api_key';
const FALLBACK_KEY = '';

let cachedCustomKey: string | null = null;
let isCacheLoaded = false;

// Inicializa a cache assíncrona
AsyncStorage.getItem(STORAGE_KEY)
  .then((val) => {
    cachedCustomKey = val ? val.trim() : null;
    isCacheLoaded = true;
  })
  .catch(() => {
    isCacheLoaded = true;
  });

/**
 * Obtém a chave ativa da API do Gemini.
 * Dá prioridade à chave configurada pelo utilizador nas Definições,
 * seguida pela variável de ambiente EXPO_PUBLIC_GEMINI_API_KEY e pela chave embutida.
 */
export async function getEffectiveGeminiKey(): Promise<string> {
  if (!isCacheLoaded) {
    try {
      cachedCustomKey = await AsyncStorage.getItem(STORAGE_KEY);
    } catch {}
    isCacheLoaded = true;
  }

  if (cachedCustomKey && cachedCustomKey.trim().length > 0) {
    return cachedCustomKey.trim();
  }

  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  return FALLBACK_KEY;
}

/**
 * Define ou remove a chave personalizada do utilizador.
 */
export async function setCustomGeminiKey(key: string | null): Promise<void> {
  const clean = key ? key.trim() : null;
  cachedCustomKey = clean;
  if (clean && clean.length > 0) {
    await AsyncStorage.setItem(STORAGE_KEY, clean);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Modelos Gemini suportados por ordem de prioridade e velocidade.
 */
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

/**
 * Testa a validade de uma chave Gemini diretamente via chamada à API.
 */
export async function testGeminiConnection(
  testKey?: string
): Promise<{ success: boolean; message: string; model?: string }> {
  const key = testKey?.trim() || (await getEffectiveGeminiKey());
  if (!key) {
    return { success: false, message: 'Nenhuma chave de API Gemini configurada.' };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda estritamente: OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `Conexão bem-sucedida com o modelo Google ${model}!`,
          model,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Test Error ${model}]`, err?.message);
    }
  }

  return {
    success: false,
    message: 'Não foi possível autenticar com a Google. Verifique a chave e a ligação à internet.',
  };
}

/**
 * Executa uma chamada direta de texto ao Google Gemini a partir do smartphone.
 */
export async function callGeminiText(prompt: string, jsonMode: boolean = false): Promise<string | null> {
  const key = await getEffectiveGeminiKey();
  if (!key) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: jsonMode ? 'application/json' : 'text/plain',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const parts = candidates[0].content?.parts || [];
          const textParts = parts
            .filter((p: any) => p.text && !p.thought)
            .map((p: any) => p.text);
          if (textParts.length > 0) {
            return textParts.join('').trim();
          }
        }
      }
    } catch (err) {
      console.warn(`[Gemini Direct Text Error with ${model}]`, err);
    }
  }

  return null;
}

/**
 * Executa uma chamada direta de imagem (Vision OCR) ao Google Gemini a partir do smartphone.
 */
export async function callGeminiVision(
  prompt: string,
  imageBase64: string,
  jsonMode: boolean = true
): Promise<string | null> {
  const key = await getEffectiveGeminiKey();
  if (!key) return null;

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '').trim();

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: jsonMode ? 'application/json' : 'text/plain',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidates = data.candidates || [];
        if (candidates.length > 0) {
          const parts = candidates[0].content?.parts || [];
          const textParts = parts
            .filter((p: any) => p.text && !p.thought)
            .map((p: any) => p.text);
          if (textParts.length > 0) {
            return textParts.join('').trim();
          }
        }
      }
    } catch (err) {
      console.warn(`[Gemini Direct Vision Error with ${model}]`, err);
    }
  }

  return null;
}
