import React from 'react';
import type { RelationshipNode, RelationshipEdge } from '../../../lib/admin/investigate-types';

interface RelationshipGraphProps {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

const nodeGlyph: Record<string, string> = {
  Client: 'C',
  Commande: 'O',
  Paiement: '$',
  Partenaire: 'P',
  Mission: 'M',
  Chauffeur: 'D',
};

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ nodes, edges }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        GRAPHE DE RELATIONS
      </h3>

      <div className="relative overflow-hidden rounded-xl bg-gray-50" style={{ minHeight: 360 }}>
        <svg width="100%" height="360" viewBox="180 20 450 390" preserveAspectRatio="xMidYMid meet">
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const stroke =
              edge.type === 'confirmed' ? '#22c55e' :
              edge.type === 'weak' ? '#eab308' : '#94a3b8';
            const strokeDash = edge.type === 'indirect' ? '6 3' : 'none';
            return (
              <g key={i}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={stroke}
                  strokeWidth={2}
                  strokeDasharray={strokeDash}
                />
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2 - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={22} fill={node.color} stroke="white" strokeWidth={2} />
              <text x={node.x} y={node.y + 4} textAnchor="middle" className="fill-white text-[12px] font-bold">
                {nodeGlyph[node.type] ?? node.label.slice(0, 1)}
              </text>
              <text x={node.x} y={node.y + 36} textAnchor="middle" className="text-[10px] fill-gray-700 font-medium">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Confirmé</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" /> Faible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block border-dotted" /> Indirect</span>
      </div>
    </div>
  );
};
