import React, { useRef, useState, useEffect } from 'react';
import UploadIcon from './icons/UploadIcon';
import AddIcon from './icons/AddIcon';

interface ControlsProps {
  onFileUpload: (file: File) => void;
  onManualAdd: (name: string, relationshipType?: 'parent' | 'child') => void;
  isTreeVisible: boolean;
  selectedNode: string | null;
  selectedNodeHasParent: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onFileUpload,
  onManualAdd,
  isTreeVisible,
  selectedNode,
  selectedNodeHasParent
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    setMemberName('');
  }, [selectedNode, isTreeVisible]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    event.target.value = '';
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAddRelationship = (relationshipType: 'parent' | 'child') => {
    if (!memberName.trim()) return;
    onManualAdd(memberName, relationshipType);
    setMemberName('');
  };
  
  const handleAddFirstMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    onManualAdd(memberName);
    setMemberName('');
  }

  const renderManualAdd = () => {
    if (isTreeVisible && !selectedNode) {
      return (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Add Relationship</h2>
          <div className="p-3 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400">
            Please select a member from the tree to add their parent or child.
          </div>
        </div>
      );
    }
    
    if (selectedNode) {
      return (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Add Relationship</h2>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Add a new member related to <span className="font-bold text-white">{selectedNode}</span>.</p>
            </div>
            <input
              type="text"
              placeholder="New Member's Name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button" 
                onClick={() => handleAddRelationship('child')}
                disabled={!memberName.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-600/50 disabled:cursor-not-allowed"
              >
                <AddIcon className="w-5 h-5 mr-2" />
                Add as Child
              </button>

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
            </div>
          </form>
        </div>
      );
    }
    
    // Default form for adding the first member when the tree is empty
    return (
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
    );
  };

  return (
    <div className="space-y-6">
      {renderManualAdd()}

      {!isTreeVisible && (
        <>
          <div className="border-t border-gray-700/50"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Upload CSV File</h2>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <button
              onClick={triggerFileSelect}
              className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
            >
              <UploadIcon className="w-5 h-5 mr-2" />
              Select CSV File
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Controls;