import React from 'react';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';

interface SearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearch }) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4">
          <SearchIcon className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Find a family member..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-11 pr-11 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearch('')}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
