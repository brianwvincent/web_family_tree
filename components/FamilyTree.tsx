import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { HierarchicalNode } from '../types';

interface FamilyTreeProps {
  data: HierarchicalNode;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const { width, height } = dimensions;
    const margin = { top: 50, right: 120, bottom: 50, left: 120 };

    const g = svg.append("g");

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree<HierarchicalNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    treeLayout(root);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    
    // Initial position
    const initialTransform = d3.zoomIdentity.translate(margin.left, margin.top).scale(0.8);
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
      .attr("opacity", 0);

    // Fix: `append` cannot be called on a D3 transition. The `node` variable must be a selection.
    // First, append the child elements (`circle` and `text`) to the `node` selection.
    node.append("circle")
      .attr("r", 6)
      .attr("fill", "#10b981")
      .attr("stroke", "#047857")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -12 : 12)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.id)
      .attr("fill", "#e5e7eb")
      .style("font-size", "14px")
      .style("font-weight", "500");
    
    // Fix: Apply the transition to the node selection after its children have been appended.
    // This will fade in the node group and its contents.
    node.transition()
      .duration(500)
      .delay((d,i) => i * 10)
      .attr("opacity", 1);
      
  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default FamilyTree;