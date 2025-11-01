"use server"

import { z } from "zod";
import { ai } from "../firebase/ai";

// Define schema for interview setup
const interviewSetupSchema = z.object({
    name: z.string().min(1),
    position: z.string().min(1),
    experience: z.string().min(1),
});

// Define schema for interview responses
const interviewResponsesSchema = z.object({
    name: z.string().min(1),
    position: z.string().min(1),
    experience: z.string().min(1),
    questions: z.array(z.string()),
    responses: z.array(z.string()),
});

// Update type definitions to include hints
export type InterviewSetup = z.infer<typeof interviewSetupSchema>;
export type InterviewResponses = z.infer<typeof interviewResponsesSchema>;
export type InterviewQuestion = {
    question: string;
    hint: string;
};
export type InterviewFeedback = {
    strengths: string[];
    improvements: string[];
    overallScore: number;
    detailedFeedback: { question: string; feedback: string }[];
};

// AI flow to generate interview questions
export async function generateInterviewQuestions(setup: InterviewSetup): Promise<InterviewQuestion[]> {
    try {
        const { name, position, experience } = interviewSetupSchema.parse(setup);

        const response = await ai.generate(`
      Generate 5 professional interview questions for ${name} who is applying for a ${position} position 
      with ${experience} years of experience. The questions should be tailored to this position and experience level.
      
      For each question, provide a short hint that helps the candidate understand what the interviewer is looking for.
      
      Return the result as a JSON array with objects containing "question" and "hint" properties.
      
      Format: [
        {"question": "question 1", "hint": "hint for question 1"},
        {"question": "question 2", "hint": "hint for question 2"},
        ...
      ]
    `);

        // Parse the response to extract the JSON array
        const textContent = response.text.trim();
        const jsonMatch = textContent.match(/\[\s*\{[\s\S]*\}\s*\]/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as InterviewQuestion[];
        } else {
            // Fallback questions if parsing fails
            return [
                {
                    question: "Tell me about yourself and your experience in this field.",
                    hint: "Focus on relevant experience and skills that match the job requirements."
                },
                {
                    question: "Why are you interested in this position?",
                    hint: "Show your understanding of the role and how it aligns with your career goals."
                },
                {
                    question: "Describe a challenging situation you faced at work and how you handled it.",
                    hint: "Use the STAR method: Situation, Task, Action, and Result."
                },
                {
                    question: "What are your greatest strengths and weaknesses?",
                    hint: "Be honest about weaknesses but show how you're working to improve them."
                },
                {
                    question: "Where do you see yourself in 5 years?",
                    hint: "Align your answer with realistic growth within the company or industry."
                }
            ];
        }
    } catch (error) {
        console.error("Error generating interview questions:", error);
        throw new Error("Failed to generate interview questions");
    }
}

// AI flow to evaluate interview responses
export async function evaluateInterviewResponses(data: InterviewResponses): Promise<InterviewFeedback> {
    try {
        const { name, position, experience, questions, responses } = interviewResponsesSchema.parse(data);

        // Create a prompt with all questions and answers
        let promptContent = `
      Evaluate the following mock interview for ${name} who is applying for a ${position} position 
      with ${experience} years of experience.\n\n
    `;

        // Add each question and response pair
        questions.forEach((question, index) => {
            promptContent += `Question ${index + 1}: ${question}\n`;
            promptContent += `Response: ${responses[index] || "No response provided"}\n\n`;
        });

        promptContent += `
      Analyze the responses and provide:
      1. Three key strengths demonstrated in the responses
      2. Three areas for improvement 
      3. An overall score out of 10
      4. Specific feedback for each response
      
      Return the results as a JSON object with the following format:
      {
        "strengths": ["strength1", "strength2", "strength3"],
        "improvements": ["improvement1", "improvement2", "improvement3"],
        "overallScore": number,
        "detailedFeedback": [
          {"question": "question text", "feedback": "feedback for this response"},
          ...
        ]
      }
    `;

        const response = await ai.generate(promptContent);

        // Parse the response to extract the JSON
        const textContent = response.text.trim();
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as InterviewFeedback;
        } else {
            // Fallback feedback if parsing fails
            return {
                strengths: [
                    "Clear communication style",
                    "Good examples from past experience",
                    "Demonstrated problem-solving skills",
                ],
                improvements: [
                    "Could provide more specific metrics and results",
                    "Consider structuring answers using the STAR method",
                    "Elaborate more on technical skills relevant to the position",
                ],
                overallScore: 7.5,
                detailedFeedback: questions.map(question => ({
                    question,
                    feedback: "Response was adequate but could be improved with more specific examples."
                }))
            };
        }
    } catch (error) {
        console.error("Error evaluating interview responses:", error);
        throw new Error("Failed to evaluate interview responses");
    }
}

