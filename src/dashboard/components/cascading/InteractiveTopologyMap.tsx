import React, { useState, useRef, useEffect } from 'react';
import {
  InfrastructureNode,
  DependencyEdge,
  AssetStatus,
  AssetCategory
} from '../../../shared/cascadingTypes';
import {
  RotateCcw,
  Plus,
  Link,
  Search,
  Filter,
  AlertTriangle,
  ShieldCheck,
  X,
  Maximize2,
  Layers,
  ArrowRight,
  Trash2,
  Move,
  Building2
} from 'lucide-react';

interface InteractiveTopologyMapProps {
  nodes: InfrastructureNode[];
  edges: DependencyEdge[];
  selectedNode: InfrastructureNode | null;
  onSelectNode: (node: InfrastructureNode) => void;
  onUpdateNode: (node: InfrastructureNode) => void;
  onAddNode: (node: InfrastructureNode) => void;
  onAddEdge: (edge: DependencyEdge) => void;
  onUpdateEdge: (edge: DependencyEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  onTriggerNodeCascade: (nodeId: string) => void;
  onIsolateNode: (nodeId: string) => void;
}

/** 45° hatch used for the middle band of the severity ramp. */
const HATCH_FILL = 'repeating-linear-gradient(45deg, #000000 0 1.5px, transparent 1.5px 3.5px)';

/** The two accents. Green = operational/healthy, blue = water & telemetry. */
const SAFE = '#0e8a5f';
const INFO = '#0072f0';

/** 0.25s hue transition, matching `.sev-mark` in the design system. */
const HUE_EASE = 'cubic-bezier(.23,1,.32,1)';

/** Dependency links that carry water or telemetry rather than power/access. */
const INFO_DEPENDENCIES = new Set(['water_drainage', 'flood_inundation', 'telecom_backbone']);

type NodeEncoding = {
  /** Ring weight in px — 1 → 2 → 3 as criticality rises. */
  ring: 1 | 2 | 3;
  /** Disc fill — white → hatched → solid black. */
  fill: 'white' | 'hatch' | 'solid';
  /** Ring colour. Green only for OPERATIONAL; every failing state is black. */
  ringColor: string;
  label: string;
};

/**
 * Status is carried by two stacked visual channels — ring weight (1/2/3px) and
 * disc fill (white / hatched / solid) — so it survives any kind of colour
 * vision. Colour is a third, redundant channel: OPERATIONAL takes the green
 * ring, everything from AT RISK downward stays black. Both channels are
 * published in the canvas legend, and the status word is always shown too.
 */
const getNodeEncoding = (status: AssetStatus): NodeEncoding => {
  switch (status) {
    case 'OPERATIONAL':
      return { ring: 1, fill: 'white', ringColor: SAFE, label: 'OPERATIONAL' };
    case 'AT_RISK':
      return { ring: 2, fill: 'white', ringColor: '#000000', label: 'AT RISK' };
    case 'DISRUPTED':
      return { ring: 2, fill: 'hatch', ringColor: '#000000', label: 'DISRUPTED' };
    case 'CRITICAL':
      return { ring: 3, fill: 'hatch', ringColor: '#000000', label: 'CRITICAL' };
    case 'FAILED':
      return { ring: 3, fill: 'solid', ringColor: '#000000', label: 'FAILED' };
    default:
      return { ring: 1, fill: 'white', ringColor: '#000000', label: String(status) };
  }
};

const nodeDiscStyle = (enc: NodeEncoding, size = 14): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor: enc.fill === 'solid' ? '#000000' : enc.ringColor === SAFE ? '#0e8a5f0a' : '#ffffff',
  backgroundImage: enc.fill === 'hatch' ? HATCH_FILL : undefined,
  boxShadow: `inset 0 0 0 ${enc.ring}px ${enc.ringColor}`,
  transition: `box-shadow 0.25s ${HUE_EASE}, background-color 0.25s ${HUE_EASE}`
});

