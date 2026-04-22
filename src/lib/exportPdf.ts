import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Company, NewAssessment, RepeatedAssessment } from './types';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getStatusLabel, getLevelColor, generateAIExecutiveSummary } from './scoring';

// ==================== HELPERS ====================
function levelLabel(level: string) {
  return level.replace('_', ' ');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ==================== PDF: COMPANY REPORT ====================
export function exportCompanyReportPDF(company: Company) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const status = getCompanyStatus(company);
  const currentScore = getCompanyCurrentScore(company);
  const currentLevel = getCompanyCurrentLevel(company);
  const levelColor = getLevelColor(currentLevel);
  const rgb = hexToRgb(levelColor);

  // ---- Header Banner ----
  doc.setFillColor(10, 10, 18);
  doc.rect(0, 0, pageWidth, 52, 'F');

  // Accent line
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(0, 52, pageWidth, 1.5, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('ScoreHub', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text('MARITIME INTELLIGENCE · CLIENT ASSESSMENT REPORT', margin, 25);

  // Company name in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(company.companyName, margin, 38);

  // Level badge
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(margin, 42, 30, 7, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(levelLabel(currentLevel), margin + 15, 46.5, { align: 'center' });

  // Score in header right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text(currentScore.toFixed(2), pageWidth - margin, 40, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 170);
  doc.text('CURRENT SCORE', pageWidth - margin, 47, { align: 'right' });

  y = 60;

  // ---- Company Info Section ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text('COMPANY INFORMATION', margin, y);
  y += 2;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(margin, y, 40, 0.5, 'F');
  y += 6;

  const info = [
    ['Contact Person', company.contactPerson],
    ['Email', company.email],
    ['Phone', company.phone],
    ['Location', company.location],
    ['Fleet Size', `${company.fleetSize} vessels`],
    ['Industry', company.industry],
    ['Registered', formatDate(company.registeredDate)],
    ['Status', getStatusLabel(status)],
    ['Total Assessments', `${company.newAssessments.length + company.repeatedAssessments.length}`],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: info,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 }, textColor: [180, 180, 200] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 130] },
      1: { textColor: [220, 220, 240] },
    },
    alternateRowStyles: { fillColor: [14, 14, 22] },
    didDrawPage: () => {},
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ---- AI Executive Summary ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 92, 246);
  doc.text('AI EXECUTIVE SUMMARY', margin, y);
  y += 2;
  doc.setFillColor(139, 92, 246);
  doc.rect(margin, y, 45, 0.5, 'F');
  y += 6;
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  const summaryText = generateAIExecutiveSummary(company);
  const splitText = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitText, margin, y);
  y += (splitText.length * 4) + 10;

  // ---- New Assessments ----
  if (company.newAssessments.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 182, 212);
    doc.text('NEW CUSTOMER ASSESSMENTS (PRE-JUDGEMENT)', margin, y);
    y += 2;
    doc.setFillColor(6, 182, 212);
    doc.rect(margin, y, 60, 0.5, 'F');
    y += 5;

    const sorted = [...company.newAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach((a, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }

      // Assessment header
      doc.setFillColor(16, 16, 28);
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(6, 182, 212);
      doc.text(`${idx + 1}. ${a.projectName}`, margin + 3, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 150);
      doc.text(formatDate(a.date), pageWidth - margin - 3, y + 5.5, { align: 'right' });
      y += 12;

      const s = a.scores;
      const scoreColor = hexToRgb(getLevelColor(s.level));

      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2 },
        head: [['Category', 'Parameter', 'Score', 'Weighted']],
        body: [
          ['Commercial Potential (50%)', 'Fleet Size', s.fleetScore.toFixed(1), ''],
          ['', 'Estimated Value', s.valueScore.toFixed(1), ''],
          ['', 'Term Payment', s.termPaymentScore.toFixed(1), s.commercialPotentialWeighted.toFixed(2)],
          ['Credibility (30%)', 'Legal Documents', s.legalScore.toFixed(1), ''],
          ['', 'Background', s.backgroundScore.toFixed(1), ''],
          ['', 'Reference', s.referenceScore.toFixed(1), s.credibilityWeighted.toFixed(2)],
          ['Technical Clarity (20%)', 'Technical Docs', s.technicalScore.toFixed(1), ''],
          ['', 'Decision Speed', s.decisionSpeedScore.toFixed(1), s.technicalClarityWeighted.toFixed(2)],
        ],
        foot: [['TOTAL SCORE', '', s.totalScore.toFixed(2), levelLabel(s.level)]],
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [180, 180, 200], lineColor: [30, 30, 50], lineWidth: 0.2 },
        headStyles: { fillColor: [20, 20, 35], textColor: [6, 182, 212], fontStyle: 'bold', fontSize: 7 },
        footStyles: { fillColor: [20, 20, 35], textColor: scoreColor, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [12, 12, 20] },
        bodyStyles: { fillColor: [10, 10, 16] },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

      if (a.notes) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 130);
        doc.text(`Notes: ${a.notes}`, margin + 2, y);
        y += 6;
      }
    });
  }

  // ---- Repeated Assessments ----
  if (company.repeatedAssessments.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.text('REPEATED CUSTOMER ASSESSMENTS (FOLLOW-UP)', margin, y);
    y += 2;
    doc.setFillColor(139, 92, 246);
    doc.rect(margin, y, 60, 0.5, 'F');
    y += 5;

    const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach((a, idx) => {
      if (y > 230) { doc.addPage(); y = 20; }

      doc.setFillColor(16, 16, 28);
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(139, 92, 246);
      doc.text(`${idx + 1}. ${a.projectName}`, margin + 3, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 150);
      doc.text(`${formatDate(a.date)} | Period: ${a.periodStart} — ${a.periodEnd}`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
      y += 12;

      const s = a.scores;
      const scoreColor = hexToRgb(getLevelColor(s.level));

      autoTable(doc, {
        startY: y,
        margin: { left: margin + 2, right: margin + 2 },
        head: [['Category', 'Parameter', 'Score', 'Weighted']],
        body: [
          ['Revenue (30%)', 'Kontribusi Omset', s.kontribusiOmsetScore.toFixed(1), ''],
          ['', 'Margin', s.marginScore.toFixed(1), s.revenueWeighted.toFixed(2)],
          ['Payment (30%)', 'Ketepatan Bayar', s.ketepatanBayarScore.toFixed(1), ''],
          ['', 'Revisi Invoice', s.revisiInvoiceScore.toFixed(1), ''],
          ['', 'Penagihan', s.penagihanScore.toFixed(1), s.paymentWeighted.toFixed(2)],
          ['Operational (15%)', 'Cancel Order', s.cancelOrderScore.toFixed(1), ''],
          ['', 'Schedule Var.', s.scheduleVarianceScore.toFixed(1), ''],
          ['', 'Konflik QC', s.konflikQCScore.toFixed(1), ''],
          ['', 'Intervensi', s.intervensiScore.toFixed(1), s.operationalWeighted.toFixed(2)],
          ['Relationship (15%)', 'Komunikasi PIC', s.komunikasiScore.toFixed(1), ''],
          ['', 'Claim Count', s.claimScore.toFixed(1), s.relationshipWeighted.toFixed(2)],
          ['Value (10%)', 'Lama Kerjasama', s.lamaKerjasamaScore.toFixed(1), ''],
          ['', 'Fleet Size', s.fleetScore.toFixed(1), ''],
          ['', 'Referral', s.referralScore.toFixed(1), s.valueWeighted.toFixed(2)],
        ],
        foot: [['TOTAL SCORE', '', s.totalScore.toFixed(2), levelLabel(s.level)]],
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [180, 180, 200], lineColor: [30, 30, 50], lineWidth: 0.2 },
        headStyles: { fillColor: [20, 20, 35], textColor: [139, 92, 246], fontStyle: 'bold', fontSize: 7 },
        footStyles: { fillColor: [20, 20, 35], textColor: scoreColor, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [12, 12, 20] },
        bodyStyles: { fillColor: [10, 10, 16] },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

      if (a.notes) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 130);
        doc.text(`Notes: ${a.notes}`, margin + 2, y);
        y += 6;
      }
    });
  }

  // ---- Footer on every page ----
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(10, 10, 18);
    doc.rect(0, pageH - 12, pageWidth, 12, 'F');
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(0, pageH - 12, pageWidth, 0.3, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 100);
    doc.text(`ScoreHub Maritime Intelligence — ${company.companyName} — Generated ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, margin, pageH - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageH - 5, { align: 'right' });
  }

  doc.save(`ScoreHub_Report_${company.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ==================== PDF: SINGLE ASSESSMENT REPORT ====================
export function exportAssessmentPDF(company: Company, assessment: NewAssessment | RepeatedAssessment, type: 'NEW' | 'REPEATED') {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 0;

  const isNew = type === 'NEW';
  const accentColor: [number, number, number] = isNew ? [6, 182, 212] : [139, 92, 246];
  const score = assessment.scores.totalScore;
  const level = assessment.scores.level;
  const scoreRgb = hexToRgb(getLevelColor(level));

  // Header
  doc.setFillColor(10, 10, 18);
  doc.rect(0, 0, pageWidth, 55, 'F');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 55, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('ScoreHub', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text(isNew ? 'PRE-JUDGEMENT ASSESSMENT REPORT' : 'FOLLOW-UP ASSESSMENT REPORT', margin, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(assessment.projectName, margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(company.companyName, margin, 43);
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 150);
  doc.text(formatDate(assessment.date), margin, 50);

  // Score badge right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(scoreRgb[0], scoreRgb[1], scoreRgb[2]);
  doc.text(score.toFixed(2), pageWidth - margin, 38, { align: 'right' });
  doc.setFillColor(scoreRgb[0], scoreRgb[1], scoreRgb[2]);
  doc.roundedRect(pageWidth - margin - 28, 42, 28, 7, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(levelLabel(level), pageWidth - margin - 14, 46.5, { align: 'center' });

  y = 64;

  // Company info mini
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('COMPANY INFO', margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      ['Company', company.companyName],
      ['Contact', company.contactPerson],
      ['Location', company.location],
      ['Fleet Size', `${company.fleetSize} vessels`],
      ...(isNew ? [] : [['Period', `${(assessment as RepeatedAssessment).periodStart} — ${(assessment as RepeatedAssessment).periodEnd}`]]),
    ],
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [180, 180, 200] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30, textColor: [100, 100, 130] } },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Score breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('SCORE BREAKDOWN', margin, y);
  y += 5;

  if (isNew) {
    const s = (assessment as NewAssessment).scores;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Category', 'Parameter', 'Score (1-5)', 'Average', 'Weight', 'Weighted Score']],
      body: [
        ['Commercial Potential', 'Fleet Size', s.fleetScore.toFixed(1), '', '', ''],
        ['', 'Estimated Value', s.valueScore.toFixed(1), '', '', ''],
        ['', 'Term Payment', s.termPaymentScore.toFixed(1), s.commercialPotentialAvg.toFixed(2), '50%', s.commercialPotentialWeighted.toFixed(2)],
        ['Credibility', 'Legal Documents', s.legalScore.toFixed(1), '', '', ''],
        ['', 'Background', s.backgroundScore.toFixed(1), '', '', ''],
        ['', 'Reference', s.referenceScore.toFixed(1), s.credibilityAvg.toFixed(2), '30%', s.credibilityWeighted.toFixed(2)],
        ['Technical Clarity', 'Technical Docs', s.technicalScore.toFixed(1), '', '', ''],
        ['', 'Decision Speed', s.decisionSpeedScore.toFixed(1), s.technicalClarityAvg.toFixed(2), '20%', s.technicalClarityWeighted.toFixed(2)],
      ],
      foot: [['', '', '', '', 'TOTAL', s.totalScore.toFixed(2)]],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [180, 180, 200], lineColor: [30, 30, 50], lineWidth: 0.2 },
      headStyles: { fillColor: [20, 20, 35], textColor: accentColor, fontStyle: 'bold', fontSize: 7 },
      footStyles: { fillColor: [20, 20, 35], textColor: scoreRgb, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [12, 12, 20] },
      bodyStyles: { fillColor: [10, 10, 16] },
    });
  } else {
    const s = (assessment as RepeatedAssessment).scores;
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Category', 'Parameter', 'Score (1-5)', 'Average', 'Weight', 'Weighted Score']],
      body: [
        ['Revenue', 'Kontribusi Omset', s.kontribusiOmsetScore.toFixed(1), '', '', ''],
        ['', 'Margin', s.marginScore.toFixed(1), s.revenueAvg.toFixed(2), '30%', s.revenueWeighted.toFixed(2)],
        ['Payment', 'Ketepatan Bayar', s.ketepatanBayarScore.toFixed(1), '', '', ''],
        ['', 'Revisi Invoice', s.revisiInvoiceScore.toFixed(1), '', '', ''],
        ['', 'Penagihan', s.penagihanScore.toFixed(1), s.paymentAvg.toFixed(2), '30%', s.paymentWeighted.toFixed(2)],
        ['Operational', 'Cancel Order', s.cancelOrderScore.toFixed(1), '', '', ''],
        ['', 'Schedule Var.', s.scheduleVarianceScore.toFixed(1), '', '', ''],
        ['', 'Konflik QC', s.konflikQCScore.toFixed(1), '', '', ''],
        ['', 'Intervensi', s.intervensiScore.toFixed(1), s.operationalAvg.toFixed(2), '15%', s.operationalWeighted.toFixed(2)],
        ['Relationship', 'Komunikasi PIC', s.komunikasiScore.toFixed(1), '', '', ''],
        ['', 'Claim Count', s.claimScore.toFixed(1), s.relationshipAvg.toFixed(2), '15%', s.relationshipWeighted.toFixed(2)],
        ['Value', 'Lama Kerjasama', s.lamaKerjasamaScore.toFixed(1), '', '', ''],
        ['', 'Fleet Size', s.fleetScore.toFixed(1), '', '', ''],
        ['', 'Referral', s.referralScore.toFixed(1), s.valueAvg.toFixed(2), '10%', s.valueWeighted.toFixed(2)],
      ],
      foot: [['', '', '', '', 'TOTAL', s.totalScore.toFixed(2)]],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [180, 180, 200], lineColor: [30, 30, 50], lineWidth: 0.2 },
      headStyles: { fillColor: [20, 20, 35], textColor: accentColor, fontStyle: 'bold', fontSize: 7 },
      footStyles: { fillColor: [20, 20, 35], textColor: scoreRgb, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [12, 12, 20] },
      bodyStyles: { fillColor: [10, 10, 16] },
    });
  }

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (assessment.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 130);
    doc.text(`Notes: ${assessment.notes}`, margin, y);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(10, 10, 18);
  doc.rect(0, pageH - 12, pageWidth, 12, 'F');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, pageH - 12, pageWidth, 0.3, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 100);
  doc.text(`ScoreHub Maritime Intelligence — ${assessment.projectName} — Generated ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, margin, pageH - 5);

  doc.save(`ScoreHub_${type === 'NEW' ? 'PreJudgement' : 'FollowUp'}_${assessment.projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
