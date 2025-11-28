import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface UserInfo {
  name: string;
  email: string;
  userId: string;
}

export interface MockInterviewPdfData {
  userInfo: UserInfo;
  interviewData: {
    position: string;
    experience: string;
    date: Date;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    responses: {
      question: string;
      response: string;
      feedback: string;
    }[];
  };
}

export function generateMockInterviewPdf(data: MockInterviewPdfData): jsPDF {
  const doc = new jsPDF();
  const { userInfo, interviewData } = data;

  // Add jspdf-autotable to document
  autoTable(doc, {});

  // Set font
  doc.setFont("helvetica");

  // Add header
  doc.setFontSize(20);
  doc.text("RabbitJob", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.text(`User ID: ${userInfo.userId}`, 10, 25);
  doc.text(`Email: ${userInfo.email}`, 10, 30);
  doc.text(`Name: ${userInfo.name}`, 10, 35);

  const formattedDate = format(interviewData.date, "PPpp"); // Format: Apr 29, 2023, 1:30 PM
  doc.text(`Interview Date: ${formattedDate}`, 10, 40);

  // Add title
  doc.setFontSize(16);
  doc.text("Mock Interview Results", 105, 50, { align: "center" });

  // Position and experience
  doc.setFontSize(12);
  doc.text(`Position: ${interviewData.position}`, 10, 60);
  doc.text(`Experience: ${interviewData.experience}`, 10, 65);

  // Overall score
  doc.setFontSize(14);
  doc.text(`Overall Score: ${interviewData.overallScore}/10`, 105, 75, {
    align: "center",
  });

  // Strengths section
  doc.setFontSize(12);
  doc.text("Strengths:", 10, 85);

  interviewData.strengths.forEach((strength, index) => {
    doc.text(`${index + 1}. ${strength}`, 15, 92 + index * 5);
  });

  // Areas for improvement section
  const improvementStartY = 97 + interviewData.strengths.length * 5;
  doc.text("Areas for Improvement:", 10, improvementStartY);

  interviewData.improvements.forEach((improvement, index) => {
    doc.text(
      `${index + 1}. ${improvement}`,
      15,
      improvementStartY + 7 + index * 5
    );
  });

  // Questions and responses section
  const responsesStartY =
    improvementStartY + 15 + interviewData.improvements.length * 5;
  doc.text("Detailed Response Analysis:", 10, responsesStartY);

  // Use autoTable for better formatting of questions and responses
  autoTable(doc, {
    startY: responsesStartY + 5,
    head: [["Question", "Your Response", "Feedback"]],
    body: interviewData.responses.map((item) => [
      item.question,
      item.response,
      item.feedback,
    ]),
    headStyles: { fillColor: [66, 133, 244] },
    styles: { overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 },
    },
  });

  return doc;
}

export interface ResumeAnalysisPdfData {
  userInfo: UserInfo;
  analysisData: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    sectionFeedback: Record<string, { score: number; feedback: string }>;
    date: Date;
  };
}

export function generateResumeAnalysisPdf(data: ResumeAnalysisPdfData): jsPDF {
  const doc = new jsPDF();
  const { userInfo, analysisData } = data;

  // Add jspdf-autotable to document
  autoTable(doc, {});

  // Set font
  doc.setFont("helvetica");

  // Add header
  doc.setFontSize(20);
  doc.text("RabbitJob", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.text(`User ID: ${userInfo.userId}`, 10, 25);
  doc.text(`Email: ${userInfo.email}`, 10, 30);
  doc.text(`Name: ${userInfo.name}`, 10, 35);

  const formattedDate = format(analysisData.date, "PPpp");
  doc.text(`Analysis Date: ${formattedDate}`, 10, 40);

  // Add title
  doc.setFontSize(16);
  doc.text("Resume Analysis Results", 105, 50, { align: "center" });

  // Overall score
  doc.setFontSize(14);
  doc.text(`Overall Score: ${analysisData.score}/100`, 105, 60, {
    align: "center",
  });

  // Summary
  doc.setFontSize(12);
  doc.text("Summary:", 10, 70);

  const splitSummary = doc.splitTextToSize(analysisData.summary, 190);
  doc.setFontSize(10);
  doc.text(splitSummary, 10, 75);

  let currentY = 75 + splitSummary.length * 5;

  // Strengths section
  doc.setFontSize(12);
  doc.text("Strengths:", 10, currentY + 5);
  currentY += 10;

  doc.setFontSize(10);
  analysisData.strengths.forEach((strength) => {
    const splitStrength = doc.splitTextToSize(`• ${strength}`, 190);
    doc.text(splitStrength, 15, currentY);
    currentY += splitStrength.length * 5;
  });

  // Areas for improvement section
  currentY += 5;
  doc.setFontSize(12);
  doc.text("Areas for Improvement:", 10, currentY);
  currentY += 5;

  doc.setFontSize(10);
  analysisData.improvements.forEach((improvement) => {
    const splitImprovement = doc.splitTextToSize(`• ${improvement}`, 190);
    doc.text(splitImprovement, 15, currentY);
    currentY += splitImprovement.length * 5;
  });

  // Section Analysis
  currentY += 10;
  doc.setFontSize(12);
  doc.text("Detailed Section Analysis:", 10, currentY);

  // Use autoTable for section analysis
  autoTable(doc, {
    startY: currentY + 5,
    head: [["Section", "Score", "Feedback"]],
    body: Object.entries(analysisData.sectionFeedback).map(
      ([section, data]) => [
        section.charAt(0).toUpperCase() + section.slice(1),
        `${data.score}/100`,
        data.feedback,
      ]
    ),
    headStyles: { fillColor: [66, 133, 244] },
    styles: { overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 110 },
    },
  });

  return doc;
}
