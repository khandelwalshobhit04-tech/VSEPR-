export enum HybridizationType {
  SP = 'sp',
  SP2 = 'sp²',
  SP3 = 'sp³',
  SP3D = 'sp³d',
  SP3D2 = 'sp³d²'
}

export enum SlotType {
  EMPTY = 'empty',
  BOND = 'bond',
  LONE_PAIR = 'lone_pair'
}

export enum OrbitalPositionType {
  AXIAL = 'axial',
  EQUATORIAL = 'equatorial',
  GENERAL = 'general' // For geometries where all positions are equivalent (e.g., tetrahedral)
}

export interface OrbitalSlot {
  id: number;
  angle: number; // Angle in degrees for 2D projection visualization
  tilt: number; // Z-axis tilt for pseudo-3D effect (0 to 1)
  type: SlotType;
  positionType: OrbitalPositionType;
}

export interface MoleculeDef {
  formula: string;
  name: string;
  centralAtom: string;
  ligandAtom: string; // The atom bonding to the center
  bondingPairs: number;
  lonePairs: number;
  stericNumber: number;
  hybridization: HybridizationType;
  description: string;
  // For validation of sp3d specifically
  geometryRules?: {
    lonePairsMustBe?: OrbitalPositionType; 
  };
}

export interface GameState {
  currentMoleculeIndex: number;
  score: number;
  history: boolean[]; // Track success/fail for each level
  isComplete: boolean;
}