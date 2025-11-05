import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';
import { AppNode, AppLink } from '../types';

interface ImportProps {
  onImport: (nodes: AppNode[], links: AppLink[]) => void;
  onError: (error: string) => void;
}

const Import: React.FC<ImportProps> = ({ onImport, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { nodes: AppNode[]; links: AppLink[] } | null => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) {
      onError("CSV must have a header row and at least one data row.");
      return null;
    }
    
    const header = rows[0].trim().toLowerCase().split(',').map(h => h.replace(/"/g, '').trim());
    const parentIndex = header.indexOf('parent');
    const childIndex = header.indexOf('child');

    if (parentIndex === -1 || childIndex === -1) {
      const missingColumns = [];
      if (parentIndex === -1) missingColumns.push('"parent"');
      if (childIndex === -1) missingColumns.push('"child"');
      onError(`Improperly formatted CSV: Missing required column(s): ${missingColumns.join(' and ')}. The CSV must have both "parent" and "child" columns.`);
      return null;
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
    return { nodes: newNodes, links: newLinks };
  };

  const parseGEDCOM = (text: string): { nodes: AppNode[]; links: AppLink[] } | null => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      // Maps to store individuals and families
      const individuals = new Map<string, string>(); // id -> name
      const families = new Map<string, { husband?: string; wife?: string; children: string[] }>();
      
      let currentId: string | null = null;
      let currentType: 'INDI' | 'FAM' | null = null;
      let currentName = '';
      let currentFamily: { husband?: string; wife?: string; children: string[] } | null = null;
      
      for (const line of lines) {
        const parts = line.split(' ');
        const level = parseInt(parts[0]);
        const tag = parts[1];
        
        if (level === 0) {
          // Save previous entity
          if (currentType === 'INDI' && currentId && currentName) {
            individuals.set(currentId, currentName);
          } else if (currentType === 'FAM' && currentId && currentFamily) {
            families.set(currentId, currentFamily);
          }
          
          // Start new entity
          if (tag.startsWith('@') && parts.length > 2) {
            currentId = tag;
            currentType = parts[2] === 'INDI' ? 'INDI' : parts[2] === 'FAM' ? 'FAM' : null;
            currentName = '';
            currentFamily = { children: [] };
          }
        } else if (level === 1 && currentType === 'INDI') {
          if (tag === 'NAME') {
            // Extract name (format: "1 NAME First /Last/")
            currentName = parts.slice(2).join(' ').replace(/\//g, '').trim();
          }
        } else if (level === 1 && currentType === 'FAM') {
          if (tag === 'HUSB' || tag === 'WIFE') {
            const refId = parts[2];
            if (currentFamily) {
              if (tag === 'HUSB') currentFamily.husband = refId;
              if (tag === 'WIFE') currentFamily.wife = refId;
            }
          } else if (tag === 'CHIL') {
            const refId = parts[2];
            if (currentFamily) {
              currentFamily.children.push(refId);
            }
          }
        }
      }
      
      // Save last entity
      if (currentType === 'INDI' && currentId && currentName) {
        individuals.set(currentId, currentName);
      } else if (currentType === 'FAM' && currentId && currentFamily) {
        families.set(currentId, currentFamily);
      }
      
      // Build nodes and links
      const nodeSet = new Set<string>();
      const links: AppLink[] = [];
      const linkSet = new Set<string>(); // To avoid duplicate links
      
      families.forEach((family) => {
        const parents: string[] = [];
        
        if (family.husband) {
          const husbandName = individuals.get(family.husband);
          if (husbandName) {
            parents.push(husbandName);
            nodeSet.add(husbandName);
          }
        }
        
        if (family.wife) {
          const wifeName = individuals.get(family.wife);
          if (wifeName) {
            parents.push(wifeName);
            nodeSet.add(wifeName);
          }
        }
        
        // Create links from each parent to each child
        family.children.forEach(childId => {
          const childName = individuals.get(childId);
          if (childName) {
            nodeSet.add(childName);
            // Use first parent if available, otherwise create orphan node
            if (parents.length > 0) {
              parents.forEach(parent => {
                // Prevent self-loops and duplicate links
                const linkKey = `${parent}->${childName}`;
                if (!linkSet.has(linkKey) && parent !== childName) {
                  links.push({ source: parent, target: childName });
                  linkSet.add(linkKey);
                }
              });
            }
          }
        });
      });
      
      // Simple cycle prevention: detect immediate cycles using iterative BFS with depth limit
      const detectCyclesIterative = (links: AppLink[]): Set<string> => {
        const adjList = new Map<string, string[]>();
        const reverseAdjList = new Map<string, string[]>();
        
        links.forEach(link => {
          if (!adjList.has(link.source)) adjList.set(link.source, []);
          adjList.get(link.source)!.push(link.target);
          
          if (!reverseAdjList.has(link.target)) reverseAdjList.set(link.target, []);
          reverseAdjList.get(link.target)!.push(link.source);
        });
        
        const problematicLinks = new Set<string>();
        const maxDepth = 50; // Prevent infinite loops
        
        // For each node, check if any of its ancestors are also descendants
        for (const node of adjList.keys()) {
          const ancestors = new Set<string>();
          const descendants = new Set<string>();
          
          // Get ancestors using BFS with depth limit
          const ancestorQueue: Array<{ node: string; depth: number }> = [{ node, depth: 0 }];
          const visitedAncestors = new Set<string>();
          
          while (ancestorQueue.length > 0) {
            const current = ancestorQueue.shift()!;
            if (current.depth >= maxDepth || visitedAncestors.has(current.node)) continue;
            visitedAncestors.add(current.node);
            ancestors.add(current.node);
            
            const parents = reverseAdjList.get(current.node) || [];
            for (const parent of parents) {
              if (!visitedAncestors.has(parent)) {
                ancestorQueue.push({ node: parent, depth: current.depth + 1 });
              }
            }
          }
          
          // Get descendants using BFS with depth limit
          const descendantQueue: Array<{ node: string; depth: number }> = [{ node, depth: 0 }];
          const visitedDescendants = new Set<string>();
          
          while (descendantQueue.length > 0) {
            const current = descendantQueue.shift()!;
            if (current.depth >= maxDepth || visitedDescendants.has(current.node)) continue;
            visitedDescendants.add(current.node);
            descendants.add(current.node);
            
            const children = adjList.get(current.node) || [];
            for (const child of children) {
              if (!visitedDescendants.has(child)) {
                descendantQueue.push({ node: child, depth: current.depth + 1 });
              }
            }
          }
          
          // Check for overlap (cycle)
          for (const ancestor of ancestors) {
            if (descendants.has(ancestor) && ancestor !== node) {
              // Mark the link from node to this ancestor as problematic
              problematicLinks.add(`${node}->${ancestor}`);
            }
          }
        }
        
        return problematicLinks;
      };
      
      const problematicLinks = detectCyclesIterative(links);
      
      if (problematicLinks.size > 0) {
        console.warn(`Removed ${problematicLinks.size} problematic links to prevent cycles in GEDCOM family tree.`);
      }
      
      // Filter out problematic links
      const cleanLinks = links.filter(link => {
        const key = `${link.source}->${link.target}`;
        return !problematicLinks.has(key);
      });
      
      if (nodeSet.size === 0) {
        onError("No valid family relationships found in GEDCOM file.");
        return null;
      }
      
      const nodes: AppNode[] = Array.from(nodeSet).map(id => ({ id }));
      return { nodes, links: cleanLinks };
    } catch (e) {
      onError("Failed to parse GEDCOM file. Please check its format.");
      console.error(e);
      return null;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        onError("File is empty or could not be read.");
        return;
      }

      let result: { nodes: AppNode[]; links: AppLink[] } | null = null;

      if (file.name.toLowerCase().endsWith('.csv')) {
        result = parseCSV(text);
      } else if (file.name.toLowerCase().endsWith('.ged')) {
        result = parseGEDCOM(text);
      } else {
        onError("Unsupported file format. Please upload a CSV or GEDCOM (.ged) file.");
        return;
      }

      if (result) {
        onImport(result.nodes, result.links);
      }
    };

    reader.onerror = () => {
      onError("Error reading the file.");
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv,.ged"
        onChange={handleFileChange}
      />
      <button
        onClick={triggerFileSelect}
        className="flex flex-col items-center justify-center w-64 h-40 p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-emerald-500 hover:text-white transition-all duration-300"
      >
        <UploadIcon className="w-10 h-10 mb-3" />
        <span className="text-xl font-semibold">Upload CSV or GEDCOM</span>
      </button>
    </>
  );
};

export default Import;
