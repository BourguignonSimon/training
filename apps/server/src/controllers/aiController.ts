import { Request, Response } from "express";
import { getAIService, UserProfile } from "../services/aiService.js";

/**
 * Generate AI-powered training plan
 * POST /api/ai/generate-plan
 */
export const generateTrainingPlan = async (req: Request, res: Response) => {
  try {
    const userProfile: UserProfile = req.body;

    if (!userProfile || Object.keys(userProfile).length === 0) {
      return res.status(400).json({
        error: "User profile is required",
        details: "Please provide at least some training preferences",
      });
    }

    const aiService = getAIService();
    const plan = await aiService.generateTrainingPlan(userProfile);

    // Try to parse as JSON to validate the response
    try {
      const parsedPlan = JSON.parse(plan);
      return res.status(200).json(parsedPlan);
    } catch {
      // If not valid JSON, return as text
      return res.status(200).json({ plan });
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Training Plan Generation Error:", err.message);
    return res.status(500).json({
      error: "Failed to generate training plan",
      details: err.message,
    });
  }
};
