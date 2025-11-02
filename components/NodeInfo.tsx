import React from 'react';
import { AppLink } from '../types';
import CloseIcon from './icons/CloseIcon';

interface NodeInfoProps {
  selectedNodeId: string | null;
  links: AppLink[];
  onDeselect: () => void;
}

const NodeInfo: React.FC<NodeInfoProps> = ({ selectedNodeId, links, onDeselect }) => {
  if (!selectedNodeId) {
    return null;
  }

  const parentLink = links.find(link => link.target === selectedNodeId);
  const parent = parentLink ? parentLink.source : 'N/A';
  const children = links.filter(link => link.source === selectedNodeId).map(link => link.target);

  return (
    <div className="mt-8 p-4 bg-gray-800/40 border border-purple-700/50 rounded-lg text-sm text-gray-300 relative animate-fade-in">
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      <h3 className="text-lg font-semibold text-purple-300 mb-4">Member Details</h3>
      <button onClick={onDeselect} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors" aria-label="Close details">
        <CloseIcon className="w-5 h-5" />
      </button>
      <div className="space-y-3">
        <div>
            <p className="font-bold text-lg text-white">{selectedNodeId}</p>
        </div>
        <div className="border-t border-gray-700/50 pt-3">
          <p className="font-semibold text-gray-400">Parent:</p>
          <p className="pl-2 text-white">{parent}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-400">Children:</p>
          {children.length > 0 ? (
            <ul className="list-disc list-inside pl-2 text-white">
              {children.map(child => <li key={child}>{child}</li>)}
            </ul>
          ) : (
            <p className="pl-2">None</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeInfo;