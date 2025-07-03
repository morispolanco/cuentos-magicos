
import React from 'react';
import { MagicWandIcon } from './icons';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-slate-900 bg-opacity-70 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      <div className="flex items-center space-x-4 p-6 bg-white rounded-lg shadow-2xl">
        <MagicWandIcon className="h-8 w-8 text-purple-600 animate-pulse" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
