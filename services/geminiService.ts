
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgeRange, StoryPage } from '../types';

let ai: GoogleGenAI | null = null;
let googleApiKey: string | null = null;

/**
 * Initializes the GoogleGenAI client with the provided API key.
 * This must be called once before any other service function is used.
 */
export function initAi(apiKey: string) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("La clave de API no puede estar vacía.");
  }
  ai = new GoogleGenAI({ apiKey });
  googleApiKey = apiKey;
}

/**
 * Returns the initialized GoogleGenAI client instance.
 * Throws an error if the client has not been initialized.
 */
function getAiClient(): GoogleGenAI {
  if (!ai) {
    throw new Error("El cliente de IA no ha sido inicializado. Por favor, introduce tu clave de API primero.");
  }
  return ai;
}

function getApiKey(): string {
    if (!googleApiKey) {
        throw new Error("El cliente de IA no ha sido inicializado. Por favor, introduce tu clave de API primero.");
    }
    return googleApiKey;
}

export async function generateStoryIdea(): Promise<string> {
  const prompt = "Sugiere 3 ideas concisas y creativas para un cuento infantil en español. Cada idea debe ser una sola frase. Separa cada idea con un salto de línea.";
  const client = getAiClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: prompt,
  });
  const ideas = response.text.split('\n').filter(idea => idea.trim() !== '');
  return ideas[Math.floor(Math.random() * ideas.length)] || "Un dragón que tiene miedo a la oscuridad.";
}

export async function generateCharacterDescription(idea: string): Promise<string> {
  const client = getAiClient();
  const prompt = `Basado en la idea de cuento '${idea}', describe en un párrafo detallado la apariencia visual del personaje principal para un cuento infantil. Incluye detalles de su ropa, pelo, cara y cualquier rasgo distintivo. La descripción debe ser en inglés para que la use un modelo de generación de imágenes.`;
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: prompt,
  });
  return response.text;
}

export async function generateStoryAndPrompts(
  idea: string,
  ageRange: AgeRange,
  numPages: number,
  characterDescription: string
): Promise<Omit<StoryPage, 'id'>[]> {
  const prompt = `
    Eres un escritor experto de cuentos infantiles en español.
    Genera un cuento para niños de ${ageRange}. La idea es: '${idea}'.
    El cuento debe tener exactamente ${numPages} páginas.
    Devuelve la respuesta EXCLUSIVAMENTE en formato JSON.
    El JSON debe ser un array de objetos. Cada objeto representa una página y debe tener dos claves:
    1. "text": El texto de la página en español. Debe ser breve, no más de 40 palabras.
    2. "imagePrompt": Una descripción detallada en INGLÉS para generar una imagen para esta página. Debe ser al estilo de 'digital art illustration for a children's book, vibrant colors, friendly characters'.
       IMPORTANTE: En CADA 'imagePrompt', incluye la siguiente descripción del personaje para mantener la consistencia: '${characterDescription}'.
    
    Ejemplo de respuesta:
    [
      {
        "text": "Había una vez un pequeño zorro llamado Fito que soñaba con tocar la luna.",
        "imagePrompt": "A small, cute orange fox named Fito, with big curious eyes and a fluffy tail, wearing a little blue scarf, looking up at a giant, glowing moon in a starry night sky. digital art illustration for a children's book, vibrant colors, friendly characters. ${characterDescription}"
      }
    ]
  `;

  const client = getAiClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  let jsonStr = response.text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    if (Array.isArray(parsedData)) {
        return parsedData.map(item => ({ text: item.text, imagePrompt: item.imagePrompt }));
    }
    throw new Error("Parsed data is not an array.");
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw response:", jsonStr);
    throw new Error("La IA no pudo generar la estructura del cuento. Por favor, inténtalo de nuevo.");
  }
}

export async function generateImage(prompt: string, useHqImages: boolean, apiKey?: string): Promise<string> {
    const getPlaceholderUrl = (isError: boolean) => {
        const width = 800;
        const height = 450;
        const bgColor = "F7F3E9";
        const text = isError ? "Error al crear la ilustración" : "Ilustración de ejemplo";
        const textColor = isError ? "DC2626" : "A0AEC0"; // Red for error, gray for placeholder
        return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}&font=chewy`;
    };

    if (!useHqImages) {
        return Promise.resolve(getPlaceholderUrl(false));
    }

    if (!apiKey) {
        throw new Error("La clave de API de Stability AI no ha sido proporcionada.");
    }

    try {
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('output_format', 'webp');
        formData.append('style_preset', 'digital-art');
        formData.append('negative_prompt', 'blurry, ugly, deformed, noisy, text, watermark, signature, words');
        formData.append('aspect_ratio', '16:9');

        const response = await fetch(
            "https://api.stability.ai/v2beta/stable-image/generate/core",
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'image/*',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error de Stability AI: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.errors && Array.isArray(errorJson.errors)) {
                    errorMessage = `Error de Stability AI: ${errorJson.errors.join(', ')}`;
                }
            } catch (e) {
                errorMessage = `Error de Stability AI (${response.status}): ${errorText}`;
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("No se pudo convertir la imagen a formato de datos."));
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("Error al generar la imagen con Stability AI:", error);
        throw error;
    }
}


export async function generateShortTitle(idea: string): Promise<string> {
  const prompt = `Crea un título corto y atractivo en español para un cuento infantil, de 5 palabras como máximo, basado en la idea: '${idea}'.
IMPORTANTE: Responde ÚNICAMENTE con el texto del título. No incluyas comillas, ni la palabra "Título:", ni ninguna otra explicación.
Ejemplo de respuesta para la idea "Un dragón con miedo a la oscuridad": El Dragón Miedoso`;
  const client = getAiClient();
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: prompt,
  });
  let title = response.text.trim();
  if (title.toLowerCase().startsWith('título:')) {
      title = title.substring(7).trim();
  }
  title = title.replace(/^"|"$/g, '');
  return title;
}

export async function generateNarrationAudio(text: string): Promise<string> {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: text
      }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "es-ES-Standard-A" // Voz de alta calidad en español
          }
        }
      }
    },
    model: "gemini-2.5-flash-preview-tts"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error from TTS API:', errorBody);
      throw new Error(`Error al generar la narración: ${response.statusText}`);
    }

    const data = await response.json();
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      console.error('Invalid TTS response structure:', data);
      throw new Error('No se recibieron datos de audio en la respuesta de la API.');
    }

    return audioData; // Base64 encoded PCM data
  } catch (error) {
    console.error('Fallo en la llamada a la API de TTS:', error);
    throw error;
  }
}
