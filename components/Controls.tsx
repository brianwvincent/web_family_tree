import React, { useState } from 'react';
import AddIcon from './icons/AddIcon';
import Import from './Import';
import { AppNode, AppLink } from '../types';

interface ControlsProps {
  onImport: (nodes: AppNode[], links: AppLink[]) => void;
  onManualAdd: (name: string, relationshipType?: 'parent' | 'child') => void;
  onError: (error: string) => void;
  isTreeVisible: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onImport,
  onManualAdd,
  onError,
  isTreeVisible,
}) => {
  const [memberName, setMemberName] = useState('');

  const handleAddFirstMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    onManualAdd(memberName);
    setMemberName('');
  }

  if (isTreeVisible) {
    return null; // Don't show these controls if a tree is already displayed
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Add First Member</h2>
        <form onSubmit={handleAddFirstMember} className="space-y-3">
          <input
            type="text"
            placeholder="Member's Name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            required
          />
          <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
            <AddIcon className="w-5 h-5 mr-2" />
            Add Member
          </button>
        </form>
      </div>

      <div className="border-t border-gray-700/50"></div>
      
      <Import onImport={onImport} onError={onError} />
    </div>
  );
};

export default Controls;