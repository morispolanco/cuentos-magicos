
import React, { useState, useCallback } from 'react';
import { AgeRange, StoryPage, LoadingState } from './types';
import StoryForm from './components/StoryForm';
import StoryViewer from './components/StoryViewer';
import Loader from './components/Loader';
import ExportControls from './components/ExportControls';
import {
  generateStoryIdea,
  generateShortTitle,
  generateCharacterDescription,
  generateStoryAndPrompts,
  generateImage,
  generateAudio
} from './services/geminiService';
import { createWavBlobFromPcm } from './services/exportService';

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.error) {
        reject(reader.error);
      } else {
        resolve(reader.result as string);
      }
    };
    reader.readAsDataURL(blob);
  });
};

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [ageRange, setAgeRange] = useState<AgeRange>(AgeRange.EARLY_CHILDHOOD);
  const [numPages, setNumPages] = useState<number>(8);
  const [useHqImages, setUseHqImages] = useState<boolean>(true);
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string>('');

  const handleSuggestIdea = async () => {
    setLoadingState({ isLoading: true, message: 'Buscando una idea...' });
    try {
      const newIdea = await generateStoryIdea();
      setIdea(newIdea);
    } catch (err) {
      setError('No se pudo sugerir una idea. Inténtalo de nuevo.');
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
      // 0. Generate Short Title
      const title = await generateShortTitle(idea);
      setStoryTitle(title);

      // 1. Generate character description for consistency
      setLoadingState({ isLoading: true, message: 'Creando la base de tu cuento...' });
      const characterDesc = await generateCharacterDescription(idea);
      setLoadingState({ isLoading: true, message: 'Escribiendo la historia...' });
      
      // 2. Generate story text and image prompts
      const pagesData = await generateStoryAndPrompts(idea, ageRange, numPages, characterDesc);
      const initialPages = pagesData.map((p, i) => ({ ...p, id: i }));
      setStoryPages(initialPages);

      // 3. Generate images and audio in parallel
      for (let i = 0; i < initialPages.length; i++) {
          const currentPageIndex = i;
          setLoadingState({
              isLoading: true,
              message: `Creando página ${currentPageIndex + 1}/${numPages}... (Ilustración y narración)`
          });

          const page = initialPages[currentPageIndex];

          const [imageUrl, pcmData] = await Promise.all([
              generateImage(page.imagePrompt, useHqImages),
              generateAudio(page.text)
          ]);
          
          const wavBlob = createWavBlobFromPcm(pcmData);
          const audioUrl = await blobToDataUrl(wavBlob);

          setStoryPages(prevPages =>
              prevPages.map(p =>
                  p.id === currentPageIndex ? { ...p, imageUrl, audioUrl, pcmData } : p
              )
          );
      }

      setLoadingState({ isLoading: false, message: '' });
    } catch (err: any) {
      console.error(err);
      setError(`Ocurrió un error: ${err.message}`);
      setLoadingState({ isLoading: false, message: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea, ageRange, numPages, useHqImages]);

  const isStoryReady = storyPages.length > 0 && storyPages.every(p => p.imageUrl && p.audioUrl);

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
              <StoryViewer pages={storyPages} storyTitle={storyTitle} />
              <ExportControls pages={storyPages} storyTitle={storyTitle} isReady={isStoryReady} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
