
import React, { useState, useCallback } from 'react';
import { AgeRange, StoryPage, LoadingState } from './types';
import StoryForm from './components/StoryForm';
import StoryViewer from './components/StoryViewer';
import Loader from './components/Loader';
import ExportControls from './components/ExportControls';
import {
  initAi,
  generateStoryIdea,
  generateShortTitle,
  generateCharacterDescription,
  generateStoryAndPrompts,
  generateImage,
  generateNarrationAudio
} from './services/geminiService';
import ApiKeyInput from './components/ApiKeyInput';

const App: React.FC = () => {
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string>('');
  const [stabilityApiKey, setStabilityApiKey] = useState<string>('');

  const [idea, setIdea] = useState<string>('');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [ageRange, setAgeRange] = useState<AgeRange>(AgeRange.EARLY_CHILDHOOD);
  const [numPages, setNumPages] = useState<number>(8);
  const [useHqImages, setUseHqImages] = useState<boolean>(true);
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string>('');

  const handleApiKeySubmit = (googleKey: string, stabilityKey: string) => {
    try {
      initAi(googleKey);
      setStabilityApiKey(stabilityKey);
      setIsApiKeySet(true);
      setApiKeyError('');
    } catch (err: any) {
      console.error("API Key initialization failed:", err);
      setApiKeyError(err.message || 'Una de las claves de API proporcionada no es válida.');
      setIsApiKeySet(false);
    }
  };

  const handleSuggestIdea = async () => {
    setLoadingState({ isLoading: true, message: 'Buscando una idea...' });
    try {
      const newIdea = await generateStoryIdea();
      setIdea(newIdea);
    } catch (err: any) {
      setError(err.message || 'No se pudo sugerir una idea. Revisa tu clave de API e inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoadingState({ isLoading: false, message: '' });
    }
  };

  const handleGenerateStory = useCallback(async () => {
    if (!idea) {
      setError('Por favor, introduce una idea para el cuento.');
      return;
    }
    setError('');
    setStoryPages([]);
    setStoryTitle('');
    setLoadingState({ isLoading: true, message: 'Creando un título mágico...' });

    try {
      const title = await generateShortTitle(idea);
      setStoryTitle(title);

      setLoadingState({ isLoading: true, message: 'Diseñando el personaje principal...' });
      const characterDesc = await generateCharacterDescription(idea);
      
      setLoadingState({ isLoading: true, message: 'Escribiendo la historia...' });
      const pagesData = await generateStoryAndPrompts(idea, ageRange, numPages, characterDesc);
      const initialPages = pagesData.map((p, i) => ({ ...p, id: i }));
      setStoryPages(initialPages);

      let finalPages = [...initialPages];

      for (let i = 0; i < finalPages.length; i++) {
        const page = finalPages[i];
        
        setLoadingState({
            isLoading: true,
            message: `Creando ilustración (${i + 1}/${finalPages.length})...`,
        });

        const imageUrl = await generateImage(page.imagePrompt, useHqImages, stabilityApiKey);
        finalPages[i] = { ...page, imageUrl };
        setStoryPages([...finalPages]);
        
        setLoadingState({
            isLoading: true,
            message: `Generando narración (${i + 1}/${finalPages.length})...`,
        });
        const pcmData = await generateNarrationAudio(page.text);
        finalPages[i] = { ...finalPages[i], pcmData };
        setStoryPages([...finalPages]);
      }

      setLoadingState({ isLoading: false, message: '' });
    } catch (err: any) {
      console.error("Error general al generar el cuento:", err);
      
      let errorMessage = `Ocurrió un error inesperado. Por favor, revisa la consola.`;
      const errStr = String(err?.message || err);

      if (errStr.includes('API key not valid')) {
          errorMessage = "La clave de API de Google AI no es válida. Por favor, verifica tu clave.";
      } else if (errStr.includes('Stability AI')) {
          errorMessage = err.message;
      } else if (err.message) {
          errorMessage = `Ocurrió un error: ${err.message}`;
      }

      setError(errorMessage);
      setStoryPages([]); // Clear partially generated story on critical error
      setLoadingState({ isLoading: false, message: '' });
    }
  }, [idea, ageRange, numPages, useHqImages, stabilityApiKey]);

  const isStoryReady = storyPages.length > 0 && storyPages.every(p => p.imageUrl && p.pcmData);

  if (!isApiKeySet) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} initialError={apiKeyError} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-blue-50 to-white py-10 px-4">
      {loadingState.isLoading && <Loader message={loadingState.message} />}
      <div className="container mx-auto max-w-5xl space-y-8">
        <header className="text-center">
            <h1 className="text-5xl md:text-6xl font-chewy text-purple-700">
                Cuentos Mágicos AI
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Transforma tus ideas en maravillosos cuentos infantiles ilustrados y narrados.
            </p>
        </header>
        
        <main>
          <StoryForm
            idea={idea}
            setIdea={setIdea}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            numPages={numPages}
            setNumPages={setNumPages}
            useHqImages={useHqImages}
            setUseHqImages={setUseHqImages}
            onGenerate={handleGenerateStory}
            onSuggest={handleSuggestIdea}
            isLoading={loadingState.isLoading}
          />
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          
          {storyPages.length > 0 && (
            <>
              <StoryViewer pages={storyPages} storyTitle={storyTitle} isReady={isStoryReady} />
              <ExportControls pages={storyPages} storyTitle={storyTitle} isReady={isStoryReady} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
