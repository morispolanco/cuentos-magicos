
import React from 'react';
import { exportToHtml, exportToEpub, exportToWav } from '../services/exportService';
import { StoryPage } from '../types';
import { DownloadIcon } from './icons';

interface ExportControlsProps {
  pages: StoryPage[];
  storyTitle: string;
  isReady: boolean;
}

const ExportControls: React.FC<ExportControlsProps> = ({ pages, storyTitle, isReady }) => {
  if (!isReady) {
    return null;
  }

  const handleExportHtml = () => {
    exportToHtml(pages, storyTitle);
  };
  
  const handleExportEpub = () => {
    exportToEpub(pages, storyTitle);
  };
  
  const handleExportWav = () => {
    exportToWav(pages, storyTitle);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-4 mb-4">
        <DownloadIcon className="h-7 w-7 text-green-600" />
        <h3 className="text-2xl font-bold text-gray-800">Exportar tu Cuento</h3>
      </div>
      <p className="text-gray-600 mb-6">Guarda tu creación en diferentes formatos para compartirla y disfrutarla donde quieras.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={handleExportHtml} className="export-button bg-blue-500 hover:bg-blue-600">
          <span className="font-bold">HTML Interactivo</span>
          <span className="text-xs">Libro web con audio</span>
        </button>
        <button onClick={handleExportEpub} className="export-button bg-indigo-500 hover:bg-indigo-600">
          <span className="font-bold">EPUB</span>
          <span className="text-xs">Para e-readers</span>
        </button>
        <button onClick={handleExportWav} className="export-button bg-teal-500 hover:bg-teal-600">
          <span className="font-bold">Audiolibro (.WAV)</span>
          <span className="text-xs">Solo narración</span>
        </button>
      </div>
      <style>{`
        .export-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          color: white;
          border-radius: 0.75rem;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
          transform: translateY(0);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .export-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default ExportControls;
