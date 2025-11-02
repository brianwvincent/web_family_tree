import React from 'react';
import Logo from './icons/Logo';
import TreeIcon from './icons/TreeIcon';
import UploadIcon from './icons/UploadIcon';
import SparklesIcon from './icons/SparklesIcon';

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);


const SplashPage: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700/50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#/" className="flex items-center space-x-2">
            <Logo className="w-10 h-10" />
            <span className="text-2xl font-bold">HeirGraph</span>
          </a>
          <a href="#/app" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
            Launch App
          </a>
        </nav>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="text-center py-20 px-6">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">Visualize Your Legacy</h1>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
            Build, explore, and share your family history with beautiful, interactive tree diagrams. Uncover your story with HeirGraph.
          </p>
          <a href="#/app" className="mt-8 inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-10 rounded-lg text-lg transition-transform transform hover:scale-105 duration-300">
            Get Started for Free
          </a>
          <div className="mt-16 container mx-auto max-w-5xl p-4 bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">App Screenshot Placeholder</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-800/40">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-2">Powerful Features, Simple Interface</h2>
            <p className="text-lg text-gray-400 mb-16">Everything you need to map your ancestry.</p>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
                  <TreeIcon className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Interactive Visualization</h3>
                <p className="text-gray-400">Pan, zoom, and explore your family tree in a dynamic and responsive interface. Click on any member to see detailed relationships.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-sky-500/20 p-4 rounded-full mb-4">
                  <UploadIcon className="w-12 h-12 text-sky-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Easy Data Import</h3>
                <p className="text-gray-400">Get started in seconds. Upload a simple CSV file or add family members manually one by one. Export your work to standard formats.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-amber-500/20 p-4 rounded-full mb-4">
                  <SparklesIcon className="w-12 h-12 text-amber-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">AI-Powered Portraits</h3>
                <p className="text-gray-400">Bring your family tree to life! Generate beautiful, artistic representations of your ancestry using cutting-edge AI technology.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-lg text-gray-400 mb-16">Start for free and upgrade as your tree grows.</p>
            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col">
                <h3 className="text-2xl font-semibold text-emerald-400">Free</h3>
                <p className="mt-2 text-gray-400">For getting started</p>
                <p className="mt-6 text-5xl font-bold">$0</p>
                <ul className="mt-8 space-y-4 text-left flex-grow">
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-emerald-400 mr-2" />Up to 50 family members</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-emerald-400 mr-2" />CSV & Manual Entry</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-emerald-400 mr-2" />PNG & SVG Export</li>
                </ul>
                <a href="#/app" className="mt-8 block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors">
                  Start Building
                </a>
              </div>
              {/* Plus Plan */}
              <div className="bg-indigo-600/20 border-2 border-indigo-500 rounded-xl p-8 flex flex-col shadow-2xl scale-105">
                <h3 className="text-2xl font-semibold text-indigo-300">Plus</h3>
                <p className="mt-2 text-indigo-200">For the dedicated historian</p>
                <p className="mt-6 text-5xl font-bold">$5<span className="text-lg font-medium text-gray-300">/mo</span></p>
                <ul className="mt-8 space-y-4 text-left flex-grow">
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-indigo-300 mr-2" />Unlimited family members</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-indigo-300 mr-2" />Cloud Storage & Sync</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-indigo-300 mr-2" />Advanced GEDCOM Export</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-indigo-300 mr-2" />5 AI Image Credits / month</li>
                </ul>
                 <a href="#/app" className="mt-8 block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors">
                  Choose Plus
                </a>
              </div>
              {/* Pro Plan */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col">
                <h3 className="text-2xl font-semibold text-amber-400">Pro</h3>
                <p className="mt-2 text-gray-400">For collaborative projects</p>
                <p className="mt-6 text-5xl font-bold">$10<span className="text-lg font-medium text-gray-300">/mo</span></p>
                <ul className="mt-8 space-y-4 text-left flex-grow">
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-amber-400 mr-2" />All features from Plus</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-amber-400 mr-2" />Family Collaboration</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-amber-400 mr-2" />20 AI Image Credits / month</li>
                  <li className="flex items-center"><CheckIcon className="w-6 h-6 text-amber-400 mr-2" />Priority Support</li>
                </ul>
                 <a href="#/app" className="mt-8 block w-full text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors">
                  Choose Pro
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 mt-12">
          <div className="container mx-auto px-6 py-6 text-center text-gray-500">
              <p>
                  Powered by <a href="https://VincentAnalytica.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">VincentAnalytica.com</a>
              </p>
          </div>
      </footer>
    </div>
  );
};

export default SplashPage;