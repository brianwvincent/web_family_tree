import React, { useRef, useState, useEffect } from 'react';
import UploadIcon from './icons/UploadIcon';
import SearchIcon from './icons/SearchIcon';
import ResetIcon from './icons/ResetIcon';
import AddIcon from './icons/AddIcon';

interface ControlsProps {
  onFileUpload: (file: File) => void;
  onManualAdd: (parent: string, child: string) => void;
  onSearch: (query: string) => void;
  onResetTree: () => void;
  searchQuery: string;
  isTreeVisible: boolean;
  selectedNode: string | null;
}

const Controls: React.FC<ControlsProps> = ({ 
  onFileUpload,
  onManualAdd,
  onSearch, 
  onResetTree,
  searchQuery, 
  isTreeVisible,
  selectedNode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setParentName(selectedNode);
      setChildName('');
    } else if (!isTreeVisible) {
      setParentName('');
      setChildName('');
    }
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

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    onManualAdd(parentName, childName);
    setChildName('');
    if (!selectedNode) {
        setParentName('');
    }
  };

  const renderManualAdd = () => {
    if (isTreeVisible && !selectedNode) {
      return (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Add Member</h2>
          <div className="p-3 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400">
            Please select a member from the tree to add their child.
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Add Member Manually</h2>
        <form onSubmit={handleAddMember} className="space-y-3">
          <input
            type="text"
            placeholder="Parent's Name"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            disabled={!!selectedNode}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50"
            required
          />
          <input
            type="text"
            placeholder="Child's Name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            required
          />
          <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
            <AddIcon className="w-5 h-5 mr-2" />
            Add Relationship
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderManualAdd()}

      <div className="border-t border-gray-700/50"></div>
      
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Search Member</h2>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Find a family member..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>
      
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

      {isTreeVisible && (
        <>
          <div className="border-t border-gray-700/50"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Reset Tree</h2>
            <button
              onClick={() => onResetTree()}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
            >
              <ResetIcon className="w-5 h-5 mr-2" />
              Clear Family Tree
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Controls;