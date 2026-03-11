import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Scale, Users, Info, ArrowRight, ShieldAlert, X, EyeOff, Map, ArrowLeft, ZoomOut, Home, Clock, ChevronDown } from 'lucide-react';

// --- Data Structure: Nodes & Coordinates ---
const STORY_NODES = {
  start: {
    id: 'start', x: 200, y: 600, category: 'hotline',
    title: 'Call to SCR Hotline',
    description: 'Someone called the State Central Register (SCR) hotline, alleging "neglect" against your family. This could be a neighbor, teacher, or hospital staff. The Administration for Children\'s Services (ACS) must decide whether to screen it in.',
    icon: <ShieldAlert className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />,
    fact: {
      title: 'Targeted Surveillance',
      content: 'Black people make up 23% of the NYC population, yet they represent 38% of reports. Disabled parents are also disproportionately targeted and monitored due to bias rather than actual parenting risk.'
    },
    choices: [{ text: 'Case is Screened In', nextNodeId: 'fork' }]
  },
  fork: {
    id: 'fork', x: 600, y: 600, category: 'neutral',
    title: 'Report to ACS',
    description: 'The case has been screened in. Based on an initial assessment, the system will assign your case to one of two paths: one labeled as "Family Assessment Response (CARES)" and the other as "Traditional Investigation."',
    icon: <Map className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />,
    choices: [
      { text: 'Assigned to CARES (FAR)', nextNodeId: 'cares_entry' },
      { text: 'Assigned to Traditional Investigation', nextNodeId: 'traditional_investigation' }
    ]
  },
  cares_entry: {
    id: 'cares_entry', x: 1000, y: 300, category: 'cares',
    title: 'CARES (FAR) Assessment',
    description: 'You entered the CARES system. The caseworker calls this a "non-punitive" process. However, participation is "voluntary," and you must agree to let the caseworker into your home. Do you agree to cooperate?',
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-green-500" />,
    choices: [
      { text: 'Agree to cooperate', nextNodeId: 'cares_success' },
      { text: 'Refuse to cooperate (deny entry)', nextNodeId: 'traditional_investigation_loop' }
    ]
  },
  cares_success: {
    id: 'cares_success', x: 1400, y: 300, category: 'cares',
    title: 'Complete CARES Plan',
    description: 'You agreed to all demands. The system closed your case after 60 days. Although your family wasn\'t separated, you still endured weeks of privacy invasion and surveillance.',
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-green-600" />,
    choices: []
  },
  traditional_investigation_loop: {
    id: 'traditional_investigation_loop', x: 1200, y: 500, category: 'warning',
    title: 'The System\'s Trap',
    description: 'Because you exercised your right to deny a stranger entry into your home, the system deemed you "uncooperative". Your case is immediately switched back to a punitive Traditional Investigation!',
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />,
    fact: {
      title: 'False Choice (High Likelihood of Re-entry)',
      content: 'CARES is advertised as voluntary, but if parents refuse certain demands, there is a high likelihood the case will be routed back into investigation, revealing its coercive nature.'
    },
    choices: [{ text: 'Forced into Investigation', nextNodeId: 'traditional_investigation' }]
  },
  traditional_investigation: {
    id: 'traditional_investigation', x: 1000, y: 900, category: 'investigation',
    title: 'ACS Investigation',
    description: 'Child Protective Services (CPS) intervenes. They can visit your child\'s school without consent, inspect your refrigerator, and demand drug tests. If they find "immediate danger," it escalates.',
    icon: <EyeOff className="w-8 h-8 md:w-12 md:h-12 text-red-500" />,
    fact: {
      title: 'Confusing Poverty with Neglect',
      content: 'Less than 5% of family court cases involve actual "abuse." Over 95% are for "neglect"—which usually just means parents lack resources (food, housing). Yet, the system investigates rather than supports.'
    },
    choices: [
      { text: 'Investigation deemed "Unfounded"', nextNodeId: 'case_closed' },
      { text: 'ACS files a petition in Court', nextNodeId: 'fca_article_10' }
    ]
  },
  case_closed: {
    id: 'case_closed', x: 1400, y: 750, category: 'neutral',
    title: 'Case Closed',
    description: 'After 60 agonizing days, investigators found insufficient evidence. The case is marked "Unfounded" and closed. However, the investigation itself may have caused trauma.',
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />,
    choices: []
  },
  fca_article_10: {
    id: 'fca_article_10', x: 1400, y: 1050, category: 'court',
    title: 'FCA Article 10 (Family Court)',
    description: 'ACS takes you to Family Court. A judge will decide if your child can stay with you (under strict court supervision) or must be forcibly removed.',
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-red-600" />,
    fact: {
      title: 'The Process IS the Punishment',
      content: 'Based on fieldwork: Family Court hearings often last only 30 minutes, but due to inefficiencies, the entire case duration can drag on for years.'
    },
    choices: [
      { text: 'Court Ordered Supervision', nextNodeId: 'supervision' },
      { text: 'Child Removed from Home', nextNodeId: 'foster_care' }
    ]
  },
  supervision: {
    id: 'supervision', x: 1800, y: 900, category: 'court',
    title: 'Court Ordered Supervision',
    description: 'Your child narrowly remains in your care, but you must complete all court-mandated services (e.g., parenting classes, drug testing). If you fail, your child may still be removed.',
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />,
    choices: []
  },
  foster_care: {
    id: 'foster_care', x: 1800, y: 1200, category: 'court',
    title: 'Foster Care System',
    description: 'Your child is forcibly removed. The state will pay exorbitant fees to strangers to care for your child. We spend millions tearing families apart—what if we used that money for housing instead?',
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-red-800" />,
    fact: {
      title: 'The High Cost of Separation',
      content: '52% of children removed in NYC are Black. We pay massive amounts for foster care payments and legal costs—money that could have addressed the root causes of poverty.'
    },
    choices: []
  }
};

