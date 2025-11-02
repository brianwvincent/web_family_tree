import React, { useState, useEffect } from 'react';
import { AppLink } from '../types';
import CloseIcon from './icons/CloseIcon';
import AddIcon from './icons/AddIcon';

interface NodeInfoProps {
  selectedNodeId: string | null;
  links: AppLink[];
  onDeselect: () => void;
  onNodeNameChange: (oldName: string, newName: string) => void;
  onManualAdd: (name: string, relationshipType?: 'parent' | 'child') => void;
  selectedNodeHasParent: boolean;
}

const NodeInfo: React.FC<NodeInfoProps> = ({ 
  selectedNodeId, 
  links, 
  onDeselect, 
  onNodeNameChange,
  onManualAdd,
  selectedNodeHasParent
}) => {
  const [editedName, setEditedName] = useState(selectedNodeId || '');
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    if (selectedNodeId) {
      setEditedName(selectedNodeId);
      setMemberName(''); // Clear relationship input on new node selection
    }
  }, [selectedNodeId]);

  if (!selectedNodeId) {
    return null;
  }

  const handleNameChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNodeId && editedName.trim() && editedName.trim() !== selectedNodeId) {
      onNodeNameChange(selectedNodeId, editedName);
    }
  };

  const handleAddRelationship = (relationshipType: 'parent' | 'child') => {
    if (!memberName.trim()) return;
    onManualAdd(memberName, relationshipType);
    setMemberName('');
  };

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
      <h3 className="text-lg font-semibold text-purple-300 mb-4">Selected Member Details</h3>
      <button onClick={onDeselect} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors" aria-label="Close details">
        <CloseIcon className="w-5 h-5" />
      </button>
      
      <div className="space-y-4">
        <form onSubmit={handleNameChangeSubmit} className="space-y-2">
            <label htmlFor="memberName" className="font-semibold text-gray-400 block">Name:</label>
            <div className="flex gap-2">
                <input
                    id="memberName"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-grow px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <button 
                    type="submit"
                    className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                    disabled={editedName.trim() === selectedNodeId || !editedName.trim()}
                    title="Save name change"
                >
                    Save
                </button>
            </div>
        </form>

        <div className="border-t border-gray-700/50 pt-3 space-y-3">
          <div>
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
      
      {/* Add Relationship Form */}
      <div className="border-t border-gray-700/50 pt-4 mt-4">
          <h4 className="font-semibold text-gray-400 mb-3">Add Relationship</h4>
          <div className="space-y-3">
              <input
                  type="text"
                  placeholder="New Member's Name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  required
              />
              <div className="flex flex-col sm:flex-row gap-2">
                  {!selectedNodeHasParent && (
                      <button 
                          type="button" 
                          onClick={() => handleAddRelationship('parent')}
                          disabled={!memberName.trim()}
                          className="w-full flex items-center justify-center px-4 py-2 bg-sky-600/80 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                      >
                          <AddIcon className="w-5 h-5 mr-2" />
                          Add as Parent
                      </button>
                  )}
                  <button 
                      type="button" 
                      onClick={() => handleAddRelationship('child')}
                      disabled={!memberName.trim()}
                      className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
                  >
                      <AddIcon className="w-5 h-5 mr-2" />
                      Add as Child
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default NodeInfo;