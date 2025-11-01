"use server"

import { ai } from "@/lib/firebase/ai";
import admin from "@/lib/firebase/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Buffer } from 'buffer';
import { getStorage } from "firebase-admin/storage";

// Firestore reference
const db = admin.firestore();

export interface AnalysisResult {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    sectionFeedback: {
        [key: string]: {
            score: number;
            feedback: string;
        };
    };
    fileName?: string;
    fileUrl?: string;
    extractedText?: string; // Add this to store the extracted text
}

/**
 * Uploads a resume file to Firebase Storage
 */
async function uploadResumeToStorage(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string = 'application/pdf'
): Promise<{ url: string; success: boolean; error?: string }> {
    try {
        // Get storage instance
        const storage = getStorage();
        const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

        // Create a unique file path
        const timestamp = Date.now();
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `resume-analyzer/${timestamp}-${safeFileName}`;

        // Create a file reference
        const file = bucket.file(filePath);

        // Set the appropriate content type
        const options = {
            metadata: {
                contentType: fileType,
                metadata: {
                    uploadedAt: timestamp
                }
            }
        };

        // Upload the file - create a writable stream and pipe the buffer to it
        return new Promise((resolve, reject) => {
            const blobStream = file.createWriteStream(options);

            blobStream.on('error', (error) => {
                console.error("Error uploading file to Firebase Storage:", error);
                reject(error);
            });

            blobStream.on('finish', async () => {
                try {
                    // Make the file publicly accessible
                    await file.makePublic();

                    // Get the public URL
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

                    resolve({ url: publicUrl, success: true });
                } catch (error) {
                    console.error("Error making file public:", error);
                    reject(error);
                }
            });

            // Write the buffer to the stream and end it
            blobStream.end(fileBuffer);
        });
    } catch (error) {
        console.error("Error uploading resume file:", error);
        return {
            url: '',
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload resume"
        };
    }
}

/**
 * Extracts text from a resume PDF
 */
export async function extractResumeText(fileBuffer: Buffer): Promise<string> {
    try {
        // Use PDFLoader to extract text from the PDF
        const loader = new PDFLoader(new Blob([fileBuffer]));
        const docs = await loader.load();
        const resumeText = docs.map(doc => doc.pageContent).join('\n');

        if (!resumeText || resumeText.trim() === '') {
            throw new Error("No text could be extracted from the PDF");
        }

        return resumeText;
    } catch (error) {
        console.error("Error extracting PDF text:", error);
        throw new Error("Could not extract text from the PDF");
    }
}

/**
 * Generates an improved version of the resume based on AI analysis
 */
export async function generateImprovedResume(resumeText: string, analysis: AnalysisResult): Promise<string> {
    try {
        // Create a prompt that instructs the AI to improve the resume with structured formatting
        const prompt = `
            You are a professional resume writer and career coach. I need you to improve the following resume
            based on the analysis provided.
            
            ORIGINAL RESUME TEXT:
            ${resumeText}
            
            ANALYSIS SUMMARY:
            ${analysis.summary}
            
            AREAS FOR IMPROVEMENT:
            ${analysis.improvements.map(imp => `- ${imp}`).join('\n')}
            
            SECTION-SPECIFIC FEEDBACK:
            ${Object.entries(analysis.sectionFeedback)
                .map(([section, data]) => `${section.toUpperCase()}: ${data.feedback}`)
                .join('\n')}
            
            Please rewrite the entire resume, implementing all the improvements suggested in the analysis.
            Maintain the same general structure and information, but enhance:
            1. The wording and impact of achievements
            2. Quantifiable metrics where appropriate
            3. Keyword optimization for ATS systems
            4. Clear and professional formatting
            5. Clarity and conciseness
            
            FORMAT YOUR RESPONSE WITH THESE RULES:
            - Use ALL CAPS for section headers (like "EDUCATION", "EXPERIENCE", "SKILLS", etc.)
            - Put each section header on its own line
            - Use blank lines to separate sections
            - For the header/contact information section, format it professionally at the top
            - Use clear paragraphs with proper spacing
            - Organize bullet points with clear dashes or asterisks
            - Include a blank line between each job position or education entry
            
            Return ONLY the improved resume text without additional commentary or explanations.
        `;

        const result = await ai.generate(prompt);

        if (!result || !result.text) {
            throw new Error("AI did not generate an improved resume");
        }

        return result.text;
    } catch (error) {
        console.error("Error generating improved resume:", error);
        throw new Error("Failed to generate improved resume");
    }
}