// --- Data Structure: Connective Edges ---
const EDGES = [
  { from: 'start', to: 'fork' },
  { from: 'fork', to: 'cares_entry' },
  { from: 'fork', to: 'traditional_investigation' },
  { from: 'cares_entry', to: 'cares_success' },
  { from: 'cares_entry', to: 'traditional_investigation_loop' },
  { from: 'traditional_investigation_loop', to: 'traditional_investigation' },
  { from: 'traditional_investigation', to: 'case_closed' },
  { from: 'traditional_investigation', to: 'fca_article_10' },
  { from: 'fca_article_10', to: 'supervision' },
  { from: 'fca_article_10', to: 'foster_care' }
];

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [activeNodeId, setActiveNodeId] = useState(null); 
  const [history, setHistory] = useState([]); // Array of previously visited node IDs (User Navigation)
  const [showFactModal, setShowFactModal] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Handle window resize for dynamic camera calculations
  useEffect(() => {
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute INCOMING nodes (Logical parents based on EDGES) for the Left Wing
  const incomingNodes = useMemo(() => {
    if (!activeNodeId) return [];
    return EDGES.filter(edge => edge.to === activeNodeId).map(edge => STORY_NODES[edge.from]);
  }, [activeNodeId]);

  const startExperience = () => {
    setCurrentView('map');
    setActiveNodeId(null); 
    setHistory([]);
  };

  const handleNodeSelect = (nodeId) => {
    if (activeNodeId) {
      setHistory(prev => [...prev, activeNodeId]);
    }
    setActiveNodeId(nodeId);
    setShowFactModal(false);
    setShowHistoryDropdown(false);
  };

  const jumpToHistory = (index) => {
    const targetNodeId = history[index];
    setHistory(prev => prev.slice(0, index)); // Rollback history
    setActiveNodeId(targetNodeId);
    setShowFactModal(false);
    setShowHistoryDropdown(false);
  };

  const closeToMap = () => {
    setActiveNodeId(null);
    setShowFactModal(false);
    setShowHistoryDropdown(false);
  };

  // --- Camera Calculation Engine ---
  const CANVAS_WIDTH = 2200;
  const CANVAS_HEIGHT = 1600;

  const cameraTransform = useMemo(() => {
    const isMobile = viewport.w < 768;
    
    if (!activeNodeId) {
      // OVERVIEW MAP (Zoomed out)
      const scale = Math.min(viewport.w / CANVAS_WIDTH, viewport.h / CANVAS_HEIGHT) * 0.9;
      const tx = (viewport.w - CANVAS_WIDTH * scale) / 2;
      const ty = (viewport.h - CANVAS_HEIGHT * scale) / 2;
      return { transform: `translate(${tx}px, ${ty}px) scale(${scale})` };
    } else {
      // ZOOMED IN (Centered Focus)
      const node = STORY_NODES[activeNodeId];
      const scale = isMobile ? 0.7 : 1; 
      const targetScreenX = viewport.w * 0.5;
      const targetScreenY = viewport.h * 0.5;
      
      const tx = targetScreenX - (node.x * scale);
      const ty = targetScreenY - (node.y * scale);
      return { transform: `translate(${tx}px, ${ty}px) scale(${scale})` };
    }
  }, [activeNodeId, viewport]);

  // --- 1. LANDING PAGE ---
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-red-500 selection:text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-12 z-10">
          <div className="space-y-4 text-center">
            <h2 className="text-red-500 font-bold tracking-widest uppercase text-sm md:text-base">The Bronx Defenders Project</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight leading-tight">
              From Child Welfare <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                To Family Policing
              </span>
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
              This is a system that surveils under the guise of protection. We spend millions investigating poverty—what if we spent that money fixing it?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
              <div className="text-5xl font-black text-white mb-2">23%</div>
              <p className="text-neutral-400 text-sm">Black people as a % of NYC population</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
              <div className="text-5xl font-black text-red-500 mb-2">41%</div>
              <p className="text-neutral-400 text-sm">Black parents in family court cases (White parents = 6%)</p>
            </div>
            <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-red-500 transition-colors">
              <div className="text-5xl font-black text-amber-500 mb-2">&gt;95%</div>
              <p className="text-neutral-400 text-sm">Cases stemming from resource-deprived "neglect", not abuse</p>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button 
              onClick={startExperience}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-red-600 rounded-full overflow-hidden transition-all hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50"
            >
              <span className="mr-2">Explore the System Map</span>
              <Map className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. INTERACTIVE MAP VIEW ---
  const activeNode = activeNodeId ? STORY_NODES[activeNodeId] : null;

  return (
    <div className="relative w-screen h-screen bg-neutral-100 overflow-hidden font-sans">
      
      {/* MAP CANVAS (Pans and Zooms in Background) */}
      <div 
        className="absolute top-0 left-0 origin-top-left transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT, 
          ...cameraTransform 
        }}
      >
        {/* SVG Edges Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {EDGES.map((edge, idx) => {
            const n1 = STORY_NODES[edge.from];
            const n2 = STORY_NODES[edge.to];
            const isActive = activeNodeId === edge.from || activeNodeId === edge.to;
            const path = `M ${n1.x} ${n1.y} C ${n1.x + 150} ${n1.y}, ${n2.x - 150} ${n2.y}, ${n2.x} ${n2.y}`;
            return (
              <path 
                key={idx} 
                d={path} 
                fill="none" 
                stroke={isActive ? "#ef4444" : "#cbd5e1"} 
                strokeWidth={isActive ? 6 : 4} 
                className="transition-colors duration-500"
              />
            );
          })}
        </svg>

        {/* Node Elements Layer */}
        {Object.values(STORY_NODES).map(node => {
          const isSelected = activeNodeId === node.id;
          const isDimmed = activeNodeId !== null && !isSelected;
          
          let borderColor = 'border-neutral-300';
          if (node.category === 'hotline') borderColor = 'border-yellow-400';
          if (node.category === 'cares') borderColor = 'border-green-400';
          if (node.category === 'warning') borderColor = 'border-amber-400';
          if (node.category === 'investigation') borderColor = 'border-red-400';
          if (node.category === 'court') borderColor = 'border-red-700';

          return (
            <div
              key={node.id}
              onClick={() => { if(!activeNodeId) handleNodeSelect(node.id) }} 
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-4 transition-all duration-500 shadow-lg 
                ${borderColor}
                ${!activeNodeId ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'pointer-events-none'}
                ${isSelected ? 'ring-8 ring-red-500/30 scale-110 z-10 shadow-red-500/20' : 'z-0'}
                ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
              `}
              style={{ left: node.x, top: node.y, width: '320px' }}
            >
              <div className="mb-4">{node.icon}</div>
              <h3 className="text-xl font-bold text-neutral-900 text-center">{node.title}</h3>
              {!activeNodeId && <p className="text-sm text-neutral-500 text-center mt-2 font-medium">Click to inspect</p>}
            </div>
          );
        })}
      </div>

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
        <h1 className="text-xl md:text-2xl font-black text-neutral-900 drop-shadow-md bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-auto">
          Family Policing Map
        </h1>
        
        <div className="flex flex-col items-end pointer-events-auto">
          <div className="flex space-x-3 mb-2">
            
            {/* User Navigation History Dropdown */}
            {activeNodeId && (
              <div className="relative">
                <button 
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className={`flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md transition-colors border ${showHistoryDropdown ? 'border-neutral-400 bg-neutral-100' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden md:inline">My History</span>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </button>

                {/* Dropdown Menu */}
                {showHistoryDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      Path Taken
                    </div>
                    {history.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-400 italic text-center">No history yet</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {history.map((nodeId, index) => (
                          <button
                            key={index}
                            onClick={() => jumpToHistory(index)}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 border-l-2 border-transparent hover:border-red-500 transition-colors flex items-center group"
                          >
                            <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-xs flex items-center justify-center mr-3 group-hover:bg-red-100 group-hover:text-red-600 font-bold">{index + 1}</span>
                            <span className="text-sm font-semibold text-neutral-700 truncate">{STORY_NODES[nodeId].title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeNodeId && (
              <button 
                onClick={closeToMap}
                className="flex items-center space-x-2 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="hidden md:inline">Full Map</span>
              </button>
            )}
            
            <button 
              onClick={() => { setCurrentView('landing'); setActiveNodeId(null); setShowHistoryDropdown(false); }}
              className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-neutral-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- UI OVERLAY LAYER (Center Card & Wings) --- */}
      <div 
        className={`fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] 
          ${activeNodeId ? 'opacity-100 visible bg-black/40 backdrop-blur-sm pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}
        `}
        onClick={closeToMap} 
      >
        {activeNode && (
          <div 
            className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-[1400px] h-full md:h-auto overflow-y-auto md:overflow-visible py-20 md:py-0 scrollbar-hide"
            onClick={e => { e.stopPropagation(); setShowHistoryDropdown(false); }} // Close dropdown when clicking cards
          >
            
            {/* LEFT WING: Logical Incoming Nodes (Where could we have come from?) */}
            <div className="flex flex-col justify-center gap-3 w-full md:w-80 shrink-0 order-3 md:order-1">
              {incomingNodes.length > 0 ? (
                <>
                  <div className="text-white/80 text-xs font-black tracking-widest uppercase mb-1 text-center md:text-right px-2">
                    Possible Previous Steps
                  </div>
                  {incomingNodes.map((node, index) => (
                    <button
                      key={index}
                      onClick={() => handleNodeSelect(node.id)}
                      className="flex items-center text-left bg-white/95 backdrop-blur-md border-2 border-transparent hover:border-neutral-400 p-4 rounded-2xl shadow-xl transition-all hover:-translate-x-1 md:hover:-translate-x-2 group"
                    >
                      <ArrowLeft className="w-5 h-5 text-neutral-400 mr-3 shrink-0 group-hover:text-neutral-700" />
                      <span className="font-bold text-neutral-700 text-sm flex-1">{node.title}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="hidden md:block text-white/50 text-sm font-bold italic text-right px-4">
                  Starting Point
                </div>
              )}
            </div>

            {/* CENTER: Main Info Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 w-full max-w-2xl shrink-0 flex flex-col relative order-1 md:order-2 border border-neutral-100">
              
              <button 
                onClick={closeToMap}
                className="absolute top-6 right-6 text-neutral-400 hover:text-red-500 bg-neutral-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-between items-start mb-6">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  {activeNode.icon}
                </div>
                {activeNode.fact && (
                  <button 
                    onClick={() => setShowFactModal(true)}
                    className="flex items-center space-x-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-neutral-800 transition-colors animate-pulse shadow-md mt-2 mr-10"
                  >
                    <Info className="w-4 h-4" />
                    <span>System Reality</span>
                  </button>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4">{activeNode.title}</h2>
              <div className="w-12 h-1 bg-red-500 mb-6 rounded-full"></div>
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-medium">
                {activeNode.description}
              </p>
            </div>

            {/* RIGHT WING: Logical Next Steps / Choices */}
            <div className="flex flex-col justify-center gap-3 w-full md:w-80 shrink-0 order-2 md:order-3">
              {activeNode.choices.length > 0 ? (
                <>
                  <div className="text-white/80 text-xs font-black tracking-widest uppercase mb-1 text-center md:text-left px-2">
                    Next Choices
                  </div>
                  {activeNode.choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleNodeSelect(choice.nextNodeId)}
                      className="flex items-center text-left bg-white/95 backdrop-blur-md border-2 border-transparent hover:border-red-500 p-4 rounded-2xl shadow-xl transition-all hover:translate-x-1 md:hover:translate-x-2 group"
                    >
                      <span className="font-bold text-neutral-800 text-sm flex-1">{choice.text}</span>
                      <ArrowRight className="w-5 h-5 text-neutral-400 ml-3 shrink-0 group-hover:text-red-500" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border border-neutral-200">
                  <p className="text-neutral-500 font-bold mb-4 uppercase tracking-widest text-xs">End of Path</p>
                  <button 
                    onClick={closeToMap} 
                    className="flex items-center justify-center w-full px-4 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors font-bold shadow-md"
                  >
                    <ZoomOut className="w-4 h-4 mr-2" /> 
                    Return to Map
                  </button>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>

      {/* --- FACT MODAL (Model B Reality Pop-up) --- */}
      {showFactModal && activeNode?.fact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFactModal(false)}>
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10 relative transform scale-100 animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()} 
          >
            <button 
              onClick={() => setShowFactModal(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-800 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 shadow-inner">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-neutral-900 mb-4 leading-tight">{activeNode.fact.title}</h3>
            <div className="w-12 h-1 bg-amber-400 mb-6 rounded-full"></div>
            <p className="text-lg text-neutral-600 leading-relaxed mb-8 font-medium">
              {activeNode.fact.content}
            </p>
            <button 
              onClick={() => setShowFactModal(false)}
              className="w-full py-4 bg-neutral-900 text-white font-bold text-lg rounded-xl hover:bg-neutral-800 transition-transform active:scale-95 shadow-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
