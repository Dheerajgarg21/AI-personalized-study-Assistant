import React, { useState, useEffect } from 'react';
import {
  Network,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeMapPage({ onSelectTopicForQuiz, onSelectTopicForChat }) {
  const [knowledgeMap, setKnowledgeMap] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledgeMap();
      setKnowledgeMap(data);
      if (data?.nodes?.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load knowledge map', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { nodes = [], edges = [], stats = {} } = knowledgeMap || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'weak':
        return {
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300',
          dot: 'bg-rose-400',
        };
      case 'in_progress':
        return {
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'locked':
        return {
          bg: 'bg-slate-900/60',
          border: 'border-slate-800',
          text: 'text-slate-500',
          badge: 'bg-slate-800 text-slate-400',
          dot: 'bg-slate-600',
        };
      default:
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          text: 'text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-300',
          dot: 'bg-indigo-400',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Curriculum DAG Graph
              </span>
              <span className="text-xs text-slate-400">Dependency & Prerequisite Map</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Course Knowledge Representation</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Visualizes topic prerequisites and your current mastery state. Topics cannot be effectively mastered until prerequisite foundations are secured.
            </p>
          </div>

          {/* Graph Legend / Stats Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{stats.completed || 0} Completed</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{stats.in_progress || 0} In Progress</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{stats.weak || 0} Weak / Revise</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{stats.locked || 0} Locked</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Graph Board (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Interactive Prerequisite Map</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click any topic node to inspect</span>
          </div>

          {/* Visual Node Grid with Dependency Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nodes.map((node) => {
              const colors = getStatusColor(node.status);
              const isSelected = selectedNode?.id === node.id;
              const masteryPct = Math.round(node.mastery_score * 100);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? `${colors.bg} ring-2 ring-indigo-400 ${colors.border} shadow-lg shadow-indigo-500/10`
                      : `${colors.bg} ${colors.border} hover:border-slate-600`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {node.unit}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">{node.name}</h4>
                    </div>
                    {node.status === 'locked' ? (
                      <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : node.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : node.status === 'weak' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0 mt-1`} />
                    )}
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Mastery</span>
                      <span className={`font-bold ${colors.text}`}>{masteryPct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          node.status === 'completed'
                            ? 'bg-emerald-500'
                            : node.status === 'weak'
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Prerequisites Preview */}
                  {node.prerequisites && node.prerequisites.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Depends on {node.prerequisites.length} prerequisite(s)</span>
                      <span className="capitalize font-semibold text-slate-400">{node.difficulty}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Relationship Edge Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Prerequisite Topological Chains:</h4>
            <div className="text-xs text-slate-400 space-y-1">
              <p>&bull; <strong className="text-slate-200">Network Fundamentals</strong> &rarr; Topologies &rarr; OSI Model &rarr; TCP/IP</p>
              <p>&bull; <strong className="text-slate-200">TCP/IP Architecture</strong> &rarr; Data Link Framing &rarr; CRC Error Detection &rarr; Hamming Code</p>
              <p>&bull; <strong className="text-slate-200">TCP/IP Architecture</strong> &rarr; Network Layer IP Addressing &rarr; Subnetting & CIDR</p>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Card (1 col) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedNode.unit}
                </span>
                <h3 className="text-xl font-bold text-white pt-1">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400">Node ID: #{selectedNode.topic_id}</p>
              </div>

              {/* Status & Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Mastery</span>
                  <div className="text-lg font-bold text-indigo-400">
                    {Math.round(selectedNode.mastery_score * 100)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Confidence</span>
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round(selectedNode.confidence * 100)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Difficulty</span>
                  <div className="text-sm font-bold text-slate-200 capitalize">
                    {selectedNode.difficulty}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Status</span>
                  <div className="text-xs font-bold text-slate-200 capitalize">
                    {selectedNode.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Status explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Agent Evaluation</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedNode.status === 'completed'
                    ? 'Student has reached high mastery (\u226580%). Retain mastery via periodic spaced revision.'
                    : selectedNode.status === 'weak'
                    ? 'Quiz accuracy or recent tests fell below 50%. Reviewing simplified concepts is strongly advised.'
                    : selectedNode.status === 'locked'
                    ? 'Unfulfilled prerequisites detected. Secure foundation on prior topics first.'
                    : 'Topic unlocked and ready for active study sessions.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-10">Select a topic node from the graph to inspect.</p>
          )}

          {/* Action buttons */}
          {selectedNode && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => onSelectTopicForChat(selectedNode.name)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask AI About {selectedNode.name}</span>
              </button>

              <button
                onClick={() => onSelectTopicForQuiz(selectedNode.topic_id)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Launch Topic Assessment Quiz</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
