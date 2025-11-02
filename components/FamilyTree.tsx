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

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setDimensions({
        width: element.clientWidth,
        height: element.clientHeight,
      });
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
    const treeLayout = d3.tree<HierarchicalNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    treeLayout(root);

    // Apply custom spacing by scaling coordinates
    root.each(d => {
      d.x *= siblingSpacing;
      d.y *= generationSpacing;
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    
    // Adjust initial zoom based on spacing
    const scaleFactor = Math.max(siblingSpacing, generationSpacing, 1);
    const initialScale = 0.8 / scaleFactor;
    const initialTransform = d3.zoomIdentity.translate(margin.left, margin.top).scale(initialScale);
    svg.call(zoom.transform, initialTransform);

    const linkGenerator = d3.linkHorizontal<d3.HierarchyPointLink<HierarchicalNode>, d3.HierarchyPointNode<HierarchicalNode>>()
      .x(d => d.y)
      .y(d => d.x);

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
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("opacity", 0)
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

    node.append("circle")
        .attr("stroke-width", 2);

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
    
    node.transition()
      .duration(500)
      .delay((d,i) => i * 10)
      .attr("opacity", 1);
      
  }, [data, dimensions, onNodeSelect, siblingSpacing, generationSpacing]);

  // Effect for updating styles on search or selection change
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    
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

  }, [searchQuery, selectedNode, dimensions.width]);


  return (
    <div ref={wrapperRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default FamilyTree;