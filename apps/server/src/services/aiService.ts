import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env.js";

export interface UserProfile {
  level?: string;
  weeklyHours?: number;
  goals?: string[];
  currentFitness?: string;
  targetRace?: string;
  targetDate?: string;
}

// Principe SOLID : Single Responsibility (Ce service ne fait que parler à l'IA)
export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error(
        "CRITICAL: GEMINI_API_KEY is not defined in server environment"
      );
    }
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generates a structured training plan
   * @param userProfile Anonymized user data
   */
  async generateTrainingPlan(userProfile: UserProfile): Promise<string> {
    const prompt = `
      Act as an expert ultra-trail coach.
      Generate a weekly training plan based on this profile: ${JSON.stringify(userProfile)}.
      Return ONLY valid JSON format without markdown code blocks.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Basic cleanup in case the model adds markdown
      return text.replace(/```json/g, "").replace(/```/g, "").trim();
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error("Failed to generate training plan");
    }
  }
}

// Singleton instance for use across the application
let aiServiceInstance: AIService | null = null;

export const getAIService = (): AIService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
};
