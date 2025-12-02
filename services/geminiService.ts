import { GoogleGenAI } from "@google/genai";
import { MoleculeDef } from "../types";
import { GEOMETRY_NAMES } from "../constants";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getHint = async (molecule: MoleculeDef, currentError?: string) => {
  try {
    if (!process.env.API_KEY) {
      return "Gemini API Key is missing. Please check your configuration.";
    }

    const prompt = `
      You are a chemistry tutor for a student learning VSEPR theory and molecular geometry.
      The student is stuck on the molecule: ${molecule.name} (${molecule.formula}).
      Target Geometry: ${GEOMETRY_NAMES[molecule.hybridization]}.
      Steric Number: ${molecule.stericNumber}.
      Bonding Pairs: ${molecule.bondingPairs}.
      Lone Pairs: ${molecule.lonePairs}.
      
      Note: The UI allows the user to select the Geometry Shape (e.g., Linear, Tetrahedral, Octahedral).
      
      ${currentError ? `The student made this error: ${currentError}` : ''}
      
      Provide a short, helpful hint (max 2 sentences). Do not give the answer directly if possible, but guide them towards the steric number calculation or orbital placement logic.
      If the error mentions lone pair placement in Trigonal Bipyramidal, explain why equatorial positions are preferred.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Try calculating the steric number: bonding pairs + lone pairs.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Check the number of bonding regions and lone pairs around the central atom.";
  }
};

export const getSuccessMessage = async (molecule: MoleculeDef) => {
  try {
    if (!process.env.API_KEY) return "Great job! That structure is stable.";

    const prompt = `
      The student successfully built ${molecule.name} (${molecule.formula}) with ${GEOMETRY_NAMES[molecule.hybridization]} geometry.
      Give a very brief (1 sentence) fun fact or stability note about this molecule's geometry.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    return "Excellent work! Structure stabilized.";
  }
};