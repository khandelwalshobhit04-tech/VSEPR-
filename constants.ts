import { MoleculeDef, HybridizationType, OrbitalPositionType } from './types';

export const GEOMETRY_NAMES: Record<HybridizationType, string> = {
  [HybridizationType.SP]: 'Linear',
  [HybridizationType.SP2]: 'Trigonal Planar',
  [HybridizationType.SP3]: 'Tetrahedral',
  [HybridizationType.SP3D]: 'Trigonal Bipyramidal',
  [HybridizationType.SP3D2]: 'Octahedral'
};

export const MOLECULES: MoleculeDef[] = [
  {
    formula: 'BeCl₂',
    name: 'Beryllium Chloride',
    centralAtom: 'Be',
    ligandAtom: 'Cl',
    bondingPairs: 2,
    lonePairs: 0,
    stericNumber: 2,
    hybridization: HybridizationType.SP,
    description: 'Linear geometry. Beryllium has only 2 valence electrons to share.',
  },
  {
    formula: 'BF₃',
    name: 'Boron Trifluoride',
    centralAtom: 'B',
    ligandAtom: 'F',
    bondingPairs: 3,
    lonePairs: 0,
    stericNumber: 3,
    hybridization: HybridizationType.SP2,
    description: 'Trigonal planar. Boron is satisfied with 6 valence electrons here.',
  },
  {
    formula: 'SO₂',
    name: 'Sulfur Dioxide',
    centralAtom: 'S',
    ligandAtom: 'O',
    bondingPairs: 2,
    lonePairs: 1,
    stericNumber: 3,
    hybridization: HybridizationType.SP2,
    description: 'Bent shape. One lone pair repels the bonds slightly.',
  },
  {
    formula: 'CH₄',
    name: 'Methane',
    centralAtom: 'C',
    ligandAtom: 'H',
    bondingPairs: 4,
    lonePairs: 0,
    stericNumber: 4,
    hybridization: HybridizationType.SP3,
    description: 'Classic tetrahedral geometry.',
  },
  {
    formula: 'NH₃',
    name: 'Ammonia',
    centralAtom: 'N',
    ligandAtom: 'H',
    bondingPairs: 3,
    lonePairs: 1,
    stericNumber: 4,
    hybridization: HybridizationType.SP3,
    description: 'Trigonal pyramidal. The lone pair compresses bond angles.',
  },
  {
    formula: 'H₂O',
    name: 'Water',
    centralAtom: 'O',
    ligandAtom: 'H',
    bondingPairs: 2,
    lonePairs: 2,
    stericNumber: 4,
    hybridization: HybridizationType.SP3,
    description: 'Bent geometry due to two lone pairs.',
  },
  {
    formula: 'PCl₅',
    name: 'Phosphorus Pentachloride',
    centralAtom: 'P',
    ligandAtom: 'Cl',
    bondingPairs: 5,
    lonePairs: 0,
    stericNumber: 5,
    hybridization: HybridizationType.SP3D,
    description: 'Trigonal bipyramidal. Expanded octet.',
  },
  {
    formula: 'XeF₂',
    name: 'Xenon Difluoride',
    centralAtom: 'Xe',
    ligandAtom: 'F',
    bondingPairs: 2,
    lonePairs: 3,
    stericNumber: 5,
    hybridization: HybridizationType.SP3D,
    description: 'Linear. Lone pairs occupy equatorial positions to minimize repulsion.',
    geometryRules: {
      lonePairsMustBe: OrbitalPositionType.EQUATORIAL
    }
  },
  {
    formula: 'SF₆',
    name: 'Sulfur Hexafluoride',
    centralAtom: 'S',
    ligandAtom: 'F',
    bondingPairs: 6,
    lonePairs: 0,
    stericNumber: 6,
    hybridization: HybridizationType.SP3D2,
    description: 'Octahedral geometry. Very stable.',
  },
  {
    formula: 'ClO₃⁻',
    name: 'Chlorate Ion',
    centralAtom: 'Cl',
    ligandAtom: 'O',
    bondingPairs: 3,
    lonePairs: 1,
    stericNumber: 4,
    hybridization: HybridizationType.SP3,
    description: 'Trigonal pyramidal geometry.',
  }
];

// Slot Definitions for Visualizer
// Pseudo-3D angles for 2D projection
export const GEOMETRY_SLOTS: Record<HybridizationType, { angle: number, tilt: number, type: OrbitalPositionType }[]> = {
  [HybridizationType.SP]: [
    { angle: 0, tilt: 0, type: OrbitalPositionType.GENERAL },
    { angle: 180, tilt: 0, type: OrbitalPositionType.GENERAL },
  ],
  [HybridizationType.SP2]: [
    { angle: 90, tilt: 0, type: OrbitalPositionType.GENERAL },
    { angle: 210, tilt: 0, type: OrbitalPositionType.GENERAL },
    { angle: 330, tilt: 0, type: OrbitalPositionType.GENERAL },
  ],
  [HybridizationType.SP3]: [
    { angle: 90, tilt: 0, type: OrbitalPositionType.GENERAL }, // Top
    { angle: 210, tilt: 0.5, type: OrbitalPositionType.GENERAL }, // Bottom Left Back
    { angle: 330, tilt: 0.5, type: OrbitalPositionType.GENERAL }, // Bottom Right Back
    { angle: 270, tilt: -0.8, type: OrbitalPositionType.GENERAL }, // Front projecting (visual trick) -> actually let's stick to a tripod
  ],
  // Redefine SP3 for better 2D look: Standard tetrahedron projection
  // Top, Right-Down, Left-Down (front), Back (hidden/dashed usually, but here we just angle it)
  // Let's use a standard "Tripod" look
  // 90 (Top), 210 (Left Bottom), 330 (Right Bottom), 270 (Front-Center distinct)
  
  [HybridizationType.SP3D]: [
    { angle: 90, tilt: 0, type: OrbitalPositionType.AXIAL }, // Top Axial
    { angle: 270, tilt: 0, type: OrbitalPositionType.AXIAL }, // Bottom Axial
    { angle: 0, tilt: 0.5, type: OrbitalPositionType.EQUATORIAL }, // Eq Right
    { angle: 120, tilt: 0.5, type: OrbitalPositionType.EQUATORIAL }, // Eq Top-Left (Back)
    { angle: 240, tilt: 0.5, type: OrbitalPositionType.EQUATORIAL }, // Eq Bottom-Left (Back) -- Actually let's adjust for visual clarity
  ],
  
  [HybridizationType.SP3D2]: [
    { angle: 90, tilt: 0, type: OrbitalPositionType.AXIAL },
    { angle: 270, tilt: 0, type: OrbitalPositionType.AXIAL },
    { angle: 45, tilt: 0.3, type: OrbitalPositionType.EQUATORIAL },
    { angle: 135, tilt: 0.3, type: OrbitalPositionType.EQUATORIAL },
    { angle: 225, tilt: 0.3, type: OrbitalPositionType.EQUATORIAL },
    { angle: 315, tilt: 0.3, type: OrbitalPositionType.EQUATORIAL },
  ]
};

// Refined Visual Constants
export const VISUAL_CONFIG = {
  ATOM_RADIUS: 30,
  LOBE_LENGTH: 80,
  LOBE_WIDTH: 35,
  COLORS: {
    BOND: '#10b981', // Emerald 500
    LONE_PAIR: '#f59e0b', // Amber 500
    EMPTY: '#334155', // Slate 700
    CENTRAL_ATOM: '#6366f1', // Indigo 500
    AXIS_LINE: '#475569'
  }
};