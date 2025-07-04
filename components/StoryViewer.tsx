
import React, { useState, useEffect, useRef } from 'react';
import { StoryPage } from '../types';

interface StoryViewerProps {
  pages: StoryPage[];
  storyTitle: string;
  isReady: boolean;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ pages, storyTitle, isReady }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const playPcmAudio = async (base64Pcm: string) => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API not supported", e);
        return;
      }
    }
    const audioContext = audioContextRef.current;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (!base64Pcm) return;

    try {
      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcmData = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000); // 1 channel, 24000 sample rate
      audioBuffer.copyToChannel(floatData, 0);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      sourceNodeRef.current = source;
    } catch (e) {
      console.error("Failed to play PCM audio:", e);
    }
  };


  useEffect(() => {
    if (isReady && pages[currentPage]?.pcmData) {
      playPcmAudio(pages[currentPage].pcmData!);
    }

    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
      }
    };
  }, [currentPage, pages, isReady]);
  
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

  const page = pages[currentPage];

  if (!page) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-4xl font-chewy text-center text-blue-600 mb-6">{storyTitle}</h2>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
        <div className="w-full md:w-3/5 aspect-video bg-gray-100 flex items-center justify-center">
          {page.imageUrl ? (
            <img src={page.imageUrl} alt={`Ilustración para la página ${currentPage + 1}`} className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Generando imagen...</div>
          )}
        </div>
        <div className="w-full md:w-2/5 p-6 flex flex-col justify-between">
          <p className="text-gray-700 text-xl leading-relaxed flex-grow">{page.text}</p>
          <div className="flex items-center justify-end mt-4">
             <div className="flex items-center gap-4">
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
