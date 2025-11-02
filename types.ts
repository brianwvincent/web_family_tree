export interface AppNode {
  id: string;
}

export interface AppLink {
  source: string;
  target: string;
}

export interface HierarchicalNode {
  id:string;
  children: HierarchicalNode[];
}

export interface FamilyTreeApi {
  getSVGData: () => { svgString: string; width: number; height: number } | null;
}
