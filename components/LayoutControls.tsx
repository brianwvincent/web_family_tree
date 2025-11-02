import React from 'react';

interface LayoutControlsProps {
  siblingSpacing: number;
  setSiblingSpacing: (value: number) => void;
  generationSpacing: number;
  setGenerationSpacing: (value: number) => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  siblingSpacing,
  setSiblingSpacing,
  generationSpacing,
  setGenerationSpacing,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">Layout Controls</h2>
      <div className="space-y-3">
        <div>
          <label htmlFor="generation-spacing" className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Generation Spacing</span>
            <span className="font-medium text-gray-200">{generationSpacing.toFixed(1)}x</span>
          </label>
          <input
            id="generation-spacing"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={generationSpacing}
            onChange={(e) => setGenerationSpacing(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
          />
        </div>
        <div>
          <label htmlFor="sibling-spacing" className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Sibling Spacing</span>
            <span className="font-medium text-gray-200">{siblingSpacing.toFixed(1)}x</span>
          </label>
          <input
            id="sibling-spacing"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={siblingSpacing}
            onChange={(e) => setSiblingSpacing(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          margin-top: -5px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
        }
        input[type=range]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #10b981;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default LayoutControls;
