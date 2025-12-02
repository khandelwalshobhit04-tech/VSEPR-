
import React, { useState, useEffect, useCallback } from 'react';
import { MOLECULES, GEOMETRY_SLOTS, GEOMETRY_NAMES } from './constants';
import { HybridizationType, SlotType, OrbitalSlot, OrbitalPositionType } from './types';
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
  Microscope,
  Volume2,
  VolumeX,
  Home
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

  const molecule = MOLECULES[currentIndex];

  // --- Initialization per molecule ---
  useEffect(() => {
    // Reset state when molecule changes
    setSelectedHybridization(null);
    setCurrentSlots([]);
    setFeedback(null);
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
    audioService.playSelect();
    setSelectedHybridization(hyb);
    // Initialize slots based on selection
    const slotConfig = GEOMETRY_SLOTS[hyb];
    // For sp3d geometry correction in array mapping
    let specificSlots = slotConfig;
    if (hyb === HybridizationType.SP3D) {
        // Ensure we map the visual positions correctly (Axial vs Equatorial)
        // The constant already has this type data.
    }

    const newSlots = specificSlots.map((s, i) => ({
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
    if (!selectedHybridization) return;
    
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
    if (!selectedHybridization) {
      setFeedback({ type: 'error', message: "Select a geometry shape first." });
      audioService.playError();
      return;
    }

    // 1. Check Hybridization
    if (selectedHybridization !== molecule.hybridization) {
      setFeedback({ type: 'error', message: `Incorrect Geometry. Count the steric number (Bonding + Lone Pairs).` });
      audioService.playError();
      return;
    }

    // 2. Check Counts
    const bonds = currentSlots.filter(s => s.type === SlotType.BOND).length;
    const lonePairs = currentSlots.filter(s => s.type === SlotType.LONE_PAIR).length;

    if (bonds !== molecule.bondingPairs) {
      setFeedback({ type: 'error', message: `Incorrect number of bonds. Expected ${molecule.bondingPairs}.` });
      audioService.playError();
      return;
    }
    if (lonePairs !== molecule.lonePairs) {
      setFeedback({ type: 'error', message: `Incorrect number of lone pairs. Expected ${molecule.lonePairs}.` });
      audioService.playError();
      return;
    }

    // 3. Check Geometry Rules (Specific Mechanics)
    if (molecule.geometryRules?.lonePairsMustBe) {
      const incorrectlyPlacedLP = currentSlots.some(
        s => s.type === SlotType.LONE_PAIR && s.positionType !== molecule.geometryRules?.lonePairsMustBe
      );
      
      if (incorrectlyPlacedLP) {
        setFeedback({ 
          type: 'error', 
          message: "Destabilized! Lone pairs repel strongly. In Trigonal Bipyramidal geometry, where is there more space?" 
        });
        audioService.playError();
        // Trigger AI hint for deep explanation
        setIsLoadingAI(true);
        const hint = await getHint(molecule, "Placed lone pair in axial position instead of equatorial.");
        setFeedback({ type: 'error', message: hint });
        setIsLoadingAI(false);
        return;
      }
    }

    // 4. Success
    audioService.playSuccess();
    setScore(prev => prev + 100);
    
    setIsLoadingAI(true);
    const successMsg = await getSuccessMessage(molecule);
    setIsLoadingAI(false);
    
    setFeedback({ type: 'success', message: successMsg });
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
    }
  };

  const handleReset = () => {
      audioService.playClick();
      setSelectedHybridization(null);
      setCurrentSlots([]);
      setFeedback(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 overflow-x-hidden">
      
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
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">VSEPR <span className="text-indigo-400 text-sm font-mono">LEVEL 3</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-sm">
            <a 
              href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
              title="Back to Home Screen"
            >
              <Home className="w-5 h-5" />
            </a>
            <button 
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
               <Microscope className="w-4 h-4 text-slate-400" />
               <span>Sample: {currentIndex + 1}/{MOLECULES.length}</span>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-indigo-400 font-bold">
              SCORE: {score}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* Left Panel: Task & Info */}
        <div className="w-full md:w-1/4 space-y-6">
          
          {/* Molecule Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
            <h2 className="text-4xl font-bold text-white mb-1 font-mono">{molecule.formula}</h2>
            <p className="text-slate-400 text-sm mb-4">{molecule.name}</p>
            
            <div className="space-y-2 text-sm border-t border-slate-800 pt-4">
               <div className="flex justify-between">
                 <span className="text-slate-500">Central Atom</span>
                 <span className="font-mono text-indigo-300">{molecule.centralAtom}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Ligand</span>
                 <span className="font-mono text-emerald-300">{molecule.ligandAtom}</span>
               </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Analysis Protocol</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
              <li>Determine Steric Number (Bond + Lone Pair).</li>
              <li>Select Geometry Shape.</li>
              <li>Configure Orbitals by clicking lobes.</li>
              <li><span className="text-amber-400">Warning:</span> Place lone pairs to minimize repulsion (especially in Trigonal Bipyramidal).</li>
            </ol>
          </div>

          {/* AI Hint Button */}
          <button 
            onClick={handleAIHint}
            disabled={isLoadingAI || feedback?.type === 'success'}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {isLoadingAI ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                AI Tutor Hint
              </>
            )}
          </button>

        </div>

        {/* Center Panel: Visualization */}
        <div className="w-full md:w-2/4 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          <div className="flex-grow relative z-10">
            {selectedHybridization ? (
              <OrbitalVisualizer 
                centralAtom={molecule.centralAtom}
                slots={currentSlots}
                onSlotClick={handleSlotClick}
                ligandAtom={molecule.ligandAtom}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
                <Beaker className="w-16 h-16 opacity-20" />
                <p>Select a geometry shape to begin synthesis.</p>
              </div>
            )}
          </div>

          {/* Feedback Overlay */}
          {feedback && (
            <div className={`absolute bottom-4 left-4 right-4 p-4 rounded-lg backdrop-blur-xl border shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 ${
              feedback.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 
              feedback.type === 'error' ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' :
              'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />}
              {feedback.type === 'error' && <AlertCircle className="w-6 h-6 shrink-0 text-rose-400" />}
              {feedback.type === 'info' && <Info className="w-6 h-6 shrink-0 text-indigo-400" />}
              <div className="text-sm leading-relaxed">
                {feedback.message}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Controls */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          
          {/* Geometry Selector */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Geometry Shape</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(HybridizationType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleHybridizationSelect(type)}
                  disabled={feedback?.type === 'success'}
                  className={`px-3 py-3 rounded-lg border text-sm font-bold transition-all text-left flex justify-between items-center ${
                    selectedHybridization === type
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'
                  }`}
                >
                  <span>{GEOMETRY_NAMES[type]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-3 sticky bottom-4">
             {feedback?.type === 'success' ? (
               <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
               >
                 Next Sample <ChevronRight className="w-6 h-6" />
               </button>
             ) : (
                <div className="grid grid-cols-3 gap-2">
                   <button 
                    onClick={handleReset}
                    className="col-span-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex justify-center items-center"
                    title="Reset"
                   >
                     <RotateCcw className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={handleCheck}
                    className="col-span-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all"
                   >
                     Verify Structure
                   </button>
                </div>
             )}
          </div>

          {/* Stats/Legend */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 text-xs text-slate-400 space-y-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Bond Pair
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div> Lone Pair
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-dashed border-slate-500"></div> Empty Orbital
             </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default App;
