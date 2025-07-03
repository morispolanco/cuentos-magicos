
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgeRange, StoryPage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateStoryIdea(): Promise<string> {
  const prompt = "Sugiere 3 ideas concisas y creativas para un cuento infantil en español. Cada idea debe ser una sola frase. Separa cada idea con un salto de línea.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    const ideas = response.text.split('\n').filter(idea => idea.trim() !== '');
    return ideas[Math.floor(Math.random() * ideas.length)] || "Un dragón que tiene miedo a la oscuridad.";
  } catch (error) {
    console.error("Error generating story idea:", error);
    return "Un gatito que aprende a volar con globos.";
  }
}

export async function generateCharacterDescription(idea: string): Promise<string> {
  const prompt = `Basado en la idea de cuento '${idea}', describe en un párrafo detallado la apariencia visual del personaje principal para un cuento infantil. Incluye detalles de su ropa, pelo, cara y cualquier rasgo distintivo. La descripción debe ser en inglés para que la use un modelo de generación de imágenes.`;
  const response = await ai.models.generateContent({
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

  const response = await ai.models.generateContent({
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

export async function generateImage(prompt: string, useHqImages: boolean): Promise<string> {
  const getPlaceholderUrl = (isError: boolean) => {
    const width = 800;
    const height = 600;
    const bgColor = "F7F3E9";
    const text = isError ? "Error al crear la ilustración" : "Ilustración de ejemplo";
    const textColor = isError ? "DC2626" : "A0AEC0"; // Red for error, gray for placeholder
    return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}&font=chewy`;
  };

  if (!useHqImages) {
    return Promise.resolve(getPlaceholderUrl(false));
  }

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg'
        },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error("La API de imágenes no devolvió una imagen válida.");
    }
  } catch (error) {
    console.error("Error al generar la imagen con la API de Imagen:", error);
    console.warn("La generación de imágenes ha fallado. Se utilizará una imagen de marcador de posición.");
    return getPlaceholderUrl(true);
  }
}

export async function generateShortTitle(idea: string): Promise<string> {
  const prompt = `Crea un título corto y atractivo en español para un cuento infantil, de 5 palabras como máximo, basado en la idea: '${idea}'.
IMPORTANTE: Responde ÚNICAMENTE con el texto del título. No incluyas comillas, ni la palabra "Título:", ni ninguna otra explicación.
Ejemplo de respuesta para la idea "Un dragón con miedo a la oscuridad": El Dragón Miedoso`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    let title = response.text.trim();
    // Clean up the response to ensure only the title remains
    if (title.toLowerCase().startsWith('título:')) {
        title = title.substring(7).trim();
    }
    // Remove quotes from start and end
    title = title.replace(/^"|"$/g, '');
    return title;
  } catch (error) {
    console.error("Error generating short title:", error);
    return idea.split(' ').slice(0, 5).join(' ');
  }
}

export async function generateAudio(text: string): Promise<string> {
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
  const apiKey = process.env.API_KEY;

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "contents": [{
        "parts": [{
          "text": `Narra el siguiente texto: ${text}`
        }]
      }],
      "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {
          "voiceConfig": {
            "prebuiltVoiceConfig": { "voiceName": "kore" }
          }
        }
      },
      "model": "gemini-2.5-flash-preview-tts",
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Server responded with ${response.status}: ${response.statusText}`;
    try {
        const errorBody = JSON.parse(responseText);
        console.error("TTS API Error:", JSON.stringify(errorBody, null, 2));
        if (errorBody?.error?.message) {
            errorMessage = errorBody.error.message;
        }
    } catch (e) {
        console.error("TTS API Error (non-JSON response):", responseText);
        if (responseText) {
            errorMessage = responseText;
        }
    }
    throw new Error(`Failed to generate audio: ${errorMessage}`);
  }

  try {
    const data = JSON.parse(responseText);
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
        console.error("Invalid TTS response structure:", data);
        throw new Error("The API returned an unexpected response structure.");
    }
    return audioData;
  } catch (e) {
      console.error("Failed to parse successful TTS response:", responseText);
      throw new Error("Failed to parse audio data from the API.");
  }
}
