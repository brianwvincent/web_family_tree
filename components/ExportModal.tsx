import React, { useState } from 'react';
import { AppNode, AppLink, FamilyTreeApi, HierarchicalNode } from '../types';
import CloseIcon from './icons/CloseIcon';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';
import { GoogleGenAI, Modality } from "@google/genai";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: AppNode[];
  links: AppLink[];
  familyTreeRef: React.RefObject<FamilyTreeApi>;
}

type View = 'options' | 'prompt' | 'loading' | 'result' | 'error';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, nodes, links, familyTreeRef }) => {
  const [view, setView] = useState<View>('options');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow for closing animation
    setTimeout(() => {
        setView('options');
        setGeneratedImage(null);
        setApiError(null);
        setPrompt('');
    }, 300);
  };
  
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const header = 'parent,child\n';
    const csvContent = links.map(l => `"${l.source}","${l.target}"`).join('\n');
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'family-tree.csv');
  };

  const handleDownloadSVG = () => {
    const svgData = familyTreeRef.current?.getSVGData();
    if (svgData) {
      const blob = new Blob([svgData.svgString], { type: 'image/svg+xml' });
      downloadFile(blob, 'family-tree.svg');
    }
  };

  const handleDownloadPNG = () => {
    const svgData = familyTreeRef.current?.getSVGData();
    if (svgData) {
      const { svgString, width, height } = svgData;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) {
            downloadFile(blob, 'family-tree.png');
          }
        }, 'image/png');
      };
      img.onerror = () => {
        console.error("Error loading SVG image for PNG conversion.");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handlePreparePrompt = () => {
    const nodeMap: { [key: string]: { name: string; children: any[] } } = {};
    nodes.forEach(node => {
        nodeMap[node.id] = { name: node.id, children: [] };
    });

    const childrenIds = new Set<string>();
    links.forEach(link => {
        if (nodeMap[link.source] && nodeMap[link.target]) {
            nodeMap[link.source].children.push(nodeMap[link.target]);
            childrenIds.add(link.target);
        }
    });

    const roots = Object.values(nodeMap).filter(node => !childrenIds.has(node.name));

    let treeJsonStructure: any;
    if (roots.length === 0) {
        treeJsonStructure = Object.keys(nodeMap).length > 0 ? Object.values(nodeMap)[0] : {};
    } else if (roots.length > 1) {
        treeJsonStructure = { name: "Family", children: roots };
    } else {
        treeJsonStructure = roots[0];
    }

    const replacer = (key: string, value: any) => (key === 'children' && Array.isArray(value) && value.length === 0) ? undefined : value;
    const treeJsonString = JSON.stringify(treeJsonStructure, replacer, 2);

    const generatedPrompt = `Create an artistic and symbolic image representing the following family tree structure:

\`\`\`json
${treeJsonString}
\`\`\`

The image should convey a sense of legacy, connection, and time. Use the visual metaphor of a sprawling, ancient tree with glowing patterns on its bark, under a celestial sky. The style should be digital painting, epic, detailed, and magical.`;
    
    setPrompt(generatedPrompt);
    setView('prompt');
  }

  const handleGenerateImage = async () => {
    setView('loading');
    setApiError(null);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        let foundImage = false;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                    setView('result');
                    foundImage = true;
                    break; 
                }
            }
        }
        
        if (!foundImage) {
            throw new Error("API returned no images.");
        }
    } catch (e) {
        console.error(e);
        setApiError('Failed to generate image. Please try again.');
        setView('error');
    }
  };
  
  const handleDownloadGeneratedImage = async () => {
    if (!generatedImage) return;
    const response = await fetch(generatedImage);
    const blob = await response.blob();
    downloadFile(blob, 'family-tree-ai.png');
  };

  const renderContent = () => {
    switch(view) {
        case 'prompt':
            return (
                <div className="space-y-4">
                    <p className="text-gray-400">
                        Edit the prompt below to customize the AI-generated image.
                    </p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm font-mono"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setView('options')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleGenerateImage}
                        disabled={!prompt.trim()}
                        className="w-full flex items-center justify-center px-4 py-3 bg-amber-600/80 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                      >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate
                      </button>
                    </div>
                </div>
            )
        case 'loading':
            return (
                <div className="text-center py-12">
                    <SparklesIcon className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                    <p className="mt-4 text-gray-300">Generating your family tree's portrait...</p>
                    <p className="text-sm text-gray-500">This may take a moment.</p>
                </div>
            );
        case 'result':
            return (
                <div className="space-y-4">
                    {generatedImage && <img src={generatedImage} alt="AI generated family tree" className="rounded-lg w-full h-auto" />}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setView('options')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleDownloadGeneratedImage}
                        className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                      >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                      </button>
                    </div>
                </div>
            );
        case 'error':
            return (
                <div className="text-center py-12 space-y-4">
                    <p className="text-red-400">{apiError}</p>
                    <button
                        onClick={() => setView('prompt')}
                        className="px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                      >
                        Back to Prompt
                      </button>
                </div>
            )
        case 'options':
        default:
            return (
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Download your family tree for sharing or archiving, or create a unique AI-generated image.
                  </p>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download as CSV
                  </button>
                  <button
                    onClick={handleDownloadSVG}
                    className="w-full flex items-center justify-center px-4 py-3 bg-sky-600/80 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download as SVG
                  </button>
                  <button
                    onClick={handleDownloadPNG}
                    className="w-full flex items-center justify-center px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download as PNG
                  </button>
                  <div className="border-t border-gray-700/50 my-2"></div>
                  <button
                    onClick={handlePreparePrompt}
                    className="w-full flex items-center justify-center px-4 py-3 bg-amber-600/80 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate AI Image
                  </button>
                </div>
            );
    }
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 border border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Export & Generate</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default ExportModal;