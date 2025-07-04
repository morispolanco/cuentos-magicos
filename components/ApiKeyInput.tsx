
import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ApiKeyInputProps {
  onApiKeySubmit: (googleKey: string, stabilityKey: string) => void;
  initialError?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit, initialError }) => {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [stabilityApiKey, setStabilityApiKey] = useState('');
  const [error, setError] = useState(initialError || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleApiKey.trim() || !stabilityApiKey.trim()) {
      setError('Por favor, introduce ambas claves de API.');
      return;
    }
    setError('');
    onApiKeySubmit(googleApiKey, stabilityApiKey);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-100 via-blue-50 to-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <KeyIcon className="mx-auto h-12 w-12 text-purple-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Configura tus Claves de API</h2>
          <p className="mt-2 text-sm text-gray-600">
            Necesitas una clave de Google AI para el texto y una de Stability AI para las imágenes.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div>
            <label htmlFor="google-api-key" className="block text-sm font-medium text-gray-700 mb-1">
              Clave de API de Google AI (para texto)
            </label>
            <input
              id="google-api-key"
              name="google-api-key"
              type="password"
              autoComplete="off"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="Introduce tu clave de Google AI"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
            />
            <div className="text-right mt-1">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-purple-600 hover:text-purple-500">
                Consigue una clave aquí
                </a>
            </div>
          </div>
          
          <div className="pt-2">
            <label htmlFor="stability-api-key" className="block text-sm font-medium text-gray-700 mb-1">
              Clave de API de Stability AI (para imágenes)
            </label>
            <input
              id="stability-api-key"
              name="stability-api-key"
              type="password"
              autoComplete="off"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Introduce tu clave de Stability AI"
              value={stabilityApiKey}
              onChange={(e) => setStabilityApiKey(e.target.value)}
            />
            <div className="text-right mt-1">
                <a href="https://platform.stability.ai/account/keys" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:text-green-500">
                Consigue una clave aquí
                </a>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-transform transform hover:scale-105"
            >
              Guardar y Empezar
            </button>
          </div>
        </form>
         <div className="text-center text-xs text-gray-500 pt-4">
            <p>Tus claves de API no se guardan en ningún servidor y solo se usan en tu navegador.</p>
          </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;
