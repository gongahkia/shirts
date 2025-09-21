import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';
import { Document, DocumentType, DocumentFormat, LegalCase } from '@/types';
import { GeminiService } from './gemini';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DocumentGeneratorService {
  private geminiService: GeminiService;
  private outputDir: string;

  constructor() {
    this.geminiService = new GeminiService();
    this.outputDir = process.env.UPLOAD_DIR || './uploads';
  }

  async generateDocument(
    caseData: LegalCase,
    documentType: DocumentType,
    format: DocumentFormat = 'pdf'
  ): Promise<Document> {
    try {
      logger.info('Starting document generation', {
        caseId: caseData.id,
        documentType,
        format
      });

      await this.ensureOutputDirectory();

      const content = await this.generateDocumentContent(caseData, documentType);

      const documentId = uuidv4();
      const filename = `${documentType}_${caseData.id}_${documentId}.${format}`;
      const filePath = path.join(this.outputDir, filename);

      let finalContent: string;
      let wordCount: number;
      let pageCount: number;

      switch (format) {
        case 'pdf':
          await this.generatePDF(content, filePath);
          finalContent = content;
          break;
        case 'docx':
          await this.generateDOCX(content, filePath);
          finalContent = content;
          break;
        case 'html':
          finalContent = this.generateHTML(content);
          await fs.writeFile(filePath, finalContent);
          break;
        case 'txt':
          finalContent = content;
          await fs.writeFile(filePath, finalContent);
          break;
        default:
          throw new Error(`Unsupported document format: ${format}`);
      }

      wordCount = this.countWords(content);
      pageCount = this.estimatePages(content);

      const document: Document = {
        id: documentId,
        caseId: caseData.id,
        type: documentType,
        title: this.generateDocumentTitle(documentType, caseData),
        content: finalContent,
        format,
        version: 1,
        status: 'draft',
        generatedBy: 'Document Generation Service',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          wordCount,
          pageCount,
          lastModifiedBy: 'Document Generation Service',
          tags: [documentType, caseData.caseDetails.category],
          confidentialityLevel: 'attorney-client'
        }
      };

      logger.info('Document generation completed', {
        documentId,
        caseId: caseData.id,
        documentType,
        format,
        wordCount,
        pageCount
      });

      return document;

    } catch (error) {
      logger.error('Document generation failed', {
        caseId: caseData.id,
        documentType,
        format,
        error: error instanceof Error ? error.message : error
      });
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async generateDocumentContent(
    caseData: LegalCase,
    documentType: DocumentType
  ): Promise<string> {
    const template = this.getDocumentTemplate(documentType);
    const context = this.buildDocumentContext(caseData);

    const prompt = `Generate a professional ${documentType} document based on the following template and case information:

TEMPLATE:
${template}

CASE INFORMATION:
${context}

Requirements:
1. Use formal legal language appropriate for court filings
2. Include all necessary legal sections and clauses
3. Ensure proper formatting with headers, numbered sections, and clear structure
4. Include placeholder fields for signatures, dates, and court information
5. Follow jurisdiction-specific requirements for ${caseData.caseDetails.jurisdiction}
6. Maintain professional tone throughout
7. Include proper legal citations where applicable

Generate a complete, court-ready document that can be reviewed and filed with minimal modifications.`;

    const response = await this.geminiService.generateLegalDocument(
      documentType,
      caseData,
      template
    );

    return this.formatDocumentContent(response, documentType);
  }

  private getDocumentTemplate(documentType: DocumentType): string {
    const templates = {
      complaint: `
COMPLAINT FOR [LEGAL ISSUE]

TO THE HONORABLE COURT:

NOW COMES [PLAINTIFF NAME], by and through undersigned counsel, and for their Complaint against [DEFENDANT NAME], states as follows:

PARTIES
1. Plaintiff [PLAINTIFF NAME] is [DESCRIPTION].
2. [DEFENDANT INFORMATION]

JURISDICTION AND VENUE
3. This Court has jurisdiction over this matter pursuant to [JURISDICTION BASIS].
4. Venue is proper in this Court under [VENUE BASIS].

FACTUAL ALLEGATIONS
5. [FACTUAL BACKGROUND]
6. [SPECIFIC FACTS SUPPORTING CLAIMS]

CAUSES OF ACTION
COUNT I - [FIRST CAUSE OF ACTION]
7. Plaintiff incorporates all preceding paragraphs.
8. [SPECIFIC ALLEGATIONS FOR THIS COUNT]
9. [DAMAGES/RELIEF SOUGHT]

PRAYER FOR RELIEF
WHEREFORE, Plaintiff respectfully requests that this Court:
a) [SPECIFIC RELIEF REQUESTED]
b) Award costs and attorney's fees
c) Grant such other relief as the Court deems just and proper

Respectfully submitted,
[ATTORNEY SIGNATURE BLOCK]`,

      motion: `
MOTION FOR [RELIEF SOUGHT]

TO THE HONORABLE COURT:

NOW COMES [MOVING PARTY], by and through undersigned counsel, and respectfully moves this Court for [RELIEF SOUGHT], and in support thereof states:

BACKGROUND
1. [CASE BACKGROUND]
2. [RELEVANT PROCEDURAL HISTORY]

LEGAL STANDARD
3. [APPLICABLE LEGAL STANDARD]

ARGUMENT
4. [LEGAL ARGUMENT SUPPORTING MOTION]
5. [FACTUAL SUPPORT]
6. [CONCLUSION OF ARGUMENT]

CONCLUSION
For the foregoing reasons, [MOVING PARTY] respectfully requests that this Court grant this Motion.

Respectfully submitted,
[ATTORNEY SIGNATURE BLOCK]`,

      brief: `
BRIEF IN SUPPORT OF [POSITION]

TABLE OF CONTENTS
I. STATEMENT OF THE CASE
II. STATEMENT OF FACTS
III. ARGUMENT
IV. CONCLUSION

I. STATEMENT OF THE CASE
[PROCEDURAL HISTORY AND LEGAL ISSUE]

II. STATEMENT OF FACTS
[RELEVANT FACTS PRESENTED FAVORABLY]

III. ARGUMENT
A. [FIRST LEGAL ARGUMENT]
   1. [SUB-ARGUMENT]
   2. [SUPPORTING ANALYSIS]
B. [SECOND LEGAL ARGUMENT]
   1. [SUB-ARGUMENT]
   2. [SUPPORTING ANALYSIS]

IV. CONCLUSION
For the foregoing reasons, [PARTY] respectfully requests [RELIEF SOUGHT].`,

      contract: `
[CONTRACT TYPE]

This [CONTRACT TYPE] ("Agreement") is entered into on [DATE] between:

[PARTY 1 NAME], a [STATE/ENTITY TYPE] ("Party 1")
Address: [ADDRESS]

and

[PARTY 2 NAME], a [STATE/ENTITY TYPE] ("Party 2")
Address: [ADDRESS]

RECITALS
WHEREAS, [BACKGROUND AND PURPOSE];
NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree:

1. [MAIN PROVISIONS]
2. [TERMS AND CONDITIONS]
3. [PAYMENT/CONSIDERATION]
4. [PERFORMANCE OBLIGATIONS]
5. [DEFAULT AND REMEDIES]
6. [MISCELLANEOUS PROVISIONS]

IN WITNESS WHEREOF, the parties have executed this Agreement.

[SIGNATURE BLOCKS]`,

      'legal-memo': `
MEMORANDUM

TO: [RECIPIENT]
FROM: [AUTHOR]
DATE: [DATE]
RE: [SUBJECT MATTER]

EXECUTIVE SUMMARY
[BRIEF SUMMARY OF ANALYSIS AND RECOMMENDATION]

FACTS
[RELEVANT FACTS]

LEGAL ANALYSIS
I. [FIRST LEGAL ISSUE]
   A. [APPLICABLE LAW]
   B. [ANALYSIS]
   C. [CONCLUSION]

II. [SECOND LEGAL ISSUE]
   A. [APPLICABLE LAW]
   B. [ANALYSIS]
   C. [CONCLUSION]

RECOMMENDATION
[STRATEGIC RECOMMENDATION BASED ON ANALYSIS]`,
    };

    return templates[documentType] || templates['legal-memo'];
  }

  private buildDocumentContext(caseData: LegalCase): string {
    return `
Case ID: ${caseData.id}
Case Title: ${caseData.caseDetails.title}
Legal Category: ${caseData.caseDetails.category}
Jurisdiction: ${caseData.caseDetails.jurisdiction}
Court Level: ${caseData.caseDetails.courtLevel}

Plaintiff Information:
- Name: ${caseData.plaintiffInfo.name}
- Address: ${caseData.plaintiffInfo.address.street}, ${caseData.plaintiffInfo.address.city}, ${caseData.plaintiffInfo.address.state} ${caseData.plaintiffInfo.address.zipCode}
- Legal Issue: ${caseData.plaintiffInfo.legalIssue}
- Description: ${caseData.plaintiffInfo.description}
- Desired Outcome: ${caseData.plaintiffInfo.desiredOutcome}

Case Details:
- Estimated Duration: ${caseData.caseDetails.estimatedDuration} days
- Complexity: ${caseData.caseDetails.complexity}
- Precedents: ${caseData.caseDetails.precedents.join(', ')}
- Relevant Laws: ${caseData.caseDetails.relevantLaws.join(', ')}

Case Status: ${caseData.status}
Workflow Stage: ${caseData.workflowStage}
`;
  }

  private formatDocumentContent(content: string, documentType: DocumentType): string {
    let formatted = content;

    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    formatted = formatted.trim();

    if (documentType === 'complaint') {
      formatted = this.addLineNumbers(formatted);
    }

    return formatted;
  }

  private addLineNumbers(content: string): string {
    const lines = content.split('\n');
    let lineNumber = 1;

    return lines.map(line => {
      if (line.trim().length === 0) {
        return line;
      }
      const numberedLine = `${lineNumber.toString().padStart(2, ' ')}. ${line}`;
      lineNumber++;
      return numberedLine;
    }).join('\n');
  }

  private async generatePDF(content: string, filePath: string): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesBold);

    const lines = content.split('\n');
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 72; // 1 inch margin
    const pageWidth = 612; // 8.5 inches
    const pageHeight = 792; // 11 inches
    const maxWidth = pageWidth - (margin * 2);
    const maxLinesPerPage = Math.floor((pageHeight - (margin * 2)) / lineHeight);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    let linesOnCurrentPage = 0;

    for (const line of lines) {
      if (linesOnCurrentPage >= maxLinesPerPage - 2) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
        linesOnCurrentPage = 0;
      }

      const currentFont = line.trim().toUpperCase() === line.trim() && line.length < 50 ? boldFont : font;

      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= lineHeight;
      linesOnCurrentPage++;
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);
  }

  private async generateDOCX(content: string, filePath: string): Promise<void> {
    const lines = content.split('\n');
    const paragraphs = lines.map(line => {
      if (line.trim().toUpperCase() === line.trim() && line.length < 50 && line.trim().length > 0) {
        return new Paragraph({
          children: [new TextRun({ text: line, bold: true })],
          heading: HeadingLevel.HEADING_2,
        });
      } else {
        return new Paragraph({
          children: [new TextRun(line)],
        });
      }
    });

    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
  }

  private generateHTML(content: string): string {
    const lines = content.split('\n');
    const htmlLines = lines.map(line => {
      if (line.trim().toUpperCase() === line.trim() && line.length < 50 && line.trim().length > 0) {
        return `<h2>${line}</h2>`;
      } else if (line.trim().length === 0) {
        return '<br>';
      } else {
        return `<p>${line}</p>`;
      }
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Legal Document</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.5; }
        h1, h2, h3 { text-align: center; font-weight: bold; }
        p { margin: 0.5em 0; text-align: justify; }
        .signature-block { margin-top: 2em; }
    </style>
</head>
<body>
    ${htmlLines.join('\n')}
</body>
</html>`;
  }

  private generateDocumentTitle(documentType: DocumentType, caseData: LegalCase): string {
    const prefix = documentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${prefix} - ${caseData.caseDetails.title}`;
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimatePages(content: string): number {
    const wordsPerPage = 250;
    const wordCount = this.countWords(content);
    return Math.max(1, Math.ceil(wordCount / wordsPerPage));
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async validateDocument(document: Document): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (document.content.length < 100) {
      issues.push('Document appears to be too short for a legal document');
    }

    if (!document.content.includes('Respectfully submitted') && document.type !== 'contract') {
      suggestions.push('Consider adding a proper signature block');
    }

    if (document.type === 'complaint' && !document.content.includes('CAUSES OF ACTION')) {
      issues.push('Complaint should include a "CAUSES OF ACTION" section');
    }

    if (document.type === 'motion' && !document.content.includes('WHEREFORE')) {
      suggestions.push('Motion should typically include a "WHEREFORE" clause');
    }

    const prompt = `Review this ${document.type} document for legal accuracy and completeness:

${document.content.substring(0, 2000)}...

Provide feedback on:
1. Legal formatting and structure
2. Missing sections or clauses
3. Language clarity and professionalism
4. Compliance with court requirements

Respond with JSON: { "criticalIssues": [], "suggestions": [], "overallAssessment": "string" }`;

    try {
      const response = await this.geminiService.analyzeLegalText(document.content, 'issues');
      // Parse AI feedback and add to issues/suggestions
    } catch (error) {
      suggestions.push('Unable to perform AI validation - manual review recommended');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}