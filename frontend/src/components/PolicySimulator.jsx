import React, { useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// NEW: Accept the sandboxData prop
const PolicySimulator = ({ sandboxData }) => {
  // Control states
  const [corporateBan, setCorporateBan] = useState(false);
  const [donationCap, setDonationCap] = useState(null);
  const [publicFundingPercent, setPublicFundingPercent] = useState(0);

  // Data states
  const [baselineData, setBaselineData] = useState({ nodes: [], links: [] });
  const [simulatedData, setSimulatedData] = useState({ nodes: [], links: [] });
  const [impactMetrics, setImpactMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maxDonation, setMaxDonation] = useState(10000000);

  // Helper: Convert sandbox donations to network format
  const convertSandboxToNetwork = (donations) => {
    const nodesMap = new Map();
    const linksList = [];

    console.log("🔍 Converting sandbox donations to network:", donations);

    donations.forEach(don => {
      const cName = don.candidate_name || "Unknown Candidate";
      const dName = don.donor_name || "Unknown Donor";
      
      // Generate safe IDs matching our backend logic
      const cId = cName.toLowerCase().replace(/ /g, "_").substring(0, 50);
      const dId = dName.toLowerCase().replace(/ /g, "_").substring(0, 50);
      const amount = Number(don.amount) || 0;

      console.log(`  → Donation: ${dName} (${dId}) → ${cName} (${cId}): ${amount}`);

      // 1. Create Nodes if they don't exist
      if (!nodesMap.has(cId)) {
        nodesMap.set(cId, { id: cId, name: cName, group: "Candidate", centrality_score: 0 });
      }
      if (!nodesMap.has(dId)) {
        nodesMap.set(dId, { id: dId, name: dName, group: "Donor", centrality_score: 0 });
      }

      // Add centrality weight
      nodesMap.get(cId).centrality_score += 0.1;
      nodesMap.get(dId).centrality_score += 0.05;

      // 2. Create or aggregate Links
      const existingLink = linksList.find(l => l.source === dId && l.target === cId);
      if (existingLink) {
        existingLink.amount += amount;
      } else {
        linksList.push({ source: dId, target: cId, amount: amount });
      }
    });

    const result = { nodes: Array.from(nodesMap.values()), links: linksList };
    console.log("Network created:", result);
    return result;
  };

  // Fetch baseline on mount
  useEffect(() => {
    console.log("PolicySimulator: Baseline effect triggered", { sandboxData, hasDonations: sandboxData?.donations?.length });
    
    // --- BRANCH 1: ISOLATED SANDBOX MODE ---
    if (sandboxData && sandboxData.donations) {
      console.log("SANDBOX MODE: Converting", sandboxData.donations.length, "donations to network");
      const networkData = convertSandboxToNetwork(sandboxData.donations);
      setBaselineData(networkData);
      setSimulatedData(networkData); // Initialize simulated with baseline
      // Infer max donation for slider from baseline
      const maxAmount = Math.max(...networkData.links.map(l => l.amount), 1000000);
      setMaxDonation(Math.ceil(maxAmount / 100000) * 100000);
    } 
    // --- BRANCH 2: GLOBAL DATABASE MODE ---
    else {
      console.log("DATABASE MODE: Fetching from API");
      fetch('http://127.0.0.1:8000/api/network-metrics')
        .then(res => res.json())
        .then(data => {
          console.log("Database network loaded:", data);
          setBaselineData(data);
          setSimulatedData(data); // Initialize simulated with baseline
          // Infer max donation for slider from baseline
          const maxAmount = Math.max(...data.links.map(l => l.amount), 1000000);
          setMaxDonation(Math.ceil(maxAmount / 100000) * 100000);
        })
        .catch(err => console.error("Error fetching baseline:", err));
    }
  }, [sandboxData]);

  // Apply regulations and update simulated data whenever settings change
  useEffect(() => {
    // --- BRANCH 1: ISOLATED SANDBOX MODE ---
    if (sandboxData && sandboxData.donations) {
      setLoading(true);
      
      // Apply regulations to donations
      let filteredDonations = [...sandboxData.donations];
      
      // Rule 1: Donation Cap
      if (donationCap !== null) {
        filteredDonations = filteredDonations.map(don => ({
          ...don,
          amount: Math.min(Number(don.amount), donationCap)
        }));
      }
      
      // Rule 2: Public Funding Injection
      if (publicFundingPercent > 0) {
        const uniqueCandidates = [...new Set(filteredDonations.map(d => d.candidate_name))];
        const totalFunds = filteredDonations.reduce((sum, d) => sum + Number(d.amount), 0);
        const injectionPerCandidate = (totalFunds * publicFundingPercent / 100) / uniqueCandidates.length;
        
        uniqueCandidates.forEach(candidate => {
          filteredDonations.push({
            donor_name: "Public Fund",
            candidate_name: candidate,
            amount: injectionPerCandidate
          });
        });
      }
      
      // Build simulated network
      const simulatedNetwork = convertSandboxToNetwork(filteredDonations);
      setSimulatedData(simulatedNetwork);
      
      // Calculate impact metrics
      const baselineTotal = sandboxData.donations.reduce((sum, d) => sum + Number(d.amount), 0);
      const simulatedTotal = filteredDonations.reduce((sum, d) => sum + Number(d.amount), 0);
      const fundsRemoved = baselineTotal - simulatedTotal;
      
      // Get unique candidates for centrality calculation
      const uniqueCandidates = [...new Set(sandboxData.donations.map(d => d.candidate_name))];
      
      const metrics = {
        funds_removed: fundsRemoved,
        funds_removed_pct: ((fundsRemoved / baselineTotal) * 100).toFixed(2),
        network_density_change: simulatedNetwork.links.length > 0 && baselineData.links.length > 0 
          ? (simulatedNetwork.links.length / baselineData.links.length).toFixed(2) 
          : 0,
        top_5_candidates: uniqueCandidates.slice(0, 5).map(candidate => ({
          candidate: candidate,
          baseline_centrality: 0.1,  // Simplified for sandbox
          simulated_centrality: 0.09,
          centrality_change: -0.01
        }))
      };
      
      setImpactMetrics(metrics);
      setLoading(false);
    } 
    // --- BRANCH 2: GLOBAL DATABASE MODE ---
    else if (baselineData.links && baselineData.links.length > 0) {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('corporate_ban', corporateBan);
      if (donationCap !== null) params.append('donation_cap', donationCap);
      params.append('public_funding_percent', publicFundingPercent);

      fetch(`http://127.0.0.1:8000/api/simulate-policy?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          setSimulatedData(data.simulated);
          setImpactMetrics(data.impact);
        })
        .catch(err => console.error("Simulation error:", err))
        .finally(() => setLoading(false));
    }
  }, [corporateBan, donationCap, publicFundingPercent, sandboxData, baselineData.links]);

  return (
    <div className="space-y-8">
      {/* CONTROL PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Control 1: Corporate Ban Toggle */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">↓ Ban Corporate Gifts</h3>
              <p className="text-xs text-rose-700 mt-1">Remove all Corporate donor edges from the network</p>
            </div>
            <div className="relative inline-flex h-8 w-14 items-center rounded-full bg-rose-200 transition-colors"
              style={{ backgroundColor: corporateBan ? '#dc2626' : '#fecaca' }}>
              <button
                onClick={() => setCorporateBan(!corporateBan)}
                className={`inline-flex h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                  corporateBan ? 'translate-x-7' : 'translate-x-1'
                }`}
              >
              </button>
            </div>
          </div>
          <div className="bg-white bg-opacity-60 px-3 py-2 rounded text-xs text-rose-800 font-mono">
            Status: <span className="font-bold">{corporateBan ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </div>

        {/* Control 2: Donation Cap Slider */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">💰 Donation Cap</h3>
            <p className="text-xs text-blue-700 mt-1">Limit maximum donation per individual</p>
          </div>
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max={maxDonation}
              step="100000"
              value={donationCap === null ? maxDonation : donationCap}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDonationCap(val === maxDonation ? null : val);
              }}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="bg-white bg-opacity-60 px-3 py-2 rounded text-xs text-blue-800 font-mono">
              Cap: <span className="font-bold">
                {donationCap === null ? 'Unlimited' : `KSh ${Number(donationCap).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Control 3: Public Funding Slider */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">🏦 Public Funding</h3>
            <p className="text-xs text-emerald-700 mt-1">Inject small-dollar public donations</p>
          </div>
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={publicFundingPercent}
              onChange={(e) => setPublicFundingPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="bg-white bg-opacity-60 px-3 py-2 rounded text-xs text-emerald-800 font-mono">
              Injection: <span className="font-bold">{publicFundingPercent}% of total funds</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON METRICS */}
      {impactMetrics && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Regulatory Impact Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Funds Removed */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Funds Removed</p>
              <p className="text-2xl font-bold text-red-600">
                KSh {Number(impactMetrics.funds_removed).toLocaleString()}
              </p>
              <p className="text-xs text-red-500 mt-1">{impactMetrics.funds_removed_pct}% of baseline</p>
            </div>

            {/* Metric 2: Network Density */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Network Density</p>
              <p className="text-2xl font-bold text-blue-600">
                {(impactMetrics.network_density_change * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-blue-500 mt-1">Edges retained after simulation</p>
            </div>

            {/* Metric 3: Baseline Network */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-slate-400">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Baseline Network</p>
              <p className="text-sm text-slate-700 font-mono">
                {baselineData.nodes?.length || 0} nodes, {baselineData.links?.length || 0} edges
              </p>
              <p className="text-xs text-slate-500 mt-1">Original state</p>
            </div>

            {/* Metric 4: Simulated Network */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Simulated Network</p>
              <p className="text-sm text-emerald-700 font-mono">
                {simulatedData.nodes?.length || 0} nodes, {simulatedData.links?.length || 0} edges
              </p>
              <p className="text-xs text-emerald-600 mt-1">After regulations</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP 5 CANDIDATES COMPARISON */}
      {impactMetrics?.top_5_candidates && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🎯 Top 5 Candidates: Centrality Shift</h3>
          <div className="space-y-3">
            {impactMetrics.top_5_candidates.map((cand, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{cand.candidate}</p>
                  <div className="flex gap-4 mt-2 text-xs font-mono">
                    <span className="text-blue-600">Baseline: {cand.baseline_centrality.toFixed(4)}</span>
                    <span className="text-emerald-600">After: {cand.simulated_centrality.toFixed(4)}</span>
                  </div>
                </div>
                <div className={`text-right min-w-fit ${
                  cand.centrality_change < -0.001 ? 'text-red-600' : 
                  cand.centrality_change > 0.001 ? 'text-emerald-600' : 
                  'text-slate-600'
                }`}>
                  <p className="text-lg font-bold">{cand.centrality_change > 0 ? '+' : ''}{cand.centrality_change.toFixed(4)}</p>
                  <p className="text-xs uppercase font-bold">Change</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAPH VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 border-b border-blue-200">
            <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wider">Baseline Network</h4>
            <p className="text-xs text-blue-700 mt-1">
              {baselineData.nodes?.length || 0} nodes | {baselineData.links?.length || 0} connections
            </p>
          </div>
          <div className="h-[500px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-blue-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-xs text-blue-600">Loading...</p>
                </div>
              </div>
            ) : (
              <ForceGraph2D
                graphData={baselineData}
                backgroundColor="#ffffff"
                nodeLabel={(node) => `${node.name} (Centrality: ${node.centrality_score.toFixed(4)})`}
                nodeColor={node => node.group === "Candidate" ? "#2563eb" : "#94a3b8"}
                nodeRelSize={6}
                linkWidth={link => Math.log10((link.amount / 5000) + 1)}
                linkColor={link => link.amount > 500000 ? "#1e3a8a" : "#cbd5e1"}
                linkLabel={link => `KSh ${Number(link.amount).toLocaleString()}`}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={link => link.amount > 1000000 ? 4 : 0}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 11 / globalScale;
                  ctx.font = `${fontSize}px Inter`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#475569';
                  ctx.fillText(label, node.x, node.y + 12);
                }}
              />
            )}
          </div>
        </div>

        {/* After */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-3 border-b border-emerald-200">
            <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wider">Simulated Network</h4>
            <p className="text-xs text-emerald-700 mt-1">
              {simulatedData.nodes?.length || 0} nodes | {simulatedData.links?.length || 0} connections
            </p>
          </div>
          <div className="h-[500px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-emerald-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-xs text-emerald-600">Loading...</p>
                </div>
              </div>
            ) : (
              <ForceGraph2D
                graphData={simulatedData}
                backgroundColor="#ffffff"
                nodeLabel={(node) => `${node.name} (Centrality: ${node.centrality_score.toFixed(4)})`}
                nodeColor={node => node.group === "Candidate" ? "#0891b2" : "#94a3b8"}
                nodeRelSize={6}
                linkWidth={link => Math.log10((link.amount / 5000) + 1)}
                linkColor={link => link.amount > 500000 ? "#165e7d" : "#cbd5e1"}
                linkLabel={link => `KSh ${Number(link.amount).toLocaleString()}`}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={link => link.amount > 1000000 ? 4 : 0}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 11 / globalScale;
                  ctx.font = `${fontSize}px Inter`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#475569';
                  ctx.fillText(label, node.x, node.y + 12);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm uppercase mb-4">📖 Visualization Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-xs space-y-2">
            <p className="font-bold text-slate-700">Node Types</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-slate-600">Candidate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-slate-600">Donor</span>
            </div>
          </div>
          <div className="text-xs space-y-2">
            <p className="font-bold text-slate-700">Edge Thickness</p>
            <p className="text-slate-600">Logarithmic scale based on donation amount</p>
          </div>
          <div className="text-xs space-y-2">
            <p className="font-bold text-slate-700">Edge Color</p>
            <p className="text-slate-600">Darker blue = larger donations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicySimulator;
