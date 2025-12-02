
import React, { useState, useEffect } from 'react';
import { MOLECULES, GEOMETRY_SLOTS, GEOMETRY_NAMES } from './constants';
import { HybridizationType, SlotType, OrbitalSlot } from './types';
import OrbitalVisualizer from './components/OrbitalVisualizer';
import { getHint, getSuccessMessage } from './services/geminiService';
import { audioService } from './services/audioService';
import { 
  Atom, 
  Beaker, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ChevronRight,
  BrainCircuit,
  Volume2,
  VolumeX,
  Home,
  XCircle,
  ArrowRight,
  Microscope
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedHybridization, setSelectedHybridization] = useState<HybridizationType | null>(null);
  const [currentSlots, setCurrentSlots] = useState<OrbitalSlot[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const molecule = MOLECULES[currentIndex];
  const isLastMolecule = currentIndex === MOLECULES.length - 1;

  // --- Initialization per molecule ---
  useEffect(() => {
    // Reset state when molecule changes
    setSelectedHybridization(null);
    setCurrentSlots([]);
    setFeedback(null);
    setHasSubmitted(false);
  }, [currentIndex]);

  // --- Handlers ---

  const handleStartGame = () => {
    setShowIntro(false);
    audioService.init();
    audioService.startAmbientDrone();
    audioService.playSelect();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioService.setMute(newMuted);
  };

  const handleHybridizationSelect = (hyb: HybridizationType) => {
    if (hasSubmitted) return; // Lock after submission

    audioService.playSelect();
    setSelectedHybridization(hyb);
    // Initialize slots based on selection
    const slotConfig = GEOMETRY_SLOTS[hyb];
    
    const newSlots = slotConfig.map((s, i) => ({
      id: i,
      angle: s.angle,
      tilt: s.tilt,
      type: SlotType.EMPTY,
      positionType: s.type
    }));
    setCurrentSlots(newSlots);
    setFeedback(null);
  };

  const handleSlotClick = (id: number) => {
    if (!selectedHybridization || hasSubmitted) return; // Lock after submission
    
    audioService.playClick();

    setCurrentSlots(prev => prev.map(slot => {
      if (slot.id !== id) return slot;
      
      // Cycle: EMPTY -> BOND -> LONE_PAIR -> EMPTY
      let nextType = SlotType.EMPTY;
      if (slot.type === SlotType.EMPTY) nextType = SlotType.BOND;
      else if (slot.type === SlotType.BOND) nextType = SlotType.LONE_PAIR;
      else nextType = SlotType.EMPTY;

      return { ...slot, type: nextType };
    }));
    setFeedback(null);
  };

  const handleCheck = async () => {
    audioService.playSelect();
    
    // Pre-check: Must select a geometry to verify
    if (!selectedHybridization) {
      setFeedback({ type: 'error', message: "Select a geometry shape first." });
      audioService.playError();
      return;
    }

    // LOCK THE ATTEMPT - One Chance Mechanic
    setHasSubmitted(true);

    // Validation Logic
    let isCorrect = true;
    let failReason = "";

    // 1. Check Hybridization (Geometry)
    if (selectedHybridization !== molecule.hybridization) {
      isCorrect = false;
      failReason = `Incorrect Geometry. The stable shape is ${GEOMETRY_NAMES[molecule.hybridization]}.`;
    } else {
      // 2. Check Counts
      const bonds = currentSlots.filter(s => s.type === SlotType.BOND).length;
      const lonePairs = currentSlots.filter(s => s.type === SlotType.LONE_PAIR).length;

      if (bonds !== molecule.bondingPairs || lonePairs !== molecule.lonePairs) {
        isCorrect = false;
        failReason = `Incorrect orbital contents. Expected ${molecule.bondingPairs} Bonds and ${molecule.lonePairs} Lone Pairs.`;
      } 
      // 3. Check Geometry Rules (Specific Mechanics)
      else if (molecule.geometryRules?.lonePairsMustBe) {
        const incorrectlyPlacedLP = currentSlots.some(
          s => s.type === SlotType.LONE_PAIR && s.positionType !== molecule.geometryRules?.lonePairsMustBe
        );
        
        if (incorrectlyPlacedLP) {
          isCorrect = false;
          failReason = "Unstable arrangement! Lone pairs must be in equatorial positions to minimize repulsion.";
        }
      }
    }

    if (isCorrect) {
        audioService.playSuccess();
        setScore(prev => prev + 100);
        
        setIsLoadingAI(true);
        const successMsg = await getSuccessMessage(molecule);
        setIsLoadingAI(false);
        
        setFeedback({ type: 'success', message: successMsg });
    } else {
        audioService.playError();
        // Zero marks for incorrect answer, forcing next.
        setFeedback({ type: 'error', message: `Analysis Failed. ${failReason} Proceed to next sample.` });
    }
  };

  const handleAIHint = async () => {
    audioService.playSelect();
    setIsLoadingAI(true);
    const msg = await getHint(molecule);
    setFeedback({ type: 'info', message: msg });
    setIsLoadingAI(false);
  };

  const handleNext = () => {
    audioService.playSelect();
    if (currentIndex < MOLECULES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFeedback({ type: 'info', message: "All samples analyzed. Refresh to restart protocol." });
    }
  };

  const handleReset = () => {
      if (hasSubmitted) return;
      audioService.playClick();
      setSelectedHybridization(null);
      setCurrentSlots([]);
      setFeedback(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 overflow-x-hidden font-sans">
      
      {/* Intro Modal Overlay */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/10">
            {/* Background Decoration */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[60px]"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[60px]"></div>

            <div className="relative z-10 flex flex-col items-start">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                  <Atom className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">VSEPR <span className="text-indigo-400 font-mono">LEVEL 3</span></h1>
                  <p className="text-slate-400 text-sm font-medium">Advanced Molecular Geometry Simulation</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-slate-300 text-lg leading-relaxed">
                  Valence Shell Electron Pair Repulsion (VSEPR) theory is the foundational model for predicting molecular geometry. It posits that electron pairs surrounding a central atom—whether participating in chemical bonds or existing as lone pairs—exert repulsive forces on one another. To minimize this repulsion and achieve stability, these electron domains arrange themselves as far apart as possible in three-dimensional space. This spatial optimization dictates the molecule's final shape, influencing critical properties like polarity, phase, and reactivity. In this lab, you will apply these principles to analyze steric numbers and construct precise molecular structures.
                </p>
              </div>

              <button 
                onClick={handleStartGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 group"
              >
                Enter Laboratory 
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Atom className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight">VSEPR <span className="text-indigo-500">LEVEL 3</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Score</span>
               <span className="font-mono text-xl text-emerald-400 font-bold">{score}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-800 mx-2"></div>

            <button onClick={toggleMute} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <a 
              href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true"
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Return to Home Screen"
            >
              <Home className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Molecule Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Sample {currentIndex + 1} of {MOLECULES.length}</span>
              <Beaker className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">{molecule.formula}</h2>
            <h3 className="text-lg text-slate-400 font-medium mb-6">{molecule.name}</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Central Atom</span>
                  <span className="font-mono font-bold text-indigo-300">{molecule.centralAtom}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Ligand</span>
                  <span className="font-mono font-bold text-emerald-300">{molecule.ligandAtom}</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                 <p className="text-sm text-slate-300 italic leading-relaxed">
                   {molecule.description}
                 </p>
              </div>

              {/* Protocol Warning */}
              <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg flex gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                 <p className="text-xs text-amber-200/80 leading-snug">
                   Analysis Protocol: You have one attempt per sample. Incorrect structure validation will result in data loss (0 marks).
                 </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAIHint}
            disabled={isLoadingAI || hasSubmitted}
            className="w-full py-3 px-4 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-800/50 rounded-xl text-indigo-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {isLoadingAI ? "Analyzing..." : "Request AI Assistance"}
          </button>
        </div>

        {/* Center Panel: Visualization */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[500px]">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {selectedHybridization ? (
              <OrbitalVisualizer 
                centralAtom={molecule.centralAtom}
                slots={currentSlots}
                onSlotClick={handleSlotClick}
                ligandAtom={molecule.ligandAtom}
              />
            ) : (
              <div className="text-center space-y-4 z-10 opacity-60">
                <Microscope className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg">Select a Geometry Shape to Initialize Simulation</p>
              </div>
            )}
            
            {/* Feedback Toast */}
            {feedback && (
              <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-max max-w-[90%] px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-5 fade-in duration-300 z-20 flex items-center gap-3
                ${feedback.type === 'success' ? 'bg-emerald-900/80 border-emerald-700/50 text-emerald-100' : 
                  feedback.type === 'error' ? 'bg-rose-900/80 border-rose-700/50 text-rose-100' : 
                  'bg-slate-800/90 border-slate-600/50 text-slate-200'}`}
              >
                {feedback.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                {feedback.type === 'error' && <XCircle className="w-6 h-6 text-rose-400" />}
                {feedback.type === 'info' && <Info className="w-6 h-6 text-indigo-400" />}
                <p className="font-medium">{feedback.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Geometry Shape</h3>
            
            <div className="space-y-2.5">
              {Object.values(HybridizationType).map((hyb) => (
                <button
                  key={hyb}
                  onClick={() => handleHybridizationSelect(hyb)}
                  disabled={hasSubmitted}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between group
                    ${selectedHybridization === hyb 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}
                    ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="font-medium">{GEOMETRY_NAMES[hyb]}</span>
                  {selectedHybridization === hyb && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
              {!hasSubmitted ? (
                <>
                  <button 
                    onClick={handleCheck}
                    disabled={!selectedHybridization}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Verify Structure
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={handleReset}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Reset Canvas
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleNext}
                  className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                    ${currentIndex < MOLECULES.length - 1 ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20' : 'bg-slate-700'}
                  `}
                >
                  {isLastMolecule ? "Finish Protocol" : "Next Sample"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
             <div className="flex items-start gap-3">
               <Info className="w-5 h-5 text-indigo-400 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-sm font-medium text-slate-300">Quick Guide</p>
                 <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                   <li>Select a Geometry Shape from the list.</li>
                   <li>Click orbital lobes to cycle: Bond → Lone Pair → Empty.</li>
                   <li>Verify your structure when ready.</li>
                   <li><strong>Warning:</strong> You only get one chance!</li>
                 </ul>
               </div>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
