import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { HierarchicalNode, FamilyTreeApi } from '../types';

interface FamilyTreeProps {
  data: HierarchicalNode;
  searchQuery: string;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  siblingSpacing: number;
  generationSpacing: number;
  orientation: 'horizontal' | 'vertical';
}

const FamilyTree = forwardRef<FamilyTreeApi, FamilyTreeProps>(({ 
  data, 
  searchQuery, 
  selectedNode, 
  onNodeSelect,
  siblingSpacing,
  generationSpacing,
  orientation,
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
          el.setAttribute('stroke', '#555555');
          el.setAttribute('fill', 'none');
          el.setAttribute('stroke-width', '1.5');
      });
      
      clonedSvg.querySelectorAll('.node circle').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('fill', '#ffffff');
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '2');
      });
  
      clonedSvg.querySelectorAll('.node text').forEach(el => {
          el.removeAttribute('style');
          el.setAttribute('fill', '#000000');
          // The dark stroke for text is good for the app's dark background,
          // but not for a light export background.
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
    if (!data || !svgRef.current || dimensions.width === 0) return;

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

    node.append("circle")
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
      .attr("x", d => {
        if (orientation === 'horizontal') {
          return d.children ? -18 : 18;
        } else {
          return 0;
        }
      })
      .attr("y", d => {
        if (orientation === 'vertical') {
          return d.children ? -18 : 18;
        } else {
          return 0;
        }
      })
      .attr("text-anchor", d => {
        if (orientation === 'horizontal') {
          return d.children ? "end" : "start";
        } else {
          return "middle";
        }
      })
      .attr("fill", "#e5e7eb")
      .style("font-size", "14px")
      .style("paint-order", "stroke")
      .attr("stroke", "#111827")
      .attr("stroke-width", "0.3em")
      .attr("stroke-linecap", "butt")
      .each(function(d) {
        d3.select(this).text(d.data.id);
      })
      .call(wrapText, maxTextWidth);
    
    node.transition()
      .duration(500)
      .delay((d,i) => i * 10)
      .attr("opacity", 1);
      
  }, [data, dimensions, onNodeSelect, siblingSpacing, generationSpacing, orientation]);

  // Effect for updating styles on search or selection change
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    if (g.empty()) return;
    
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    const isSearching = lowerCaseQuery.length > 0;

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

    // Update circle styles
    g.selectAll<SVGCircleElement, d3.HierarchyNode<HierarchicalNode>>(".node circle")
      .transition().duration(300)
      .attr("r", d => isSelected(d) ? 12 : (isMatch(d) ? 10 : 6))
      .attr("fill", d => {
        if (isSelected(d)) return '#a855f7';
        if (isMatch(d)) return '#3b82f6';
        return '#10b981';
      })
      .attr("stroke", d => {
        if (isSelected(d)) return '#7e22ce';
        if (isMatch(d)) return '#1d4ed8';
        return '#047857';
      });

    // Update text styles
    g.selectAll<SVGTextElement, d3.HierarchyNode<HierarchicalNode>>(".node text")
      .transition().duration(300)
      .style("font-weight", d => isSelected(d) || isMatch(d) ? "bold" : "500");

  }, [searchQuery, selectedNode, dimensions.width, siblingSpacing, generationSpacing, orientation]);


  return (
    <div ref={wrapperRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
});

export default FamilyTree;