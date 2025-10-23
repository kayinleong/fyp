import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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
    doc.text("KL2PEN", 105, 15, { align: "center" });

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
    doc.text(`Overall Score: ${interviewData.overallScore}/10`, 105, 75, { align: "center" });

    // Strengths section
    doc.setFontSize(12);
    doc.text("Strengths:", 10, 85);

    interviewData.strengths.forEach((strength, index) => {
        doc.text(`${index + 1}. ${strength}`, 15, 92 + (index * 5));
    });

    // Areas for improvement section
    const improvementStartY = 97 + (interviewData.strengths.length * 5);
    doc.text("Areas for Improvement:", 10, improvementStartY);

    interviewData.improvements.forEach((improvement, index) => {
        doc.text(`${index + 1}. ${improvement}`, 15, improvementStartY + 7 + (index * 5));
    });

    // Questions and responses section
    const responsesStartY = improvementStartY + 15 + (interviewData.improvements.length * 5);
    doc.text("Detailed Response Analysis:", 10, responsesStartY);

    // Use autoTable for better formatting of questions and responses
    autoTable(doc, {
        startY: responsesStartY + 5,
        head: [['Question', 'Your Response', 'Feedback']],
        body: interviewData.responses.map(item => [
            item.question,
            item.response,
            item.feedback
        ]),
        headStyles: { fillColor: [66, 133, 244] },
        styles: { overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 60 },
            2: { cellWidth: 60 }
        },
    });

    return doc;
}
