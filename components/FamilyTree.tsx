import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { HierarchicalNode, FamilyTreeApi, AppNode, AppLink } from '../types';

interface FamilyTreeProps {
  data: HierarchicalNode;
  searchQuery: string;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  siblingSpacing: number;
  generationSpacing: number;
  orientation: 'horizontal' | 'vertical';
  layoutMode: 'tree' | 'force' | 'blocks';
  nodes: AppNode[];
  links: AppLink[];
}

const FamilyTree = forwardRef<FamilyTreeApi, FamilyTreeProps>(({ 
  data, 
  searchQuery, 
  selectedNode, 
  onNodeSelect,
  siblingSpacing,
  generationSpacing,
  orientation,
  layoutMode,
  nodes,
  links,
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    getSVGData: () => {
      if (!svgRef.current) return null;

      const originalSvg = svgRef.current;
      const originalG = originalSvg.querySelector('g');
  
      // Step 1: Get the bounding box from the original, rendered <g> element.
      // This is more reliable than measuring an off-screen clone.
      if (!originalG) return null;
      const bbox = originalG.getBBox();
  
      // If the graph is empty or not rendered, bbox will have 0 dimensions.
      if (bbox.width === 0 || bbox.height === 0) {
        console.error("Could not export SVG: bounding box has zero dimensions.");
        return null;
      }
  
      // Step 2: Clone the SVG node to modify it for export without affecting the live view.
      const clonedSvg = originalSvg.cloneNode(true) as SVGSVGElement;
      const g = clonedSvg.querySelector('g');
      if (!g) return null;
  
      // Step 3: Reset the zoom/pan transform on the cloned group.
      g.setAttribute('transform', '');
  
      // Step 4: Apply a consistent, light-themed style for the export.
      // We explicitly set attributes to override any inline styles or CSS.
      clonedSvg.querySelectorAll('.link').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('stroke', '#cccccc'); // Light gray for better readability
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke-width', '1.5');
      });
      
      // Handle ellipse nodes (tree and force modes)
      clonedSvg.querySelectorAll('.node ellipse').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('fill', '#ffffff');
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '2');
      });
      
      // Handle circle nodes (for backward compatibility if any exist)
      clonedSvg.querySelectorAll('.node circle').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('fill', '#ffffff');
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '2');
      });
  
      clonedSvg.querySelectorAll('.node text').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('fill', '#000000');
          // Remove stroke for cleaner export
          el.setAttribute('stroke', 'none');
      });
      
      const padding = 40;
  
      // Step 5: Add a white background rectangle.
      const background = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
      background.setAttribute('x', `${bbox.x - padding}`);
      background.setAttribute('y', `${bbox.y - padding}`);
      background.setAttribute('width', `${bbox.width + padding * 2}`);
      background.setAttribute('height', `${bbox.height + padding * 2}`);
      background.setAttribute('fill', '#ffffff');
      clonedSvg.prepend(background);
      
      // Step 6: Set final dimensions and viewBox on the SVG for proper scaling.
      clonedSvg.setAttribute('width', `${bbox.width + padding * 2}`);
      clonedSvg.setAttribute('height', `${bbox.height + padding * 2}`);
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      
      const svgString = new XMLSerializer().serializeToString(clonedSvg);
  
      return {
          svgString,
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
      };
    },
  }));

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      if (entries && entries.length > 0) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Effect for initial drawing, data changes, and resizing
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    // For force and blocks mode, we need nodes and links instead of hierarchical data
    if ((layoutMode === 'force' || layoutMode === 'blocks') && (!nodes || nodes.length === 0)) return;
    if (layoutMode === 'tree' && !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear SVG on new data or resize

    const { width, height } = dimensions;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };

    const g = svg.append("g");

    svg.on('click', (event) => {
        if (event.target === svg.node()) {
            onNodeSelect(null);
        }
    });

    // Blocks layout
    if (layoutMode === 'blocks') {
      const blockWidth = 180;
      const blockHeight = 80;
      const horizontalSpacing = 40 * siblingSpacing;
      const verticalSpacing = 40 * generationSpacing;

      // Build a hierarchy to determine levels
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      const childToParent = new Map<string, string>();
      links.forEach(l => {
        childToParent.set(l.target, l.source);
      });

      // Find root nodes (nodes with no parents)
      const roots = nodes.filter(n => !childToParent.has(n.id));
      
      // Build levels
      type BlockNode = { id: string; level: number; index: number };
      const levelArrays: BlockNode[][] = [];
      const visited = new Set<string>();
      const nodeToBlockNode = new Map<string, BlockNode>();

      const assignLevels = (nodeId: string, level: number) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        // Ensure the level array exists
        while (levelArrays.length <= level) {
          levelArrays.push([]);
        }
        
        const blockNode: BlockNode = { id: nodeId, level, index: levelArrays[level].length };
        levelArrays[level].push(blockNode);
        nodeToBlockNode.set(nodeId, blockNode);

        // Process children
        const children = links.filter(l => l.source === nodeId).map(l => l.target);
        children.forEach(childId => assignLevels(childId, level + 1));
      };

      roots.forEach(root => assignLevels(root.id, 0));
      
      // Handle orphaned nodes (in case of disconnected graph)
      nodes.forEach(n => {
        if (!visited.has(n.id)) {
          assignLevels(n.id, 0);
        }
      });

      // Calculate positions - center children under parents
      const blockNodes = levelArrays.flat().filter(bn => bn && bn.id);
      
      // Create a map to store x positions
      const xPositions = new Map<string, number>();
      
      // Build parent-children relationships
      const childrenMap = new Map<string, string[]>();
      links.forEach(link => {
        if (!childrenMap.has(link.source)) {
          childrenMap.set(link.source, []);
        }
        childrenMap.get(link.source)!.push(link.target);
      });

      // Position root nodes first (nodes already identified earlier)
      let currentX = 0;
      
      const positionNode = (nodeId: string, parentX?: number): number => {
        const children = childrenMap.get(nodeId) || [];
        
        if (children.length === 0) {
          // Leaf node - position it
          if (parentX !== undefined) {
            xPositions.set(nodeId, parentX);
            return parentX;
          } else {
            const x = currentX;
            currentX += blockWidth + horizontalSpacing;
            xPositions.set(nodeId, x);
            return x;
          }
        } else {
          // Node with children - position children first, then center this node
          const childPositions = children.map(childId => positionNode(childId, undefined));
          const minChildX = Math.min(...childPositions);
          const maxChildX = Math.max(...childPositions);
          const centerX = (minChildX + maxChildX) / 2;
          xPositions.set(nodeId, centerX);
          return centerX;
        }
      };

      // Position each root and its descendants
      roots.forEach(root => {
        positionNode(root.id);
        currentX += blockWidth + horizontalSpacing; // Add space between root trees
      });

      // Calculate overall bounds and center the tree
      const allXPositions = Array.from(xPositions.values());
      const minX = Math.min(...allXPositions);
      const maxX = Math.max(...allXPositions);
      const treeWidth = maxX - minX + blockWidth;
      const offsetX = (width - treeWidth) / 2 - minX;

      // Apply offset to center the tree
      xPositions.forEach((x, nodeId) => {
        xPositions.set(nodeId, x + offsetX);
      });

      const totalHeight = levelArrays.length * (blockHeight + verticalSpacing);
      const startY = (height - totalHeight) / 2;

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      // Text wrapping function for blocks
      const wrapText = (textElement: d3.Selection<SVGTextElement, BlockNode, SVGGElement, unknown>, maxWidth: number) => {
        const text = textElement.node();
        if (!text) return;
        const words = text.textContent?.split(/\s+/) || [];
        text.textContent = '';

        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = parseFloat(textElement.attr('y'));
        const dy = parseFloat(textElement.attr('dy'));

        words.forEach((word) => {
          line.push(word);
          text.textContent = line.join(' ');
          if (text.getComputedTextLength() > maxWidth && line.length > 1) {
            line.pop();
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', textElement.attr('x'));
            tspan.setAttribute('y', String(y));
            tspan.setAttribute('dy', `${lineNumber * lineHeight + dy}em`);
            tspan.textContent = line.join(' ');
            text.appendChild(tspan);
            line = [word];
            lineNumber++;
          }
        });

        if (line.length > 0) {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', textElement.attr('x'));
          tspan.setAttribute('y', String(y));
          tspan.setAttribute('dy', `${lineNumber * lineHeight + dy}em`);
          tspan.textContent = line.join(' ');
          text.appendChild(tspan);
        }
      };

      // Draw links
      const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => {
          const sourceX = xPositions.get(d.source);
          if (sourceX === undefined) return 0;
          return sourceX + blockWidth / 2;
        })
        .attr("y1", d => {
          const source = nodeToBlockNode.get(d.source);
          if (!source) return 0;
          return startY + source.level * (blockHeight + verticalSpacing) + blockHeight;
        })
        .attr("x2", d => {
          const targetX = xPositions.get(d.target);
          if (targetX === undefined) return 0;
          return targetX + blockWidth / 2;
        })
        .attr("y2", d => {
          const target = nodeToBlockNode.get(d.target);
          if (!target) return 0;
          return startY + target.level * (blockHeight + verticalSpacing);
        })
        .attr("stroke", "#4b5563")
        .attr("stroke-width", 2)
        .attr("opacity", 1);

      // Draw blocks
      const node = g.selectAll(".node")
        .data(blockNodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => {
          if (!d || !d.id) return `translate(0,0)`;
          const x = xPositions.get(d.id);
          if (x === undefined) return `translate(0,0)`;
          const y = startY + d.level * (blockHeight + verticalSpacing);
          return `translate(${x},${y})`;
        })
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          if (!d || !d.id) return;
          event.stopPropagation();
          onNodeSelect(d.id === selectedNode ? null : d.id);
        });

      // Add block rectangles
      node.append("rect")
        .attr("width", blockWidth)
        .attr("height", blockHeight)
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("fill", d => (d && d.id === selectedNode) ? "#10b981" : "#e0f2fe")
        .attr("stroke", d => {
          if (!d || !d.id) return "#0284c7";
          if (d.id === selectedNode) return "#059669";
          if (searchQuery && d.id.toLowerCase().includes(searchQuery.toLowerCase())) return "#f59e0b";
          return "#0284c7";
        })
        .attr("stroke-width", d => (d && d.id === selectedNode) ? 3 : 2)
        .attr("class", "node-rect");

      // Add text
      const textElements = node.append("text")
        .attr("x", blockWidth / 2)
        .attr("y", blockHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#0c4a6e")
        .attr("font-size", "14px")
        .attr("font-weight", "500")
        .text(d => (d && d.id) ? d.id : '');

      // Apply text wrapping to each text element
      textElements.nodes().forEach((textNode, i) => {
        const blockNode = blockNodes[i];
        if (!blockNode || !blockNode.id) return;
        
        const textElement = d3.select(textNode) as d3.Selection<SVGTextElement, BlockNode, SVGGElement, unknown>;
        const maxWidth = blockWidth - 20;
        wrapText(textElement, maxWidth);
      });

      return;
    }

    // Force-directed layout
    if (layoutMode === 'force') {
      // Convert AppNode[] and AppLink[] to force simulation format
      type ForceNode = d3.SimulationNodeDatum & { id: string };
      type ForceLink = d3.SimulationLinkDatum<ForceNode> & { source: string; target: string };
      
      const forceNodes: ForceNode[] = nodes.map(n => ({ 
        id: n.id,
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100
      }));
      
      const forceLinks: ForceLink[] = links.map(l => ({ 
        source: l.source, 
        target: l.target 
      }));

      // Calculate depth from root for each node
      const nodeDepth = new Map<string, number>();
      const hasChildren = new Set(links.map(l => l.source));
      const hasParent = new Set(links.map(l => l.target));
      
      // Find root nodes (no parents)
      const rootNodes = nodes.filter(n => !hasParent.has(n.id));
      
      // BFS to calculate depth
      const queue: Array<{ id: string; depth: number }> = rootNodes.map(n => ({ id: n.id, depth: 0 }));
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        nodeDepth.set(current.id, current.depth);
        
        // Add children to queue
        links.filter(l => l.source === current.id).forEach(l => {
          if (!visited.has(l.target)) {
            queue.push({ id: l.target, depth: current.depth + 1 });
          }
        });
      }
      
      // Set depth for any unvisited nodes
      forceNodes.forEach(n => {
        if (!nodeDepth.has(n.id)) {
          nodeDepth.set(n.id, 0);
        }
      });
      
      const leafNodes = new Set(nodes.filter(n => !hasChildren.has(n.id)).map(n => n.id));

      // Custom radial force to push leaf nodes outward
      const radialForce = () => {
        forceNodes.forEach(node => {
          if (leafNodes.has(node.id)) {
            const dx = (node.x || 0) - width / 2;
            const dy = (node.y || 0) - height / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
              const strength = 0.3; // Strength of outward push
              node.vx = (node.vx || 0) + (dx / distance) * strength;
              node.vy = (node.vy || 0) + (dy / distance) * strength;
            }
          }
        });
      };

      const simulation = d3.forceSimulation<ForceNode>(forceNodes)
        .force("link", d3.forceLink<ForceNode, ForceLink>(forceLinks)
          .id(d => d.id)
          .distance(150 * generationSpacing))
        .force("charge", d3.forceManyBody()
          .strength(d => {
            const depth = nodeDepth.get(d.id) || 0;
            // Root nodes have stronger charge (more influence)
            return (-500 - (depth === 0 ? 300 : 0)) * siblingSpacing;
          }))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide()
          .radius(d => {
            const depth = nodeDepth.get(d.id) || 0;
            // Root nodes get larger collision radius
            return depth === 0 ? 85 : 70;
          })
          .strength(0.9))
        .force("radial", radialForce);

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      // Draw links
      const link = g.selectAll(".link")
        .data(forceLinks)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#4b5563")
        .attr("stroke-width", 1.5)
        .attr("opacity", 1);

      // Draw nodes
      const node = g.selectAll(".node")
        .data(forceNodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("opacity", 0)
        .style("cursor", "pointer")
        .call(d3.drag<SVGGElement, ForceNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }))
        .on('click', (event, d) => {
          event.stopPropagation();
          onNodeSelect(d.id);
        })
        .on('mouseover', function(event, d) {
          d3.select(this).raise();
          const depth = nodeDepth.get(d.id) || 0;
          const baseRx = depth === 0 ? 75 : 60;
          const baseRy = depth === 0 ? 32 : 25;
          d3.select(this).select('ellipse')
            .transition()
            .duration(150)
            .attr('rx', baseRx + 10)
            .attr('ry', baseRy + 5);
        })
        .on('mouseout', function(event, d) {
          const depth = nodeDepth.get(d.id) || 0;
          const baseRx = depth === 0 ? 75 : 60;
          const baseRy = depth === 0 ? 32 : 25;
          d3.select(this).select('ellipse')
            .transition()
            .duration(150)
            .attr('rx', baseRx)
            .attr('ry', baseRy);
        });

      // Add ellipse nodes with size based on depth
      node.append("ellipse")
        .attr("rx", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? 75 : 60;
        })
        .attr("ry", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? 32 : 25;
        })
        .attr("fill", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? "#fef3c7" : "#f0fdfa";
        })
        .attr("stroke", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? "#f59e0b" : "#14b8a6";
        })
        .attr("stroke-width", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? 3 : 2;
        });

      const maxTextWidth = 100;
      
      const wrapText = (textElement: d3.Selection<SVGTextElement, ForceNode, SVGGElement, unknown>, maxWidth: number) => {
        textElement.each(function(d) {
          const text = d3.select(this);
          const words = d.id.split(/\s+/).reverse();
          let word: string | undefined;
          let line: string[] = [];
          let lineNumber = 0;
          const lineHeight = 1.1;
          const y = text.attr("y");
          const dy = parseFloat(text.attr("dy") || "0");
          let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          
          while ((word = words.pop())) {
            line.push(word);
            tspan.text(line.join(" "));
            const tspanNode = tspan.node();
            if (tspanNode && tspanNode.getComputedTextLength() > maxWidth) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
          }
          
          const numLines = text.selectAll("tspan").size();
          if (numLines > 1) {
            const offset = -(numLines - 1) * lineHeight * 0.5;
            text.selectAll("tspan").attr("dy", function(this: SVGTSpanElement, _d, i) {
              return (offset + i * lineHeight + dy) + "em";
            });
          }
        });
      };

      node.append("text")
        .attr("dy", "0.31em")
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? "#92400e" : "#134e4a";
        })
        .style("font-size", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? "15px" : "14px";
        })
        .style("font-weight", d => {
          const depth = nodeDepth.get(d.id) || 0;
          return depth === 0 ? "700" : "600";
        })
        .each(function(d) {
          d3.select(this).text(d.id);
        })
        .call(wrapText, maxTextWidth);

      node.attr("opacity", 1);

      // Update positions on simulation tick
      simulation.on("tick", () => {
        link
          .attr("x1", d => (d.source as ForceNode).x!)
          .attr("y1", d => (d.source as ForceNode).y!)
          .attr("x2", d => (d.target as ForceNode).x!)
          .attr("y2", d => (d.target as ForceNode).y!);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

      return () => {
        simulation.stop();
      };
    }

    // Tree layout (existing code)
    const root = d3.hierarchy(data);
    
    // Calculate dynamic node separation based on text content
    const maxTextWidth = 100; // Maximum width for wrapped text
    const baseNodeSize = 20; // Base circle size and padding
    
    // Dynamic separation function that considers text dimensions
    const nodeSeparation = (a: d3.HierarchyPointNode<HierarchicalNode>, b: d3.HierarchyPointNode<HierarchicalNode>) => {
      // Calculate estimated text height (roughly 1 line per 15 chars for wrapped text)
      const estimateTextLines = (text: string) => Math.ceil(text.length / 15);
      const aLines = estimateTextLines(a.data.id);
      const bLines = estimateTextLines(b.data.id);
      const maxLines = Math.max(aLines, bLines);
      
      // Base separation plus additional space for multi-line text
      const baseSeparation = a.parent === b.parent ? 1 : 2;
      const textHeightFactor = Math.max(1, maxLines * 0.5);
      
      return baseSeparation * textHeightFactor;
    };
    
    // Set tree size and separation based on orientation
    const treeSize = orientation === 'horizontal' 
      ? [height - margin.top - margin.bottom, width - margin.left - margin.right]
      : [width - margin.left - margin.right, height - margin.top - margin.bottom];
    
    const treeLayout = d3.tree<HierarchicalNode>()
      .size(treeSize)
      .separation(nodeSeparation);
    
    treeLayout(root);

    // Calculate dynamic spacing multipliers based on tree density
    const nodeCount = root.descendants().length;
    const depthCount = root.height + 1;
    
    // Adjust spacing based on tree size and content
    const dynamicSiblingSpacing = siblingSpacing * Math.max(1, Math.sqrt(nodeCount) / 3);
    const dynamicGenerationSpacing = generationSpacing * (1 + (maxTextWidth / 200));

    // Apply custom spacing by scaling coordinates
    root.each(d => {
      d.x *= dynamicSiblingSpacing;
      d.y *= dynamicGenerationSpacing;
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    
    const allNodes = root.descendants();
    if (allNodes.length > 0) {
        const xCoords = allNodes.map(d => d.x);
        const yCoords = allNodes.map(d => d.y);
        const minX = d3.min(xCoords) ?? 0;
        const maxX = d3.max(xCoords) ?? 0;
        const minY = d3.min(yCoords) ?? 0;
        const maxY = d3.max(yCoords) ?? 0;
        
        // Calculate tree dimensions based on orientation
        const treeWidth = orientation === 'horizontal' ? maxY - minY : maxX - minX;
        const treeHeight = orientation === 'horizontal' ? maxX - minX : maxY - minY;

        const scaleX = treeWidth > 0 ? (width - margin.left - margin.right) / treeWidth : 1;
        const scaleY = treeHeight > 0 ? (height - margin.top - margin.bottom) / treeHeight : 1;
        const initialScale = Math.min(scaleX, scaleY, 1) * 0.9;
        
        // Calculate midpoint based on orientation
        const midX = orientation === 'horizontal' ? (minY + maxY) / 2 : (minX + maxX) / 2;
        const midY = orientation === 'horizontal' ? (minX + maxX) / 2 : (minY + maxY) / 2;
        
        const initialTransform = d3.zoomIdentity
            .translate(width / 2 - midX * initialScale, height / 2 - midY * initialScale)
            .scale(initialScale);
        
        svg.call(zoom.transform, initialTransform);
    } else {
        const initialTransform = d3.zoomIdentity.translate(margin.left, margin.top).scale(0.8);
        svg.call(zoom.transform, initialTransform);
    }

    // Create appropriate link generator based on orientation
    const linkGenerator = orientation === 'horizontal'
      ? d3.linkHorizontal<d3.HierarchyPointLink<HierarchicalNode>, d3.HierarchyPointNode<HierarchicalNode>>()
          .x(d => d.y)
          .y(d => d.x)
      : d3.linkVertical<d3.HierarchyPointLink<HierarchicalNode>, d3.HierarchyPointNode<HierarchicalNode>>()
          .x(d => d.x)
          .y(d => d.y);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1.5)
      .attr("d", linkGenerator as any)
      .attr("opacity", 0)
      .transition()
      .duration(500)
      .attr("opacity", 1);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => orientation === 'horizontal' 
        ? `translate(${d.y},${d.x})` 
        : `translate(${d.x},${d.y})`)
      .attr("opacity", 0)
      .style("cursor", "pointer")
      .on('click', (event, d) => {
          event.stopPropagation();
          onNodeSelect(d.data.id);
      })
      .on('mouseover', function(event, d) {
          const currentNode = d3.select(this);
          currentNode.raise(); 
          const transform = orientation === 'horizontal'
            ? `translate(${d.y},${d.x}) scale(1.2)`
            : `translate(${d.x},${d.y}) scale(1.2)`;
          currentNode.transition()
            .duration(150)
            .attr('transform', transform);
      })
      .on('mouseout', function(event, d) {
          const currentNode = d3.select(this);
          const transform = orientation === 'horizontal'
            ? `translate(${d.y},${d.x}) scale(1)`
            : `translate(${d.x},${d.y}) scale(1)`;
          currentNode.transition()
            .duration(150)
            .attr('transform', transform);
      });

    // Add ellipse nodes
    node.append("ellipse")
      .attr("rx", 60)
      .attr("ry", 25)
      .attr("fill", "#f0fdfa")
      .attr("stroke", "#14b8a6")
      .attr("stroke-width", 2);

    // Function to wrap text
    const wrapText = (textElement: d3.Selection<SVGTextElement, d3.HierarchyNode<HierarchicalNode>, SVGGElement, unknown>, maxWidth: number) => {
      textElement.each(function(d) {
        const text = d3.select(this);
        const words = d.data.id.split(/\s+/).reverse();
        let word: string | undefined;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const x = text.attr("x");
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy") || "0");
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        
        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(" "));
          const tspanNode = tspan.node();
          if (tspanNode && tspanNode.getComputedTextLength() > maxWidth) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", x)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
        
        // Center multi-line text vertically
        const numLines = text.selectAll("tspan").size();
        if (numLines > 1) {
          const offset = -(numLines - 1) * lineHeight * 0.5;
          text.selectAll("tspan").attr("dy", function(this: SVGTSpanElement, _d, i) {
            return (offset + i * lineHeight + dy) + "em";
          });
        }
      });
    };

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("fill", "#134e4a")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .each(function(d) {
        d3.select(this).text(d.data.id);
      })
      .call(wrapText, 100);
    
    node.transition()
      .duration(500)
      .delay((d,i) => i * 10)
      .attr("opacity", 1);
      
  }, [data, dimensions, onNodeSelect, siblingSpacing, generationSpacing, orientation, layoutMode, nodes, links]);

  // Effect for updating styles on search or selection change
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    if (g.empty()) return;
    
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    const isSearching = lowerCaseQuery.length > 0;

    if (layoutMode === 'force') {
      // Force layout matching
      type ForceNode = { id: string };
      const isMatchForce = (d: ForceNode) => 
        isSearching && d.id.toLowerCase().includes(lowerCaseQuery);
      const isSelectedForce = (d: ForceNode) => d.id === selectedNode;

      g.selectAll(".link")
        .transition().duration(300)
        .attr("opacity", isSearching ? 0.3 : 1);
      
      g.selectAll<SVGGElement, ForceNode>(".node")
        .transition().duration(300)
        .attr("opacity", d => !isSearching || isMatchForce(d) ? 1 : 0.3);

      g.selectAll<SVGEllipseElement, ForceNode>(".node ellipse")
        .transition().duration(300)
        .attr("rx", d => isSelectedForce(d) ? 75 : (isMatchForce(d) ? 70 : 60))
        .attr("ry", d => isSelectedForce(d) ? 32 : (isMatchForce(d) ? 30 : 25))
        .attr("fill", d => {
          if (isSelectedForce(d)) return '#fef3c7';
          if (isMatchForce(d)) return '#dbeafe';
          return '#f0fdfa';
        })
        .attr("stroke", d => {
          if (isSelectedForce(d)) return '#f59e0b';
          if (isMatchForce(d)) return '#3b82f6';
          return '#14b8a6';
        })
        .attr("stroke-width", d => isSelectedForce(d) ? 3 : 2);

      g.selectAll<SVGTextElement, ForceNode>(".node text")
        .transition().duration(300)
        .attr("fill", d => {
          if (isSelectedForce(d)) return '#92400e';
          if (isMatchForce(d)) return '#1e3a8a';
          return '#134e4a';
        })
        .style("font-weight", d => isSelectedForce(d) || isMatchForce(d) ? "bold" : "600");
    } else if (layoutMode === 'blocks') {
      // Blocks layout matching
      type BlockNode = { id: string };
      const isMatchBlock = (d: BlockNode) => 
        d && d.id && isSearching && d.id.toLowerCase().includes(lowerCaseQuery);
      const isSelectedBlock = (d: BlockNode) => d && d.id && d.id === selectedNode;

      g.selectAll(".link")
        .transition().duration(300)
        .attr("opacity", isSearching ? 0.3 : 1);
      
      g.selectAll<SVGGElement, BlockNode>(".node")
        .transition().duration(300)
        .attr("opacity", d => !isSearching || isMatchBlock(d) ? 1 : 0.3);

      g.selectAll<SVGRectElement, BlockNode>(".node rect")
        .transition().duration(300)
        .attr("fill", d => isSelectedBlock(d) ? "#10b981" : "#e0f2fe")
        .attr("stroke", d => {
          if (!d || !d.id) return "#0284c7";
          if (isSelectedBlock(d)) return "#059669";
          if (isMatchBlock(d)) return "#f59e0b";
          return "#0284c7";
        })
        .attr("stroke-width", d => isSelectedBlock(d) ? 3 : 2);

      g.selectAll<SVGTextElement, BlockNode>(".node text")
        .transition().duration(300)
        .style("font-weight", d => (d && (isSelectedBlock(d) || isMatchBlock(d))) ? "bold" : "500");
    } else {
      // Tree layout matching
      const isMatch = (d: d3.HierarchyNode<HierarchicalNode>) => 
        isSearching && d.data.id.toLowerCase().includes(lowerCaseQuery);
      
      const isSelected = (d: d3.HierarchyNode<HierarchicalNode>) => d.data.id === selectedNode;

      // Update link opacity
      g.selectAll(".link")
        .transition().duration(300)
        .attr("opacity", isSearching ? 0.3 : 1);
      
      // Update node group opacity
      g.selectAll<SVGGElement, d3.HierarchyNode<HierarchicalNode>>(".node")
        .transition().duration(300)
        .attr("opacity", d => !isSearching || isMatch(d) ? 1 : 0.3);

      // Update ellipse styles
      g.selectAll<SVGEllipseElement, d3.HierarchyNode<HierarchicalNode>>(".node ellipse")
        .transition().duration(300)
        .attr("rx", d => isSelected(d) ? 75 : (isMatch(d) ? 70 : 60))
        .attr("ry", d => isSelected(d) ? 32 : (isMatch(d) ? 30 : 25))
        .attr("fill", d => {
          if (isSelected(d)) return '#fef3c7';
          if (isMatch(d)) return '#dbeafe';
          return '#f0fdfa';
        })
        .attr("stroke", d => {
          if (isSelected(d)) return '#f59e0b';
          if (isMatch(d)) return '#3b82f6';
          return '#14b8a6';
        })
        .attr("stroke-width", d => isSelected(d) ? 3 : 2);

      // Update text styles
      g.selectAll<SVGTextElement, d3.HierarchyNode<HierarchicalNode>>(".node text")
        .transition().duration(300)
        .attr("fill", d => {
          if (isSelected(d)) return '#92400e';
          if (isMatch(d)) return '#1e3a8a';
          return '#134e4a';
        })
        .style("font-weight", d => isSelected(d) || isMatch(d) ? "bold" : "600");
    }

  }, [searchQuery, selectedNode, dimensions.width, siblingSpacing, generationSpacing, orientation, layoutMode]);


  return (
    <div ref={wrapperRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
});

export default FamilyTree;