export const InteractiveTopologyMap: React.FC<InteractiveTopologyMapProps> = ({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  onTriggerNodeCascade,
  onIsolateNode
}) => {
  // Default Grid Layout Positions
  const getDefaultPos = (id: string, index: number) => {
    const layoutGrid = [
      { x: 14, y: 25 },
      { x: 32, y: 28 },
      { x: 52, y: 22 },
      { x: 78, y: 20 },
      { x: 82, y: 55 },
      { x: 32, y: 68 },
      { x: 58, y: 72 },
      { x: 50, y: 48 },
    ];
    if (index < layoutGrid.length) return layoutGrid[index];
    const angle = (index / Math.max(1, nodes.length)) * 2 * Math.PI;
    return { x: Math.round(50 + 32 * Math.cos(angle)), y: Math.round(50 + 32 * Math.sin(angle)) };
  };

  // Node Positions State (percentages 0 - 100)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const initialPos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, idx) => {
      initialPos[n.id] = getDefaultPos(n.id, idx);
    });
    return initialPos;
  });

  // Ensure new nodes get a position
  useEffect(() => {
    setNodePositions(prev => {
      const next = { ...prev };
      nodes.forEach((n, idx) => {
        if (!next[n.id]) {
          next[n.id] = getDefaultPos(n.id, idx);
        }
      });
      return next;
    });
  }, [nodes]);

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Canvas View Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showFlowParticles, setShowFlowParticles] = useState<boolean>(true);
  const [showBadges, setShowBadges] = useState<boolean>(true);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hover state for highlighting connections
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Edge Inspector Modal
  const [selectedEdge, setSelectedEdge] = useState<DependencyEdge | null>(null);

  // Add Node Modal State
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeCategory, setNewNodeCategory] = useState<AssetCategory>('Power Stations');
  const [newNodeCapacity, setNewNodeCapacity] = useState<string>('100% Operational');

  // Add Edge Link Modal State
  const [showAddEdgeModal, setShowAddEdgeModal] = useState<boolean>(false);
  const [edgeSourceId, setEdgeSourceId] = useState<string>('');
  const [edgeTargetId, setEdgeTargetId] = useState<string>('');
  const [edgeImpactWeight, setEdgeImpactWeight] = useState<number>(0.8);
  const [edgeDesc, setEdgeDesc] = useState<string>('');

  // Drag mouse event handlers
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) onSelectNode(node);
  };

  const handleMouseMoveContainer = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    setNodePositions(prev => ({
      ...prev,
      [draggingNodeId]: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    }));
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  const handleResetLayout = () => {
    const reset: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, idx) => {
      reset[n.id] = getDefaultPos(n.id, idx);
    });
    setNodePositions(reset);
    setZoomLevel(1);
  };

  const handleAutoArrangeGrid = () => {
    const arranged: Record<string, { x: number; y: number }> = {};
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((n, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = 15 + col * Math.floor(70 / Math.max(1, cols - 1 || 1));
      const y = 15 + row * Math.floor(70 / Math.max(1, Math.ceil(nodes.length / cols) - 1 || 1));
      arranged[n.id] = { x, y };
    });
    setNodePositions(arranged);
  };

  // Active highlighted relationships
  const activeFocusNodeId = hoveredNodeId || selectedNode?.id || null;

  // Connected edges
  const incomingEdgeIds = new Set(
    edges.filter(e => e.targetNodeId === activeFocusNodeId).map(e => e.id)
  );
  const outgoingEdgeIds = new Set(
    edges.filter(e => e.sourceNodeId === activeFocusNodeId).map(e => e.id)
  );

  const upstreamNodeIds = new Set(
    edges.filter(e => e.targetNodeId === activeFocusNodeId).map(e => e.sourceNodeId)
  );
  const downstreamNodeIds = new Set(
    edges.filter(e => e.sourceNodeId === activeFocusNodeId).map(e => e.targetNodeId)
  );

  // Filtered nodes
  const filteredNodes = nodes.filter(node => {
    if (categoryFilter !== 'ALL' && node.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && node.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        node.zoneName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const id = `node-custom-${Date.now()}`;
    const newNode: InfrastructureNode = {
      id,
      name: newNodeName,
      category: newNodeCategory,
      lat: 12.98,
      lng: 80.22,
      status: 'OPERATIONAL',
      healthPct: 100,
      failureProbability: 5,
      criticalityScore: 80,
      capacity: newNodeCapacity,
      currentLoad: '30% Load',
      zoneName: 'Central Command Sector',
      dependenciesCount: 0,
      description: `Custom infrastructure asset node manually provisioned in command Twin.`
    };

    onAddNode(newNode);
    setNodePositions(prev => ({
      ...prev,
      [id]: { x: 50, y: 50 }
    }));

    setNewNodeName('');
    setShowAddNodeModal(false);
  };

  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId) return;

    const newEdge: DependencyEdge = {
      id: `edge-custom-${Date.now()}`,
      sourceNodeId: edgeSourceId,
      targetNodeId: edgeTargetId,
      dependencyType: 'power_supply',
      impactWeight: edgeImpactWeight,
      description: edgeDesc || `Dependency link between ${edgeSourceId} and ${edgeTargetId}.`
    };

    onAddEdge(newEdge);
    setShowAddEdgeModal(false);
    setEdgeDesc('');
  };

  const fieldClass =
    'w-full bg-paper border border-line rounded-[4px] p-2 text--body text-ink outline-none focus:border-ink transition-colors';

  const statusLegend: AssetStatus[] = ['OPERATIONAL', 'AT_RISK', 'DISRUPTED', 'CRITICAL', 'FAILED'];

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Filter & Action Control Toolbar */}
      <div className="panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Search & Category Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search asset node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-paper border border-line rounded-[4px] pl-8 pr-3 py-1.5 text--body text-ink placeholder:text-muted outline-none focus:border-ink w-52 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-paper border border-line rounded-[4px] px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-ink text--body outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Power Stations">Power Stations</option>
              <option value="Hospitals">Hospitals</option>
              <option value="Bridges">Bridges &amp; Roads</option>
              <option value="Shelters">Shelters</option>
              <option value="Fire Stations">Fire Stations</option>
              <option value="Drainage Networks">Drainage Networks</option>
              <option value="Communication Towers">Telecom Towers</option>
              <option value="Flood Zones">Flood Inundation Zones</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-paper border border-line rounded-[4px] px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-ink text--body outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="AT_RISK">At Risk</option>
              <option value="DISRUPTED">Disrupted</option>
              <option value="CRITICAL">Critical</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Right Canvas Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFlowParticles(!showFlowParticles)}
            className={`cta ${showFlowParticles ? 'cta--primary' : 'cta--secondary'} cta--mini gap-1.5`}
            title="Toggle Animated Dependency Flow Lines"
          >
            <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Flow Vectors</span>
          </button>

          <button
            onClick={handleAutoArrangeGrid}
            className="cta cta--secondary cta--mini gap-1.5"
            title="Auto Grid Layout"
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Auto Layout</span>
          </button>

          <button
            onClick={handleResetLayout}
            className="cta cta--secondary cta--mini gap-1.5"
            title="Reset Node Positions"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Reset Pos</span>
          </button>

          <button
            onClick={() => setShowAddNodeModal(true)}
            className="cta cta--primary cta--mini gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Add Asset Node</span>
          </button>

          <button
            onClick={() => setShowAddEdgeModal(true)}
            className="cta cta--secondary cta--mini gap-1.5"
          >
            <Link className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Connect Link</span>
          </button>
        </div>
      </div>

      {/* 2. Canvas legend — every encoded dimension is spelled out: ring weight,
             disc fill, line style, and now colour. Nothing on the canvas is
             coloured without an entry here. */}
      <div className="panel--wash px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text--eyebrow text-muted">Asset status</span>
          {statusLegend.map(status => {
            const enc = getNodeEncoding(status);
            return (
              <span key={status} className="flex items-center gap-1.5 text--footnote text-subtle">
                <span style={nodeDiscStyle(enc, 12)} />
                {enc.label}
                <span className="text-muted">
                  ({enc.ring}px {enc.ringColor === SAFE ? 'green' : 'black'} ring)
                </span>
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:border-l md:border-line md:pl-6">
          <span className="text--eyebrow text-muted">Dependency edges</span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <svg width="26" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="26" y2="3" stroke="#898989" strokeWidth="1" strokeDasharray="5,4" />
            </svg>
            Predicted dependency
          </span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <svg width="26" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="26" y2="3" stroke="#898989" strokeWidth="1" />
            </svg>
            Observed failure link
          </span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <svg width="26" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="26" y2="3" stroke={INFO} strokeWidth="1" />
            </svg>
            Water / drainage / telecom link
          </span>
          <span className="flex items-center gap-1.5 text--footnote text-subtle">
            <svg width="26" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="26" y2="3" stroke="#000000" strokeWidth="2" />
            </svg>
            Active cascade path
          </span>
        </div>
      </div>

      {/* 3. Interactive SVG Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMoveContainer}
        onMouseUp={handleMouseUp}
        className="bg-paper border border-line relative min-h-[460px] h-[460px] rounded-[4px] overflow-hidden select-none"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: draggingNodeId ? 'none' : 'transform 0.2s ease'
        }}
      >
        {/* Canvas hint strip */}
        <div className="absolute top-3 left-3 z-20 bg-paper border border-line px-3 py-1.5 rounded-[4px] text--footnote text-muted">
          Drag nodes to rearrange · Click a line to inspect the dependency
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-paper border border-line p-1 rounded-[4px]">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
            className="w-6 h-6 flex items-center justify-center rounded-[3px] text-ink hover:bg-wash transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <span className="px-2 text--footnote text-muted tabular-nums">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
            className="w-6 h-6 flex items-center justify-center rounded-[3px] text-ink hover:bg-wash transition-colors"
            title="Zoom In"
          >
            +
          </button>
        </div>

        {/* SVG Directed Edges Layer */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <marker id="arrow-default" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#898989" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />
            </marker>
            <marker id="arrow-info" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={INFO} />
            </marker>
          </defs>

          {edges.map((edge) => {
            const p1 = nodePositions[edge.sourceNodeId];
            const p2 = nodePositions[edge.targetNodeId];
            if (!p1 || !p2) return null;

            const srcNode = nodes.find(n => n.id === edge.sourceNodeId);
            const tgtNode = nodes.find(n => n.id === edge.targetNodeId);

            // Hide edge if source or target filtered out
            const srcVisible = filteredNodes.some(n => n.id === edge.sourceNodeId);
            const tgtVisible = filteredNodes.some(n => n.id === edge.targetNodeId);
            if (!srcVisible && !tgtVisible) return null;

            const isHovered = hoveredEdgeId === edge.id;
            const isIncoming = incomingEdgeIds.has(edge.id);
            const isOutgoing = outgoingEdgeIds.has(edge.id);
            const isFocused = isIncoming || isOutgoing || isHovered;

            const isCritical = srcNode?.status === 'FAILED' || srcNode?.status === 'CRITICAL' || tgtNode?.status === 'FAILED';

            // Edge encoding:
            //  - weight/darkness  → whether the edge is on the active cascade path
            //  - solid vs dashed  → observed failure link vs merely predicted dependency
            //  - blue             → the link carries water or telemetry rather than
            //                       power or physical access. Never applied while the
            //                       edge is on the active cascade path: a live cascade
            //                       is black 2px whatever it happens to carry.
            const isObserved = isCritical;
            const carriesInfo = INFO_DEPENDENCIES.has(edge.dependencyType);
            const strokeColor = isFocused ? '#000000' : carriesInfo ? INFO : '#898989';
            const strokeWidth = isFocused ? 2 : 1;
            const marker = isFocused
              ? 'url(#arrow-active)'
              : carriesInfo
                ? 'url(#arrow-info)'
                : 'url(#arrow-default)';

            return (
              <g
                key={edge.id}
                onClick={() => setSelectedEdge(edge)}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                className="cursor-pointer group"
              >
                {/* Wide invisible hit area for easy edge clicking */}
                <line
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke="transparent"
                  strokeWidth="16"
                />

                {/* Visible Dependency Vector Line */}
                <line
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isObserved ? 'none' : '5,4'}
                  className={showFlowParticles && isFocused ? 'animate-pulse-mono' : ''}
                  opacity={activeFocusNodeId && !isFocused ? 0.35 : 1}
                  markerEnd={marker}
                  style={{ transition: `stroke 0.25s ${HUE_EASE}, stroke-width 0.25s ${HUE_EASE}` }}
                />

                {/* Edge Label on hover / focus */}
                {isHovered && (
                  <text
                    x={`${(p1.x + p2.x) / 2}%`}
                    y={`${(p1.y + p2.y) / 2}%`}
                    fill="#000000"
                    fontSize="12"
                    fontWeight="500"
                    textAnchor="middle"
                    stroke="#ffffff"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    Weight: {Math.round(edge.impactWeight * 100)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Interactive Node Markers Overlay */}
        <div className="relative w-full h-full">
          {filteredNodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 50, y: 50 };
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNodeId === node.id;
            const encoding = getNodeEncoding(node.status);

            const isUpstream = activeFocusNodeId && upstreamNodeIds.has(node.id);
            const isDownstream = activeFocusNodeId && downstreamNodeIds.has(node.id);
            const isDimmed = activeFocusNodeId && node.id !== activeFocusNodeId && !isUpstream && !isDownstream;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  borderColor: isSelected || isHovered ? '#000000' : '#dddddd',
                  // Selected: 2px black ring plus a 4px white halo that lifts the
                  // marker clear of the dependency lines underneath it.
                  boxShadow: isSelected ? '0 0 0 2px #000000, 0 0 0 6px #ffffff' : undefined
                }}
                className={`absolute z-10 cursor-grab active:cursor-grabbing px-2.5 py-2 rounded-[4px] border bg-paper flex items-center gap-2 transition-[opacity,border-color] ${
                  isSelected ? 'z-30' : ''
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                {/* Node Status Disc — ring weight + fill carry the severity */}
                <span style={nodeDiscStyle(encoding)} />

                {/* Node Name & Category Info */}
                <div className="flex flex-col text-left pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text--footnote text-ink font-medium leading-none whitespace-nowrap">
                      {node.name.length > 22 ? node.name.slice(0, 20) + '...' : node.name}
                    </span>
                    {isUpstream && (
                      <span className="badge badge--info">UPSTREAM</span>
                    )}
                    {isDownstream && (
                      <span className="badge badge--advisory">IMPACTED</span>
                    )}
                  </div>

                  <span className="text--footnote text-muted mt-1 flex items-center justify-between gap-2">
                    <span>{node.category}</span>
                    <span className="tabular-nums text-subtle">{node.healthPct}% health</span>
                  </span>
                </div>

                {/* Drag icon indicator */}
                <Move className="w-3 h-3 text-muted flex-shrink-0 ml-1" strokeWidth={1.5} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Asset Inspector & Real-Time Action Dashboard */}
      {selectedNode && (
        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ink" strokeWidth={1.5} />
              <span className="text--subtitle3 text-ink">
                Asset telemetry &amp; controls — {selectedNode.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text--footnote text-muted">
                Zone <span className="text-near">{selectedNode.zoneName}</span>
              </span>
              {/* Status — disc encoding plus the explicit word */}
              <span className="flex items-center gap-1.5">
                <span style={nodeDiscStyle(getNodeEncoding(selectedNode.status), 12)} />
                <span
                  className="text--footnote font-medium tracking-[0.06em] uppercase"
                  style={{
                    color: getNodeEncoding(selectedNode.status).ringColor === SAFE ? '#0a6b4a' : '#000000',
                    transition: `color 0.25s ${HUE_EASE}`
                  }}
                >
                  {getNodeEncoding(selectedNode.status).label}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            {/* Health & Failure Prob Real-Time Slider Controls */}
            <div className="md:col-span-5 panel--wash p-3.5 space-y-3">
              <span className="text--eyebrow text-muted block">
                Real-time asset stress test
              </span>

              {/* Health Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text--footnote">
                  <span className="text-subtle">Operational health level</span>
                  <span className="text-ink font-medium tabular-nums">{selectedNode.healthPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedNode.healthPct}
                  onChange={(e) => {
                    const health = Number(e.target.value);
                    const failureProb = 100 - health;
                    let status: AssetStatus = 'OPERATIONAL';
                    if (health === 0) status = 'FAILED';
                    else if (health < 30) status = 'CRITICAL';
                    else if (health < 60) status = 'AT_RISK';
                    else if (health < 80) status = 'DISRUPTED';

                    onUpdateNode({
                      ...selectedNode,
                      healthPct: health,
                      failureProbability: failureProb,
                      status
                    });
                  }}
                  className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
                />
                {/* Health read-out as a 4px track — solid black fill on a wash track */}
                <div className="h-1 bg-wash-strong rounded-[1px] overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${selectedNode.healthPct}%` }} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => onTriggerNodeCascade(selectedNode.id)}
                  className="cta cta--primary cta--mini gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Trigger Total Failure</span>
                </button>

                <button
                  onClick={() => onIsolateNode(selectedNode.id)}
                  className="cta cta--secondary cta--mini gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Isolate &amp; Restore (+40% HP)</span>
                </button>
              </div>
            </div>

            {/* Asset Metrics Box */}
            <div className="md:col-span-7 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-line">
                {[
                  { label: 'Category', value: selectedNode.category },
                  { label: 'Failure probability', value: `${selectedNode.failureProbability}%`, numeric: true },
                  { label: 'Criticality index', value: `${selectedNode.criticalityScore} / 100`, numeric: true },
                  { label: 'Capacity', value: selectedNode.capacity },
                  { label: 'Current load', value: selectedNode.currentLoad },
                  { label: 'Direct dependencies', value: `${incomingEdgeIds.size} up / ${outgoingEdgeIds.size} down`, numeric: true }
                ].map(metric => (
                  <div key={metric.label} className="p-2.5 border-r border-b border-line">
                    <span className="text--eyebrow text-muted block mb-1">{metric.label}</span>
                    <span className={`text--body-medium text-ink ${metric.numeric ? 'tabular-nums' : ''}`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text--body text-subtle leading-relaxed">
                {selectedNode.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Edge Inspector Modal */}
      {selectedEdge && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="panel p-5 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-ink" strokeWidth={1.5} />
                <span className="text--subtitle3 text-ink">Dependency edge inspector</span>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="cta cta--inline text-muted hover:text-ink"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="panel--wash p-3 space-y-2">
              <div className="flex items-center justify-between text--footnote">
                <span className="text-muted">Source provider</span>
                <span className="text--body-medium text-ink">
                  {nodes.find(n => n.id === selectedEdge.sourceNodeId)?.name || selectedEdge.sourceNodeId}
                </span>
              </div>
              <div className="flex items-center justify-center text-muted">
                <ArrowRight className="w-4 h-4 my-1" strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-between text--footnote">
                <span className="text-muted">Target consumer</span>
                <span className="text--body-medium text-ink">
                  {nodes.find(n => n.id === selectedEdge.targetNodeId)?.name || selectedEdge.targetNodeId}
                </span>
              </div>
            </div>

            {/* Impact Weight Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text--footnote">
                <span className="text-subtle">Cascade impact weight</span>
                <span className="text-ink font-medium tabular-nums">{Math.round(selectedEdge.impactWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={selectedEdge.impactWeight}
                onChange={(e) => {
                  const weight = Number(e.target.value);
                  const updated = { ...selectedEdge, impactWeight: weight };
                  setSelectedEdge(updated);
                  onUpdateEdge(updated);
                }}
                className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
              />
              <div className="h-1 bg-wash-strong rounded-[1px] overflow-hidden">
                <div className="h-full bg-ink" style={{ width: `${Math.round(selectedEdge.impactWeight * 100)}%` }} />
              </div>
            </div>

            <p className="text--body text-subtle leading-relaxed panel--wash p-3">
              {selectedEdge.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <button
                onClick={() => {
                  onDeleteEdge(selectedEdge.id);
                  setSelectedEdge(null);
                }}
                className="cta cta--secondary cta--mini gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Sever Link</span>
              </button>

              <button
                onClick={() => setSelectedEdge(null)}
                className="cta cta--primary cta--mini"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Asset Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleCreateNode} className="panel p-5 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <span className="text--subtitle3 text-ink flex items-center gap-2">
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Add infrastructure asset node
              </span>
              <button type="button" onClick={() => setShowAddNodeModal(false)} className="cta cta--inline text-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Asset name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adyar Mobile Command Trailer"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Category</label>
                <select
                  value={newNodeCategory}
                  onChange={(e) => setNewNodeCategory(e.target.value as AssetCategory)}
                  className={fieldClass}
                >
                  <option value="Power Stations">Power Stations</option>
                  <option value="Hospitals">Hospitals</option>
                  <option value="Bridges">Bridges &amp; Roads</option>
                  <option value="Shelters">Shelters</option>
                  <option value="Fire Stations">Fire Stations</option>
                  <option value="Drainage Networks">Drainage Networks</option>
                  <option value="Communication Towers">Telecom Towers</option>
                  <option value="Flood Zones">Flood Inundation Zones</option>
                </select>
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Capacity / specs</label>
                <input
                  type="text"
                  placeholder="e.g. 150 kW Generator / 50 Staff"
                  value={newNodeCapacity}
                  onChange={(e) => setNewNodeCapacity(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowAddNodeModal(false)}
                className="cta cta--tertiary"
              >
                Cancel
              </button>
              <button type="submit" className="cta cta--primary cta--mini">
                Provision Node
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Add Edge Link Modal */}
      {showAddEdgeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEdge} className="panel p-5 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-line">
              <span className="text--subtitle3 text-ink flex items-center gap-2">
                <Link className="w-4 h-4" strokeWidth={1.5} /> Connect dependency edge
              </span>
              <button type="button" onClick={() => setShowAddEdgeModal(false)} className="cta cta--inline text-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Source upstream provider</label>
                <select
                  value={edgeSourceId}
                  onChange={(e) => setEdgeSourceId(e.target.value)}
                  required
                  className={fieldClass}
                >
                  <option value="">Select source node...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Target downstream dependent</label>
                <select
                  value={edgeTargetId}
                  onChange={(e) => setEdgeTargetId(e.target.value)}
                  required
                  className={fieldClass}
                >
                  <option value="">Select target node...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">
                  Dependency impact weight — <span className="tabular-nums">{Math.round(edgeImpactWeight * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={edgeImpactWeight}
                  onChange={(e) => setEdgeImpactWeight(Number(e.target.value))}
                  className="w-full accent-ink bg-wash-strong h-1 cursor-pointer"
                />
                <div className="h-1 bg-wash-strong rounded-[1px] overflow-hidden mt-1.5">
                  <div className="h-full bg-ink" style={{ width: `${Math.round(edgeImpactWeight * 100)}%` }} />
                </div>
              </div>

              <div>
                <label className="text--eyebrow text-muted block mb-1.5">Relationship description</label>
                <input
                  type="text"
                  placeholder="e.g. Feeder line 3 powers hospital emergency backup ICU"
                  value={edgeDesc}
                  onChange={(e) => setEdgeDesc(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowAddEdgeModal(false)}
                className="cta cta--tertiary"
              >
                Cancel
              </button>
              <button type="submit" className="cta cta--primary cta--mini">
                Establish Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