export async function analyzeResume(formData: FormData): Promise<AnalysisResult> {
    try {
        // Get file from form data
        const file = formData.get('resume') as File;
        if (!file) {
            throw new Error("No file provided");
        }

        // Convert the file to an array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // First, upload the file to Firebase Storage
        const { url: fileUrl, success, error } = await uploadResumeToStorage(
            buffer,
            file.name,
            file.type
        );

        if (!success || !fileUrl) {
            throw new Error(error || "Failed to upload file to storage");
        }

        // Extract text from PDF
        const resumeText = await extractResumeText(buffer);

        // Limit text length to avoid token limits
        const truncatedText = resumeText.slice(0, 12000);

        // Use generate instead of defineFlow, similar to mock-interview.action.ts
        const prompt = `
            Analyze this resume text carefully and provide detailed feedback:
            
            RESUME TEXT:
            ${truncatedText}
            
            Return the response in this exact JSON format:
            {
                "score": <number from 0-100>,
                "summary": "<single paragraph summary of overall resume quality>",
                "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
                "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>"],
                "sectionFeedback": {
                    "header": {
                        "score": <number from 0-100>,
                        "feedback": "<feedback text on contact information section>"
                    },
                    "summary": {
                        "score": <number from 0-100>,
                        "feedback": "<feedback text on professional summary/objective>"
                    },
                    "experience": {
                        "score": <number from 0-100>,
                        "feedback": "<feedback text on work experience section>"
                    },
                    "education": {
                        "score": <number from 0-100>,
                        "feedback": "<feedback text on education section>"
                    },
                    "skills": {
                        "score": <number from 0-100>,
                        "feedback": "<feedback text on skills section>"
                    }
                }
            }
            
            IMPORTANT: Return ONLY the JSON object with no additional text before or after.
        `;

        const result = await ai.generate(prompt);

        if (!result || !result.text) {
            throw new Error("AI did not return a valid response");
        }

        let analysisResult: AnalysisResult;
        try {
            // Find JSON content in the response
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Could not find valid JSON in the AI response");
            }

            // Parse the JSON response
            analysisResult = JSON.parse(jsonMatch[0]) as AnalysisResult;

            // Add file information to the result
            analysisResult.fileName = file.name;
            analysisResult.fileUrl = fileUrl;
            analysisResult.extractedText = resumeText; // Include the extracted text

            // Validate required fields
            if (
                typeof analysisResult.score !== 'number' ||
                !analysisResult.summary ||
                !Array.isArray(analysisResult.strengths) ||
                !Array.isArray(analysisResult.improvements) ||
                !analysisResult.sectionFeedback
            ) {
                throw new Error("AI response is missing required fields");
            }
        } catch (jsonError) {
            console.error("Error parsing AI response as JSON:", jsonError, "Response:", result.text);

            // Fallback to a default structure if parsing fails
            analysisResult = {
                score: 70,
                summary: "We analyzed your resume but encountered an issue processing the detailed feedback. Here are some general recommendations for improving your resume.",
                strengths: ["Clear format", "Good structure", "Relevant experience"],
                improvements: ["Add more quantifiable achievements", "Optimize for ATS systems", "Focus on impact in job descriptions"],
                sectionFeedback: {
                    header: { score: 75, feedback: "Contact information appears complete." },
                    summary: { score: 70, feedback: "Consider making your summary more specific to target roles." },
                    experience: { score: 70, feedback: "Try adding more measurable achievements." },
                    education: { score: 80, feedback: "Education section is well structured." },
                    skills: { score: 70, feedback: "Consider organizing skills by category." }
                },
                fileName: file.name,
                fileUrl: fileUrl,
                extractedText: resumeText // Include the extracted text
            };
        }

        // Save to Firestore
        await saveAnalysisToFirestore(analysisResult);

        return analysisResult;
    } catch (error) {
        console.error("Error analyzing resume:", error);
        throw error;
    }
}

async function saveAnalysisToFirestore(
    analysis: AnalysisResult
): Promise<string> {
    try {
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('ResumeAnalysis').add({
            fileName: analysis.fileName,
            fileUrl: analysis.fileUrl,
            analysis: {
                score: analysis.score,
                summary: analysis.summary,
                strengths: analysis.strengths,
                improvements: analysis.improvements,
                sectionFeedback: analysis.sectionFeedback,
                extractedText: analysis.extractedText // Include the extracted text
            },
            createdAt: timestamp,
            updatedAt: timestamp
        });

        return docRef.id;
    } catch (error) {
        console.error("Error saving to Firestore:", error);
        throw error;
    }
}