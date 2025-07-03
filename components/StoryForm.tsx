
import React from 'react';
import { AgeRange } from '../types';
import { MagicWandIcon, BookOpenIcon, SparklesIcon } from './icons';

interface StoryFormProps {
  idea: string;
  setIdea: (idea: string) => void;
  ageRange: AgeRange;
  setAgeRange: (age: AgeRange) => void;
  numPages: number;
  setNumPages: (pages: number) => void;
  useHqImages: boolean;
  setUseHqImages: (use: boolean) => void;
  onGenerate: () => void;
  onSuggest: () => void;
  isLoading: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({
  idea,
  setIdea,
  ageRange,
  setAgeRange,
  numPages,
  setNumPages,
  useHqImages,
  setUseHqImages,
  onGenerate,
  onSuggest,
  isLoading,
}) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <MagicWandIcon className="h-8 w-8 text-purple-600"/>
        <h2 className="text-3xl font-bold text-gray-800">Crea tu Cuento</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="story-idea" className="block text-sm font-medium text-gray-700 mb-2">
            1. ¿De qué tratará tu cuento?
          </label>
          <div className="flex gap-2">
            <textarea
              id="story-idea"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="Ej: Un conejo astronauta que busca la zanahoria más grande del universo."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={onSuggest}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2 transition duration-200"
              title="Sugerir una idea con IA"
            >
              <SparklesIcon className="h-5 w-5"/>
              <span>Sugerir</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age-range" className="block text-sm font-medium text-gray-700 mb-2">
              2. ¿Para qué edad?
            </label>
            <select
              id="age-range"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value as AgeRange)}
              disabled={isLoading}
            >
              {Object.values(AgeRange).map((age) => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="num-pages" className="block text-sm font-medium text-gray-700 mb-2">
              3. ¿Cuántas páginas? (Máx. 24)
            </label>
            <input
              type="number"
              id="num-pages"
              min="2"
              max="24"
              step="2"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              value={numPages}
              onChange={(e) => setNumPages(Math.min(24, Math.max(2, parseInt(e.target.value, 10) || 2)))}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="hq-images" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700">
              <input
                  type="checkbox"
                  id="hq-images"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  checked={useHqImages}
                  onChange={(e) => setUseHqImages(e.target.checked)}
                  disabled={isLoading}
              />
              <span>Usar ilustraciones de IA (alta calidad)</span>
          </label>
          <p className="text-xs text-gray-500 ml-7 mt-1">Desactiva esta opción para usar marcadores de posición gratuitos.</p>
        </div>

        <div>
          <button
            onClick={onGenerate}
            disabled={isLoading || !idea}
            className="w-full bg-purple-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg transition-transform duration-200 transform hover:scale-105"
          >
            <BookOpenIcon className="h-6 w-6"/>
            <span>¡Crear mi Cuento Mágico!</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryForm;
