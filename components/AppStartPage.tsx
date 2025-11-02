import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';
import AddIcon from './icons/AddIcon';
import Logo from './icons/Logo';

interface AppStartPageProps {
  onFileUpload: (file: File) => void;
  onStartManual: () => void;
}

const AppStartPage: React.FC<AppStartPageProps> = ({ onFileUpload, onStartManual }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 font-sans p-4 py-12">
      <header className="text-center">
        <Logo className="w-32 h-32 mx-auto" />
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wider uppercase mt-4">HeirGraph</h1>
        <p className="mt-2 text-xl md:text-2xl text-[#E6B33D] italic">
            Ancestral Graphs
        </p>
        <p className="mt-6 text-xl md:text-2xl font-light text-gray-300 max-w-3xl mx-auto">
          An interactive way to explore your family history.
        </p>
        <p className="mt-2 text-lg text-gray-400 max-w-2xl">
          Visualize your heritage by uploading a CSV or adding members one by one.
        </p>
      </header>

      <main className="mt-12 flex flex-col md:flex-row gap-6 items-start">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center">
          <button
            onClick={triggerFileSelect}
            className="flex flex-col items-center justify-center w-64 h-40 p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-emerald-500 hover:text-white transition-all duration-300"
          >
            <UploadIcon className="w-10 h-10 mb-3" />
            <span className="text-xl font-semibold">Upload CSV File</span>
          </button>
        </div>
        <button
          onClick={onStartManual}
          className="flex flex-col items-center justify-center w-64 h-40 p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-indigo-500 hover:text-white transition-all duration-300"
        >
          <AddIcon className="w-10 h-10 mb-3" />
          <span className="text-xl font-semibold">Add Members Manually</span>
        </button>
      </main>

      <section className="mt-12 w-full max-w-2xl text-left bg-gray-800/40 p-6 rounded-lg border border-gray-700/50">
        <h2 className="text-xl font-semibold text-center text-gray-200 mb-4">CSV File Format Guide</h2>
        <p className="text-gray-400 mb-4">
          To upload your family tree, the CSV file must contain exactly two columns with the headers <code className="bg-gray-700 text-emerald-300 px-1 py-0.5 rounded text-sm">parent</code> and <code className="bg-gray-700 text-emerald-300 px-1 py-0.5 rounded text-sm">child</code>. Each row represents a direct relationship.
        </p>
        <p className="text-gray-400 mb-2 font-semibold">Example:</p>
        <pre className="bg-gray-900/70 p-4 rounded-md text-gray-300 text-sm overflow-x-auto">
          <code>
{`parent,child
Grandfather,Father
Grandmother,Father
Father,Son
Father,Daughter`}
          </code>
        </pre>
      </section>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>
            Powered by <a href="https://VincentAnalytica.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">VincentAnalytica.com</a>
        </p>
      </footer>
    </div>
  );
};

export default AppStartPage;
