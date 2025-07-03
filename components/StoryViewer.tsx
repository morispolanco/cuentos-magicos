
import React, { useState, useRef, useEffect } from 'react';
import { StoryPage } from '../types';
import { PlayIcon } from './icons';

interface StoryViewerProps {
  pages: StoryPage[];
  storyTitle: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ pages, storyTitle }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  useEffect(() => {
    if(audioRef.current && pages[currentPage]?.audioUrl) {
      audioRef.current.src = pages[currentPage].audioUrl!;
      audioRef.current.load();
    }
  }, [currentPage, pages]);


  const page = pages[currentPage];

  if (!page) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-4xl font-chewy text-center text-blue-600 mb-6">{storyTitle}</h2>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row aspect-[4/3]">
        <div className="md:w-1/2 w-full h-1/2 md:h-full bg-gray-100 flex items-center justify-center">
          {page.imageUrl ? (
            <img src={page.imageUrl} alt={`Ilustración para la página ${currentPage + 1}`} className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Generando imagen...</div>
          )}
        </div>
        <div className="md:w-1/2 w-full h-1/2 md:h-full p-6 flex flex-col justify-between">
          <p className="text-gray-700 text-xl leading-relaxed flex-grow">{page.text}</p>
          <div className="flex items-center justify-between mt-4">
             {page.audioUrl && (
              <>
                <button onClick={playAudio} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-transform transform hover:scale-110">
                    <PlayIcon className="h-6 w-6" />
                </button>
                <audio ref={audioRef} src={page.audioUrl} className="hidden" />
              </>
            )}
             <div className="flex items-center gap-4 ml-auto">
                <button onClick={handlePrev} disabled={currentPage === 0} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">Anterior</button>
                <span className="text-gray-600 font-medium">{currentPage + 1} / {pages.length}</span>
                <button onClick={handleNext} disabled={currentPage === pages.length - 1} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">Siguiente</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
