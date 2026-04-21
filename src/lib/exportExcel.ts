import * as XLSX from 'xlsx';
import { Company } from './types';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getStatusLabel } from './scoring';

export function exportDataMasterExcel(companies: Company[]) {
  const wb = XLSX.utils.book_new();

  // ====== Sheet 1: Company Overview ======
  const overviewData = companies.map((c) => {
    const status = getCompanyStatus(c);
    const score = getCompanyCurrentScore(c);
    const level = getCompanyCurrentLevel(c);
    return {
      'Company Name': c.companyName,
      'Contact Person': c.contactPerson,
      'Email': c.email,
      'Phone': c.phone,
      'Location': c.location,
      'Fleet Size': c.fleetSize,
      'Industry': c.industry,
      'Registered Date': c.registeredDate,
      'Last Deal Date': c.lastDealDate || '-',
      'Status': getStatusLabel(status),
      'Current Score': Math.round(score * 100) / 100,
      'Level': level.replace('_', ' '),
      'New Assessments': c.newAssessments.length,
      'Repeated Assessments': c.repeatedAssessments.length,
      'Total Assessments': c.newAssessments.length + c.repeatedAssessments.length,
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(overviewData);

  // Column widths
  ws1['!cols'] = [
    { wch: 28 }, { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Company Overview');

  // ====== Sheet 2: New Assessments ======
  const newRows: Record<string, string | number>[] = [];
  companies.forEach((c) => {
    c.newAssessments.forEach((a) => {
      const s = a.scores;
      newRows.push({
        'Company': c.companyName,
        'Project': a.projectName,
        'Date': a.date,
        'Fleet Score': s.fleetScore,
        'Value Score': s.valueScore,
        'Term Payment': s.termPaymentScore,
        'Commercial Avg': Math.round(s.commercialPotentialAvg * 100) / 100,
        'Commercial Wtd': Math.round(s.commercialPotentialWeighted * 100) / 100,
        'Legal': s.legalScore,
        'Background': s.backgroundScore,
        'Reference': s.referenceScore,
        'Credibility Avg': Math.round(s.credibilityAvg * 100) / 100,
        'Credibility Wtd': Math.round(s.credibilityWeighted * 100) / 100,
        'Technical': s.technicalScore,
        'Decision Speed': s.decisionSpeedScore,
        'Technical Avg': Math.round(s.technicalClarityAvg * 100) / 100,
        'Technical Wtd': Math.round(s.technicalClarityWeighted * 100) / 100,
        'Total Score': Math.round(s.totalScore * 100) / 100,
        'Level': s.level.replace('_', ' '),
        'Notes': a.notes || '',
      });
    });
  });

  if (newRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(newRows);
    ws2['!cols'] = Array(20).fill({ wch: 14 });
    ws2['!cols'][0] = { wch: 28 };
    ws2['!cols'][1] = { wch: 22 };
    ws2['!cols'][19] = { wch: 30 };
    XLSX.utils.book_append_sheet(wb, ws2, 'New Assessments');
  }

  // ====== Sheet 3: Repeated Assessments ======
  const repRows: Record<string, string | number>[] = [];
  companies.forEach((c) => {
    c.repeatedAssessments.forEach((a) => {
      const s = a.scores;
      repRows.push({
        'Company': c.companyName,
        'Project': a.projectName,
        'Date': a.date,
        'Period Start': a.periodStart,
        'Period End': a.periodEnd,
        'Kontribusi Omset': s.kontribusiOmsetScore,
        'Margin': s.marginScore,
        'Revenue Avg': Math.round(s.revenueAvg * 100) / 100,
        'Revenue Wtd': Math.round(s.revenueWeighted * 100) / 100,
        'Ketepatan Bayar': s.ketepatanBayarScore,
        'Revisi Invoice': s.revisiInvoiceScore,
        'Penagihan': s.penagihanScore,
        'Payment Avg': Math.round(s.paymentAvg * 100) / 100,
        'Payment Wtd': Math.round(s.paymentWeighted * 100) / 100,
        'Cancel Order': s.cancelOrderScore,
        'Schedule Var': s.scheduleVarianceScore,
        'Konflik QC': s.konflikQCScore,
        'Intervensi': s.intervensiScore,
        'Operational Avg': Math.round(s.operationalAvg * 100) / 100,
        'Operational Wtd': Math.round(s.operationalWeighted * 100) / 100,
        'Komunikasi': s.komunikasiScore,
        'Claim': s.claimScore,
        'Relationship Avg': Math.round(s.relationshipAvg * 100) / 100,
        'Relationship Wtd': Math.round(s.relationshipWeighted * 100) / 100,
        'Lama Kerjasama': s.lamaKerjasamaScore,
        'Fleet Size': s.fleetScore,
        'Referral': s.referralScore,
        'Value Avg': Math.round(s.valueAvg * 100) / 100,
        'Value Wtd': Math.round(s.valueWeighted * 100) / 100,
        'Total Score': Math.round(s.totalScore * 100) / 100,
        'Level': s.level.replace('_', ' '),
        'Notes': a.notes || '',
      });
    });
  });

  if (repRows.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(repRows);
    ws3['!cols'] = Array(32).fill({ wch: 13 });
    ws3['!cols'][0] = { wch: 28 };
    ws3['!cols'][1] = { wch: 22 };
    ws3['!cols'][31] = { wch: 30 };
    XLSX.utils.book_append_sheet(wb, ws3, 'Repeated Assessments');
  }

  XLSX.writeFile(wb, `ScoreHub_DataMaster_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
