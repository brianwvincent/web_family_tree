import React, { useState, useMemo, useCallback, useRef } from 'react';
import { AppNode, AppLink, HierarchicalNode, FamilyTreeApi } from './types';
import FamilyTree from './components/FamilyTree';
import Controls from './components/Controls';
import NodeInfo from './components/NodeInfo';
import AppStartPage from './components/AppStartPage';
import HomeIcon from './components/icons/HomeIcon';
import SearchBar from './components/SearchBar';
import ResetIcon from './components/icons/ResetIcon';
import LayoutControls from './components/LayoutControls';
import ExportIcon from './components/icons/ExportIcon';
import ExportModal from './components/ExportModal';
import Logo from './components/icons/Logo';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'tree'>('landing');
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [links, setLinks] = useState<AppLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [siblingSpacing, setSiblingSpacing] = useState(1);
  const [generationSpacing, setGenerationSpacing] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const familyTreeRef = useRef<FamilyTreeApi>(null);

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

  const handleManualAdd = useCallback((name: string, relationshipType?: 'parent' | 'child') => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Member name is required.");
      return;
    }
    setError(null);

    // SCENARIO: Adding a root node (no node selected).
    if (!selectedNode) {
        if (nodes.some(n => n.id.toLowerCase() === trimmedName.toLowerCase())) {
            setError("A member with this name already exists.");
            return;
        }
        const newNodes = [...nodes, { id: trimmedName }];
        setNodes(newNodes);
        return;
    }

    // SCENARIO: Adding a relationship to a selected node.
    if (!relationshipType) {
        setError("A relationship type (parent or child) must be specified.");
        return;
    }

    const existingNodeName = selectedNode;
    const newNodeName = trimmedName;

    if (existingNodeName.toLowerCase() === newNodeName.toLowerCase()) {
        setError("The new member must have a different name from the selected member.");
        return;
    }
    
    let parentName: string, childName: string;

    if (relationshipType === 'child') {
        parentName = existingNodeName;
        childName = newNodeName;
    } else { // 'parent'
        parentName = newNodeName;
        childName = existingNodeName;
    }

    if (links.some(l => l.target.toLowerCase() === childName.toLowerCase())) {
        setError(`${childName} already has a parent. A person can only have one parent in this tree structure.`);
        return;
    }

    if (links.some(l => l.source.toLowerCase() === parentName.toLowerCase() && l.target.toLowerCase() === childName.toLowerCase())) {
        setError("This relationship already exists.");
        return;
    }

    const nodeSet = new Set(nodes.map(n => n.id));
    nodeSet.add(parentName);
    nodeSet.add(childName);

    const newNodes = Array.from(nodeSet).map(id => ({ id }));
    const newLink: AppLink = { source: parentName, target: childName };
    const newLinks = [...links, newLink];
    
    setNodes(newNodes);
    setLinks(newLinks);
}, [nodes, links, selectedNode]);

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
    setSiblingSpacing(1);
    setGenerationSpacing(1);
    if (returnToLanding) {
      setView('landing');
    }
  }, []);

  const handleNodeNameChange = useCallback((oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        setError("Member name cannot be empty.");
        return;
    }
    if (trimmedNewName.toLowerCase() === oldName.toLowerCase()) {
        return; // No change, just silently ignore.
    }
    if (nodes.some(n => n.id.toLowerCase() === trimmedNewName.toLowerCase())) {
        setError("A member with this name already exists.");
        return;
    }
    setError(null);

    const newNodes = nodes.map(node => 
        node.id === oldName ? { ...node, id: trimmedNewName } : node
    );

    const newLinks = links.map(link => ({
        source: link.source === oldName ? trimmedNewName : link.source,
        target: link.target === oldName ? trimmedNewName : link.target,
    }));

    setNodes(newNodes);
    setLinks(newLinks);
    setSelectedNode(trimmedNewName); // Update selection to the new name

  }, [nodes, links]);

  const selectedNodeHasParent = useMemo(() => {
    if (!selectedNode) return false;
    return links.some(link => link.target.toLowerCase() === selectedNode.toLowerCase());
  }, [selectedNode, links]);

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
    return <AppStartPage onFileUpload={handleFileUpload} onStartManual={handleStartManualAdd} />;
  }

  return (
    <>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        nodes={nodes}
        links={links}
        familyTreeRef={familyTreeRef}
      />
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-gray-100 font-sans">
        <aside className="w-full md:w-80 lg:w-96 bg-gray-800/50 p-6 border-b md:border-b-0 md:border-r border-gray-700/50 shadow-lg flex-shrink-0 overflow-y-auto">
          <header className="flex items-center justify-between mb-8">
            <a href="#/" className="flex items-center" title="Back to Home Page">
              <Logo className="w-10 h-10" />
              <h1 className="text-2xl font-bold ml-2 text-white">HeirGraph</h1>
            </a>
            <div className="flex items-center gap-1">
              {nodes.length > 0 && (
                <>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="p-2 rounded-full text-gray-400 hover:bg-emerald-600/50 hover:text-white transition-colors"
                    aria-label="Export Tree"
                    title="Export Tree"
                  >
                    <ExportIcon className="w-6 h-6" />
                  </button>
                  <button
                      onClick={() => handleResetTree(false)}
                      className="p-2 rounded-full text-gray-400 hover:bg-red-600/50 hover:text-white transition-colors"
                      aria-label="Clear Tree"
                      title="Clear Tree"
                  >
                      <ResetIcon className="w-6 h-6" />
                  </button>
                </>
              )}
              <button
                onClick={() => handleResetTree(true)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Go to App Start"
                title="Go to App Start"
              >
                <HomeIcon className="w-6 h-6" />
              </button>
            </div>
          </header>
          <Controls 
              onFileUpload={handleFileUpload}
              onManualAdd={handleManualAdd}
              isTreeVisible={nodes.length > 0}
          />
          {error && <div className="mt-4 p-3 bg-red-800/50 text-red-300 border border-red-700/50 rounded-lg text-sm">{error}</div>}
          <NodeInfo 
              selectedNodeId={selectedNode}
              links={links}
              onDeselect={() => handleNodeSelect(null)}
              onNodeNameChange={handleNodeNameChange}
              onManualAdd={handleManualAdd}
              selectedNodeHasParent={selectedNodeHasParent}
              onNodeSelect={handleNodeSelect}
          />
          {nodes.length > 0 && (
            <>
              <div className="border-t border-gray-700/50 my-6"></div>
              <LayoutControls
                siblingSpacing={siblingSpacing}
                setSiblingSpacing={setSiblingSpacing}
                generationSpacing={generationSpacing}
                setGenerationSpacing={setGenerationSpacing}
              />
            </>
          )}
          <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm text-gray-400">
              <h3 className="font-semibold text-gray-200 mb-2">How to Use:</h3>
              <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">View Details:</span> Click a member to see their parent and children.</li>
                  <li><span className="font-semibold">Edit Name:</span> Change a member's name in the details panel.</li>
                  <li><span className="font-semibold">Search:</span> Find a family member using the search bar.</li>
                  <li><span className="font-semibold">Interact:</span> Pan and zoom the tree visualization.</li>
              </ul>
          </div>
        </aside>
        <main className="flex-grow relative bg-gray-900 overflow-hidden">
          {hierarchicalData ? (
            <>
              <SearchBar 
                  searchQuery={searchQuery}
                  onSearch={handleSearch}
              />
              <FamilyTree 
                  ref={familyTreeRef}
                  data={hierarchicalData} 
                  searchQuery={searchQuery}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  siblingSpacing={siblingSpacing}
                  generationSpacing={generationSpacing}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                  <Logo className="w-32 h-32 mb-6 opacity-20" />
                  <h2 className="text-2xl font-semibold text-gray-400">Your Family Tree Awaits</h2>
                  <p className="mt-2 max-w-md">Get started by adding a family member or uploading a CSV file using the controls on the left.</p>
              </div>
          )}
        </main>
      </div>
    </>
  );
};

export default App;