import React, { useState, useMemo, useCallback } from 'react';
import { AppNode, AppLink, HierarchicalNode } from './types';
import FamilyTree from './components/FamilyTree';
import Controls from './components/Controls';
import TreeIcon from './components/icons/TreeIcon';
import NodeInfo from './components/NodeInfo';
import LandingPage from './components/LandingPage';
import HomeIcon from './components/icons/HomeIcon';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'tree'>('landing');
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [links, setLinks] = useState<AppLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleFileUpload = useCallback((file: File) => {
    setError(null);
    setSelectedNode(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setError("File is empty or could not be read.");
        return;
      }
      try {
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) {
            setError("CSV must have a header row and at least one data row.");
            return;
        }
        const header = rows[0].trim().toLowerCase().split(',').map(h => h.replace(/"/g, ''));
        const parentIndex = header.indexOf('parent');
        const childIndex = header.indexOf('child');

        if (parentIndex === -1 || childIndex === -1) {
          setError('CSV must contain "parent" and "child" columns.');
          return;
        }

        const newLinks: AppLink[] = [];
        const nodeSet = new Set<string>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split(',').map(h => h.trim().replace(/"/g, ''));
          const parent = row[parentIndex];
          const child = row[childIndex];

          if (parent && child) {
            newLinks.push({ source: parent, target: child });
            nodeSet.add(parent);
            nodeSet.add(child);
          }
        }
        
        const newNodes: AppNode[] = Array.from(nodeSet).map(id => ({ id }));
        setNodes(newNodes);
        setLinks(newLinks);
        setView('tree');
      } catch (e) {
        setError("Failed to parse CSV file. Please check its format.");
        console.error(e);
      }
    };
    reader.onerror = () => {
        setError("Error reading the file.");
    }
    reader.readAsText(file);
  }, []);

  const handleManualAdd = useCallback((parent: string, child: string) => {
    if (!parent || !child) {
        setError("Both parent and child names are required.");
        return;
    }
    if (parent.trim().toLowerCase() === child.trim().toLowerCase()) {
        setError("Parent and child cannot have the same name.");
        return;
    }
    
    const newLink: AppLink = { source: parent.trim(), target: child.trim() };
    
    if (links.some(l => l.source === newLink.source && l.target === newLink.target)) {
        setError("This relationship already exists.");
        return;
    }

    const nodeSet = new Set(nodes.map(n => n.id));
    nodeSet.add(parent.trim());
    nodeSet.add(child.trim());
    
    const newNodes = Array.from(nodeSet).map(id => ({ id }));
    const newLinks = [...links, newLink];

    setNodes(newNodes);
    setLinks(newLinks);
    setError(null);
  }, [nodes, links]);

  const handleStartManualAdd = useCallback(() => {
    handleResetTree(false); // Clear any existing state without going to landing
    setView('tree');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    // If null is passed (background click), always deselect.
    if (nodeId === null) {
      setSelectedNode(null);
      return;
    }
    // Otherwise, toggle the selection.
    setSelectedNode(prevSelected => (prevSelected === nodeId ? null : nodeId));
  }, []);

  const handleResetTree = useCallback((returnToLanding = true) => {
    setNodes([]);
    setLinks([]);
    setError(null);
    setSearchQuery('');
    setSelectedNode(null);
    if (returnToLanding) {
      setView('landing');
    }
  }, []);

  const hierarchicalData = useMemo<HierarchicalNode | null>(() => {
    if (nodes.length === 0) return null;

    const nodeMap: { [key: string]: HierarchicalNode } = {};
    nodes.forEach(node => {
      nodeMap[node.id] = { id: node.id, children: [] };
    });

    const childrenIds = new Set<string>();
    links.forEach(link => {
      if (nodeMap[link.source] && nodeMap[link.target]) {
        nodeMap[link.source].children.push(nodeMap[link.target]);
        childrenIds.add(link.target);
      }
    });

    const roots = Object.values(nodeMap).filter(node => !childrenIds.has(node.id));

    if (roots.length === 0) {
        if (Object.keys(nodeMap).length > 0) {
            return Object.values(nodeMap)[0]; 
        }
        return null;
    }

    if (roots.length > 1) {
      return { id: "Family", children: roots };
    }
    
    return roots[0];
  }, [nodes, links]);

  if (view === 'landing') {
    return <LandingPage onFileUpload={handleFileUpload} onStartManual={handleStartManualAdd} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className="w-full md:w-80 lg:w-96 bg-gray-800/50 p-6 border-b md:border-b-0 md:border-r border-gray-700/50 shadow-lg flex-shrink-0 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
           <div className="flex items-center">
             <TreeIcon className="w-8 h-8 text-emerald-400" />
             <h1 className="text-2xl font-bold ml-3 text-white">Family Tree Builder</h1>
           </div>
           <button
              onClick={() => handleResetTree(true)}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Go to Home"
              title="Go to Home"
            >
              <HomeIcon className="w-6 h-6" />
            </button>
        </header>
        <Controls 
            onFileUpload={handleFileUpload}
            onManualAdd={handleManualAdd}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            onResetTree={handleResetTree}
            isTreeVisible={nodes.length > 0}
            selectedNode={selectedNode}
        />
        {error && <div className="mt-4 p-3 bg-red-800/50 text-red-300 border border-red-700/50 rounded-lg text-sm">{error}</div>}
        <NodeInfo 
            selectedNodeId={selectedNode}
            links={links}
            onDeselect={() => handleNodeSelect(null)}
        />
         <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm text-gray-400">
            <h3 className="font-semibold text-gray-200 mb-2">How to Use:</h3>
            <ul className="list-disc list-inside space-y-1">
                <li><span className="font-semibold">Select a Node:</span> Click a member in the tree to view their details here.</li>
                <li><span className="font-semibold">Search:</span> Find a family member in the tree.</li>
                <li><span className="font-semibold">Upload CSV:</span> Must have 'parent' & 'child' columns.</li>
                <li><span className="font-semibold">Interact:</span> Pan and zoom the tree visualization.</li>
            </ul>
        </div>
      </aside>
      <main className="flex-grow relative bg-gray-900 overflow-hidden">
        {hierarchicalData ? (
          <FamilyTree 
            data={hierarchicalData} 
            searchQuery={searchQuery}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            />
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <TreeIcon className="w-24 h-24 mb-6 opacity-20" />
                <h2 className="text-2xl font-semibold text-gray-400">Your Family Tree Awaits</h2>
                <p className="mt-2 max-w-md">Get started by adding a family member or uploading a CSV file using the controls on the left.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;