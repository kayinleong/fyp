import { z } from "zod";

// Define schema for interview setup
export const interviewSetupSchema = z.object({
    name: z.string().min(1),
    position: z.string().min(1),
    experience: z.string().min(1),
});

// Define schema for interview responses
export const interviewResponsesSchema = z.object({
    name: z.string().min(1),
    position: z.string().min(1),
    experience: z.string().min(1),
    questions: z.array(z.string()),
    responses: z.array(z.string()),
});

// Type definitions
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