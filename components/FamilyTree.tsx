import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { HierarchicalNode } from '../types';

interface FamilyTreeProps {
  data: HierarchicalNode;
  searchQuery: string;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  siblingSpacing: number;
  generationSpacing: number;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ 
  data, 
  searchQuery, 
  selectedNode, 
  onNodeSelect,
  siblingSpacing,
  generationSpacing,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    // FIX: The ResizeObserver callback requires an argument.
    const observer = new ResizeObserver(() => {
      setDimensions({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Effect for initial drawing and data changes.
  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear SVG only when data fundamentally changes

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    svg.on('click', (event) => {
        if (event.target === svg.node()) {
            onNodeSelect(null);
        }
    });

    const root = d3.hierarchy(data);
    
    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none");

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on('click', (event, d) => {
          event.stopPropagation();
          onNodeSelect(d.data.id);
      })
      .on('mouseover', function(event, d) {
          const currentNode = d3.select(this);
          currentNode.raise(); 
          currentNode.transition()
            .duration(150)
            .attr('transform', `translate(${d.y},${d.x}) scale(1.2)`);
      })
      .on('mouseout', function(event, d) {
          const currentNode = d3.select(this);
          currentNode.transition()
            .duration(150)
            .attr('transform', `translate(${d.y},${d.x}) scale(1)`);
      });

    node.append("circle").attr("stroke-width", 2);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -18 : 18)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.id)
      .attr("fill", "#e5e7eb")
      .style("font-size", "14px")
      .style("paint-order", "stroke")
      .attr("stroke", "#111827")
      .attr("stroke-width", "0.3em")
      .attr("stroke-linecap", "butt");
      
  }, [data, dimensions.width, dimensions.height, onNodeSelect]);

  // Effect for updating layout and styles
  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0 || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>("g");
    
    const { width, height } = dimensions;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };

    // 1. Recalculate layout with new spacing
    const root = d3.hierarchy(data);
    const treeLayout = d3.tree<HierarchicalNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    treeLayout(root);
    root.each(d => {
      d.x *= siblingSpacing;
      d.y *= generationSpacing;
    });

    const duration = 750;
    const t = svg.transition().duration(duration);

    // 2. Update element positions
    const linkGenerator = d3.linkHorizontal<any, any>().x(d => d.y).y(d => d.x);
    
    g.selectAll<SVGPathElement, d3.HierarchyPointLink<HierarchicalNode>>(".link")
      .data(root.links())
      .transition(t)
      .attr("d", linkGenerator as any);

    g.selectAll<SVGGElement, d3.HierarchyNode<HierarchicalNode>>(".node")
      .data(root.descendants())
      .transition(t)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // 3. Update element styles
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    const isSearching = lowerCaseQuery.length > 0;
    const isMatch = (d: d3.HierarchyNode<HierarchicalNode>) => isSearching && d.data.id.toLowerCase().includes(lowerCaseQuery);
    const isSelected = (d: d3.HierarchyNode<HierarchicalNode>) => d.data.id === selectedNode;

    g.selectAll(".link").transition(t).attr("stroke", "#4b5563").attr("opacity", isSearching ? 0.3 : 1);
    g.selectAll<SVGGElement, d3.HierarchyNode<HierarchicalNode>>(".node").transition(t).attr("opacity", d => !isSearching || isMatch(d) ? 1 : 0.3);

    g.selectAll<SVGCircleElement, d3.HierarchyNode<HierarchicalNode>>(".node circle")
      .transition(t)
      .attr("r", d => isSelected(d) ? 12 : (isMatch(d) ? 10 : 6))
      .attr("fill", d => isSelected(d) ? '#a855f7' : isMatch(d) ? '#3b82f6' : '#10b981')
      .attr("stroke", d => isSelected(d) ? '#7e22ce' : isMatch(d) ? '#1d4ed8' : '#047857');

    g.selectAll<SVGTextElement, d3.HierarchyNode<HierarchicalNode>>(".node text")
      .transition(t)
      .style("font-weight", d => isSelected(d) || isMatch(d) ? "bold" : "500");

    // 4. Update zoom to fit new layout
    const xCoords = root.descendants().map(d => d.x);
    const yCoords = root.descendants().map(d => d.y);
    const [minX, maxX] = d3.extent(xCoords) as [number, number];
    const [minY, maxY] = d3.extent(yCoords) as [number, number];
    
    if (minX !== undefined) {
      const treeWidth = (maxY - minY) || 1;
      const treeHeight = (maxX - minX) || 1;
      const effectiveWidth = width - margin.left - margin.right;
      const effectiveHeight = height - margin.top - margin.bottom;

      const scale = Math.max(0.1, Math.min(effectiveWidth / treeWidth, effectiveHeight / treeHeight) * 0.9);
      const translateX = effectiveWidth / 2 - (minY + treeWidth / 2) * scale + margin.left;
      const translateY = effectiveHeight / 2 - (minX + treeHeight / 2) * scale + margin.top;
      
      const newTransform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
      svg.transition(t).call(zoomRef.current.transform, newTransform);
    }
    
  }, [data, dimensions, siblingSpacing, generationSpacing, searchQuery, selectedNode, onNodeSelect]);


  return (
    <div ref={wrapperRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default FamilyTree;