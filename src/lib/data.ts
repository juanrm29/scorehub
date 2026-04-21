import { Company, ClientMaster } from './types';
import { calculateNewCustomer, calculateRepeatedCustomer } from './scoring';

// ==================== COMPANY DATA FROM CLIENT MASTER DATA ====================

function makeNewAssessment(id: string, date: string, project: string, input: Parameters<typeof calculateNewCustomer>[0], notes?: string) {
  const scores = calculateNewCustomer(input);
  return { id, date, projectName: project, input, scores, notes };
}

function makeRepAssessment(id: string, date: string, project: string, pStart: string, pEnd: string, input: Parameters<typeof calculateRepeatedCustomer>[0], notes?: string) {
  const scores = calculateRepeatedCustomer(input);
  return { id, date, projectName: project, periodStart: pStart, periodEnd: pEnd, input, scores, notes };
}

const baseInput = { companyName: '', contactPerson: '', email: '', phone: '', location: '' };

export const companies: Company[] = [
  {
    id: '1', companyName: 'PT. LAJU DINAMIKA UTAMA', contactPerson: 'Mr. IWAN',
    email: 'iwan_gunawan@lajudinamika.com', phone: '08112619711',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 50, industry: 'Maritime Services',
    registeredDate: '2024-01-01',
    newAssessments: [
      makeNewAssessment('n1-1', '2024-01-15', 'BG. UTAMA C 01', {
        ...baseInput, fleetSize: 50, estimatedValue: 25_000_000, termPayment: 7,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r1-1', '2024-01-15', 'Rampdoor LDU', '2023-07', '2024-01', {
        ...baseInput, kontribusiOmset: 0.4, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-2', '2024-05-15', 'BG. UTAMA C 01', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.3, margin: 47.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-3', '2024-05-15', 'TB. LAJU 2', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.9, margin: 51.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 3, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-4', '2024-05-15', 'BG. UTAMA 2', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 9.1, margin: 27.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 4, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-5', '2024-11-15', 'TB. LAJU 3', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 1.2, margin: 42.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-6', '2024-11-15', 'BG. UTAMA 3', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 1.8, margin: 31.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-7', '2025-01-15', 'SPOB. SP I BSI', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 0.4, margin: 41.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-8', '2025-05-15', 'BG. UTAMA 1', '2024-11', '2025-05', {
        ...baseInput, kontribusiOmset: 1.9, margin: 44.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-9', '2025-06-15', 'TB. LAJU 1', '2024-12', '2025-06', {
        ...baseInput, kontribusiOmset: 1.4, margin: 32.7, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r1-10', '2026-11-15', 'TB. LAJU 2', '2026-05', '2026-11', {
        ...baseInput, kontribusiOmset: 0.1, margin: 64.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 50, hasReferral: true,
      }),
    ],
    lastDealDate: '2026-11-15',
  },
  {
    id: '2', companyName: 'PT. WHS GLOBAL MANDIRI', contactPerson: 'Mr. NASIKIN',
    email: 'nasikin@sanlemakmur.com', phone: '081196905253',
    location: 'Jakarta Pusat, DKI Jakarta', fleetSize: 50, industry: 'Maritime Services',
    registeredDate: '2024-01-01',
    newAssessments: [
      makeNewAssessment('n2-1', '2024-01-15', 'TB. SANLE 20', {
        ...baseInput, fleetSize: 50, estimatedValue: 550_000_000, termPayment: 14,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r2-1', '2024-04-15', 'BG. PB 3020', '2023-10', '2024-04', {
        ...baseInput, kontribusiOmset: 0.3, margin: 8.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 1, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r2-2', '2024-06-15', 'TB. WGM 207', '2023-12', '2024-06', {
        ...baseInput, kontribusiOmset: 0.6, margin: 14.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 2, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r2-3', '2024-06-15', 'BG. TGH 2501', '2023-12', '2024-06', {
        ...baseInput, kontribusiOmset: 1.0, margin: 18.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 3, fleetSize: 50, hasReferral: true,
      }),
      makeRepAssessment('r2-4', '2025-08-15', 'BG. PB 3106', '2025-02', '2025-08', {
        ...baseInput, kontribusiOmset: 0.2, margin: 46.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 4, fleetSize: 50, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-08-15',
  },
  {
    id: '3', companyName: 'PT. ECOTRANS SAMUDERA', contactPerson: 'Mr. Obaja',
    email: 'obaja_s@ecotransgrup.com', phone: '-',
    location: 'Tangerang Banten', fleetSize: 4, industry: 'Maritime Services',
    registeredDate: '2024-01-01',
    newAssessments: [
      makeNewAssessment('n3-1', '2024-01-15', 'BG. SS 2302', {
        ...baseInput, fleetSize: 4, estimatedValue: 1_321_686_000, termPayment: 14,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r3-1', '2024-04-15', 'TB. ELIZABETH 2T', '2023-10', '2024-04', {
        ...baseInput, kontribusiOmset: 0.3, margin: 55.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 4, hasReferral: false,
      }),
      makeRepAssessment('r3-2', '2024-05-15', 'BG. SS 2303', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 2.0, margin: 22.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 2, fleetSize: 4, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-05-15',
  },
  {
    id: '4', companyName: 'PT. PANGGANG LESTARI JAYA', contactPerson: 'Mr. David',
    email: '-', phone: '08125623112',
    location: 'Banjarmasin, Kalimantan Selatan', fleetSize: 16, industry: 'Maritime Services',
    registeredDate: '2024-01-01',
    newAssessments: [
      makeNewAssessment('n4-1', '2024-01-15', 'BG. ADIPUTRA PASIFIC 88', {
        ...baseInput, fleetSize: 16, estimatedValue: 1_530_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r4-1', '2024-05-15', 'BG. KENCANA SANJAYA', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.4, margin: 23.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 1, fleetSize: 16, hasReferral: false,
      }),
      makeRepAssessment('r4-2', '2024-07-15', 'BG. ADIPUTRA PASIFIC', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.3, margin: 17.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 2, fleetSize: 16, hasReferral: false,
      }),
      makeRepAssessment('r4-3', '2024-07-15', 'TB. KENCANA MAKMUR', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.4, margin: 27.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 16, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-07-15',
  },
  {
    id: '5', companyName: 'PT. MERANTI KARYA SAMUDERA', contactPerson: 'Mr. Baramulia',
    email: 'baramulia.meranti@gmail.com', phone: '082148957612',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2024-02-01',
    newAssessments: [
      makeNewAssessment('n5-1', '2024-02-15', 'BG. KALTIM FT 3301', {
        ...baseInput, fleetSize: 6, estimatedValue: 7_500_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r5-1', '2024-02-15', 'BG. SUMBER JAYA 58', '2023-08', '2024-02', {
        ...baseInput, kontribusiOmset: 0.0, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 1, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-2', '2024-02-15', 'TB. ASL PROGRESS', '2023-08', '2024-02', {
        ...baseInput, kontribusiOmset: 0.0, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 2, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-3', '2024-04-15', 'TB. ASL PROGRESS &  TB. BILITON 11', '2023-10', '2024-04', {
        ...baseInput, kontribusiOmset: 0.1, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 3, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-4', '2024-07-15', 'LCT. MERANTI 706', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.3, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 4, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-5', '2024-10-15', 'BG. SUMBER JAYA 58', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 0.1, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-6', '2024-10-15', 'LCT. MERANTI 702', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 0.9, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-7', '2024-12-15', 'BG. SUMBER JAYA 58', '2024-06', '2024-12', {
        ...baseInput, kontribusiOmset: 0.1, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r5-8', '2025-02-15', 'BG. KALTIM FT 3301', '2024-08', '2025-02', {
        ...baseInput, kontribusiOmset: 0.3, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 6, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-02-15',
  },
  {
    id: '6', companyName: 'PT. HUMPUSS TRANSPORTASI CURAH Tbk.', contactPerson: 'Mr. Eja',
    email: '-', phone: '081347636298',
    location: 'Jakarta Selatan, DKI Jakarta', fleetSize: 12, industry: 'Maritime Services',
    registeredDate: '2024-02-01',
    newAssessments: [
      makeNewAssessment('n6-1', '2024-02-15', 'TB. SEMAR TUJUHBELAS', {
        ...baseInput, fleetSize: 12, estimatedValue: 306_694_156, termPayment: 14,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r6-1', '2024-02-15', 'TB. SEMAR DELAPANBELAS', '2023-08', '2024-02', {
        ...baseInput, kontribusiOmset: 0.4, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 12, hasReferral: false,
      }),
      makeRepAssessment('r6-2', '2025-12-15', 'TB. SEMAR TUJUH BELAS', '2025-06', '2025-12', {
        ...baseInput, kontribusiOmset: 0.5, margin: 38.1, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 2, fleetSize: 12, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-12-15',
  },
  {
    id: '7', companyName: 'PT. BUANA MARITIM SEJAHTERA', contactPerson: 'Mr. Tommy',
    email: 'tommy@buanamaritim.com', phone: '081360692420',
    location: 'Jakarta Utara, DKI Jakarta', fleetSize: 40, industry: 'Maritime Services',
    registeredDate: '2024-02-01',
    newAssessments: [
      makeNewAssessment('n7-1', '2024-02-15', 'TB. BUANA MARITIM 7 & BG. BUANA JAYA 3007', {
        ...baseInput, fleetSize: 40, estimatedValue: 151_971_799, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r7-1', '2024-03-15', 'TB.  BUANA MARITIM 2', '2023-09', '2024-03', {
        ...baseInput, kontribusiOmset: 0.4, margin: 29.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-2', '2024-03-15', 'TB.  BUANA MARITIM 3', '2023-09', '2024-03', {
        ...baseInput, kontribusiOmset: 0.5, margin: 58.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-3', '2024-03-15', 'BG. BUANA JAYA 3002', '2023-09', '2024-03', {
        ...baseInput, kontribusiOmset: 1.5, margin: 17.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 3, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-4', '2024-03-15', 'BG. BUANA JAYA 3003', '2023-09', '2024-03', {
        ...baseInput, kontribusiOmset: 1.6, margin: 10.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 4, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-5', '2024-04-15', 'TB. BUANA MARITIM 6', '2023-10', '2024-04', {
        ...baseInput, kontribusiOmset: 0.4, margin: 59.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-6', '2024-05-15', 'BG. BUANA JAYA 3006', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 1.1, margin: 41.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-7', '2024-05-15', 'TB. BUANA MARITIM 5', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.4, margin: 52.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-8', '2024-05-15', 'BG. BUANA JAYA 3005', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 1.1, margin: 38.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-9', '2024-07-15', 'BG. BUANA JAYA 3003', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 4.8, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-10', '2025-03-15', 'TB. BUANA MARITIM IX', '2024-09', '2025-03', {
        ...baseInput, kontribusiOmset: 0.3, margin: 37.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-11', '2025-03-15', 'BG. BUANA JAYA 3009', '2024-09', '2025-03', {
        ...baseInput, kontribusiOmset: 1.9, margin: 14.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-12', '2025-03-15', 'BG. BUANA JAYA 3302', '2024-09', '2025-03', {
        ...baseInput, kontribusiOmset: 0.7, margin: 10.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r7-13', '2025-03-15', 'TB. BUANA FOREVER II', '2024-09', '2025-03', {
        ...baseInput, kontribusiOmset: 0.4, margin: 8.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-03-15',
  },
  {
    id: '8', companyName: 'PT. CBSP NUSANTARA MARINE', contactPerson: 'Mr. Rainer',
    email: '-', phone: '081243600050',
    location: 'Makassar, Sulawesi Selatan', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2024-02-01',
    newAssessments: [
      makeNewAssessment('n8-1', '2024-02-15', 'TB. BIRINGERE', {
        ...baseInput, fleetSize: 2, estimatedValue: 1_500_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r8-1', '2024-02-15', 'BG. TONASA LINE II', '2023-08', '2024-02', {
        ...baseInput, kontribusiOmset: 6.4, margin: 25.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 1, fleetSize: 2, hasReferral: false,
      }),
      makeRepAssessment('r8-2', '2024-06-15', 'BG. TONASA LINE II', '2023-12', '2024-06', {
        ...baseInput, kontribusiOmset: 1.3, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 2, fleetSize: 2, hasReferral: false,
      }),
      makeRepAssessment('r8-3', '2024-08-15', 'TB. BIRINGERE', '2024-02', '2024-08', {
        ...baseInput, kontribusiOmset: 0.7, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 2, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-08-15',
  },
  {
    id: '9', companyName: 'PT. SUBUR SAKTI', contactPerson: 'Mrs. Rahmi',
    email: '-', phone: '-',
    location: 'Makassar, Sulawesi Selatan', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2024-03-01',
    newAssessments: [
      makeNewAssessment('n9-1', '2024-03-15', 'MP. PULAU TUKUNG', {
        ...baseInput, fleetSize: 1, estimatedValue: 56_352_000, termPayment: 14,
        legalDocuments: '1,2', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '10', companyName: 'PT. PELAYARAN KENCANA PERMAI JAYA', contactPerson: 'Mr. Christian Darwinto',
    email: 'kencanapermaijaya@gmail.com', phone: '082143305598',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2024-03-01',
    newAssessments: [
      makeNewAssessment('n10-1', '2024-03-15', 'OB. PKPJ', {
        ...baseInput, fleetSize: 6, estimatedValue: 381_352_509, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r10-1', '2024-04-15', 'TB. PSL GLORIOUS', '2023-10', '2024-04', {
        ...baseInput, kontribusiOmset: 0.1, margin: 40.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r10-2', '2024-11-15', 'OB. SINERGI PERMAI 02', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 3.7, margin: 75.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r10-3', '2024-11-15', 'TB. PSL FRANK', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 0.0, margin: 15.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 1, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 3, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r10-4', '2025-01-15', 'TB. PSL GLORIOUS', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 0.4, margin: 50.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 4, fleetSize: 6, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-01-15',
  },
  {
    id: '11', companyName: 'PT. VARRO VAL INVESTAMA', contactPerson: 'Mr. Amir',
    email: '-', phone: '0811993219',
    location: 'Jakarta Pusat, DKI Jakarta', fleetSize: 10, industry: 'Maritime Services',
    registeredDate: '2024-03-01',
    newAssessments: [
      makeNewAssessment('n11-1', '2024-03-15', 'TB. MITRACATUR 3', {
        ...baseInput, fleetSize: 10, estimatedValue: 250_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r11-1', '2024-03-15', 'BG. MANDIRI 2', '2023-09', '2024-03', {
        ...baseInput, kontribusiOmset: 0.6, margin: 49.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 10, hasReferral: false,
      }),
      makeRepAssessment('r11-2', '2024-07-15', 'TB. MITRA CATUR 5', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.3, margin: 52.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 10, hasReferral: false,
      }),
      makeRepAssessment('r11-3', '2024-07-15', 'BG. MANDIRI 272', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.8, margin: 37.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 10, hasReferral: false,
      }),
      makeRepAssessment('r11-4', '2024-08-15', 'TB. MITRA CATUR 3', '2024-02', '2024-08', {
        ...baseInput, kontribusiOmset: 0.1, margin: 25.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 1, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 4, fleetSize: 10, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-08-15',
  },
  {
    id: '12', companyName: 'PT. CASTBAY MARINE', contactPerson: 'Mr. Heriadi',
    email: '-', phone: '-',
    location: 'Jakarta Pusat, DKI Jakarta', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2024-04-01',
    newAssessments: [
      makeNewAssessment('n12-1', '2024-04-15', 'TB. OCEAN ALPHA', {
        ...baseInput, fleetSize: 1, estimatedValue: 160_000_000, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '13', companyName: 'PT. KARYA MARITIM INDONESIA', contactPerson: 'Mr. Syarif Buana',
    email: '-', phone: '082148674444',
    location: 'Banyuwangi, Jawa Timur', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2024-04-01',
    newAssessments: [
      makeNewAssessment('n13-1', '2024-04-15', 'BG. BOX ENAM', {
        ...baseInput, fleetSize: 1, estimatedValue: 27_000_000, termPayment: 7,
        legalDocuments: '1,2', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '14', companyName: 'PT. KARUNIA LINTAS SAMUDERA', contactPerson: 'Mrs. Rita',
    email: 'pt.karunia_lintassamudra@yahoo.co.id', phone: '081347832096',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 40, industry: 'Maritime Services',
    registeredDate: '2024-05-01',
    newAssessments: [
      makeNewAssessment('n14-1', '2024-05-15', 'BG. ASIA PRIDE 23167', {
        ...baseInput, fleetSize: 40, estimatedValue: 750_000_000, termPayment: 30,
        legalDocuments: '1,2,3,4', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r14-1', '2024-05-15', 'TB. KARUNIA SAMUDRA 8', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.4, margin: 41.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-2', '2024-06-15', 'BG. BAIDURI 30382', '2023-12', '2024-06', {
        ...baseInput, kontribusiOmset: 2.2, margin: 1.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 2, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-3', '2024-06-15', 'TB. ASL APEX', '2023-12', '2024-06', {
        ...baseInput, kontribusiOmset: 0.5, margin: 39.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-4', '2024-07-15', 'BG. ASL 56', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 1.2, margin: 4.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 4, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-5', '2024-07-15', 'TB. MAWAR 5', '2024-01', '2024-07', {
        ...baseInput, kontribusiOmset: 0.4, margin: 33.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-6', '2024-08-15', 'BG. ASIAPRIDE 23180', '2024-02', '2024-08', {
        ...baseInput, kontribusiOmset: 0.5, margin: 1.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-7', '2024-10-15', 'TB. SYUKUR 35', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 1.1, margin: 1.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-8', '2024-10-15', 'BG. SYUKUR 5', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 3.1, margin: 5.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-9', '2025-01-15', 'BG. HERLIN 5', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 3.2, margin: 24.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-10', '2025-02-15', 'BG. ASIA PRIDE 23175', '2024-08', '2025-02', {
        ...baseInput, kontribusiOmset: 3.2, margin: 9.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
      makeRepAssessment('r14-11', '2025-03-15', 'TB. SYUKUR 33', '2024-09', '2025-03', {
        ...baseInput, kontribusiOmset: 0.1, margin: 61.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 40, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-03-15',
  },
  {
    id: '15', companyName: 'PT. MERANTI ANGGUN SAMUDERA', contactPerson: 'Mr. Wimba Prambada',
    email: 'wimba.meranti@gmail.com', phone: '08118099999',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2024-05-01',
    newAssessments: [
      makeNewAssessment('n15-1', '2024-05-15', 'BG. BUNGA PERTIWI', {
        ...baseInput, fleetSize: 6, estimatedValue: 3_760_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r15-1', '2024-05-15', 'BG. NEXUS 11', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 10.2, margin: 21.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 1, fleetSize: 6, hasReferral: false,
      }),
      makeRepAssessment('r15-2', '2024-05-15', 'TB. KARYA AGUNG IX', '2023-11', '2024-05', {
        ...baseInput, kontribusiOmset: 0.4, margin: 47.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 6, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-05-15',
  },
  {
    id: '16', companyName: 'PT. PELAYARAN ANGKUTAN LAUT BAHTERA VICTORY SHIPPING', contactPerson: 'Mr. Tommy',
    email: '-', phone: '-',
    location: 'BINTAN', fleetSize: 10, industry: 'Maritime Services',
    registeredDate: '2024-05-01',
    newAssessments: [
      makeNewAssessment('n16-1', '2024-05-15', 'BG. BVS', {
        ...baseInput, fleetSize: 10, estimatedValue: 31_488_442, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '17', companyName: 'PT. MORO CITRA SAMUDRA', contactPerson: 'Mr. Youngky',
    email: 'raynirwan@yahoo.com,pt.brmmarine@yahoo.com', phone: '081995558883',
    location: 'Batam, LubukBaja', fleetSize: 10, industry: 'Maritime Services',
    registeredDate: '2024-06-01',
    newAssessments: [
      makeNewAssessment('n17-1', '2024-06-15', 'BG. SAMUDRA V', {
        ...baseInput, fleetSize: 10, estimatedValue: 650_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r17-1', '2024-09-15', 'TB. OCEAN VENTURE II', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.4, margin: 40.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 10, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-09-15',
  },
  {
    id: '18', companyName: 'PT. KASAU SINAR SAMUDERA', contactPerson: 'Mrs. Sarah',
    email: '-', phone: '081347203080',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 4, industry: 'Maritime Services',
    registeredDate: '2024-07-01',
    newAssessments: [
      makeNewAssessment('n18-1', '2024-07-15', 'TB. FADLUN 99-09', {
        ...baseInput, fleetSize: 4, estimatedValue: 265_822_658, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '19', companyName: 'PT. BERJAYA SAMUDERA INDONESIA', contactPerson: 'Mr. IWAN',
    email: 'iwan_gunawan@lajudinamika.com', phone: '08112619711',
    location: 'Dumai, Riau', fleetSize: 3, industry: 'Maritime Services',
    registeredDate: '2024-07-01',
    newAssessments: [
      makeNewAssessment('n19-1', '2024-07-15', 'SPOB. SP 1 BSI', {
        ...baseInput, fleetSize: 3, estimatedValue: 896_317_603, termPayment: 30,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '20', companyName: 'KANTOR KSOP BALIKPAPAN', contactPerson: '_',
    email: '-', phone: '-',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 51, industry: 'Maritime Services',
    registeredDate: '2024-07-01',
    newAssessments: [
      makeNewAssessment('n20-1', '2024-07-15', 'KN.P 497', {
        ...baseInput, fleetSize: 51, estimatedValue: 96_624_000, termPayment: 14,
        legalDocuments: '', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '21', companyName: 'PT. PELAYARAN SUKSES HASIL BAHARI. PONTIANAK', contactPerson: 'Mr. Thomas',
    email: '0', phone: '08568778199',
    location: 'Pontianak, Kalimantan Barat', fleetSize: 10, industry: 'Maritime Services',
    registeredDate: '2024-08-01',
    newAssessments: [
      makeNewAssessment('n21-1', '2024-08-15', 'BG. TIGA JAYA 2728', {
        ...baseInput, fleetSize: 10, estimatedValue: 450_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '22', companyName: 'PT. BRM MARINE', contactPerson: 'Mr. RAYMOND, Mr. EKO',
    email: 'raynirwan@yahoo.com,pt.brmmarine@yahoo.com', phone: '08215857843',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 44, industry: 'Maritime Services',
    registeredDate: '2024-08-01',
    newAssessments: [
      makeNewAssessment('n22-1', '2024-08-15', 'BG. BRM 16', {
        ...baseInput, fleetSize: 44, estimatedValue: 1_392_505_274, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r22-1', '2024-09-15', 'BG. BRM 06', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 1.0, margin: 11.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 1, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-2', '2024-09-15', 'TB. BRM 01', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.0, margin: 60.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-3', '2024-09-15', 'TB. BRM 05', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.6, margin: 33.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-4', '2025-01-15', 'TB. AZIZAH', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 0.8, margin: 35.2, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 4, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-5', '2025-01-15', 'TB. BRM 15', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 0.9, margin: 53.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-6', '2026-03-15', 'TB. BRM 01', '2025-09', '2026-03', {
        ...baseInput, kontribusiOmset: 0.7, margin: 37.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-7', '2025-04-15', 'BG. HELLY', '2024-10', '2025-04', {
        ...baseInput, kontribusiOmset: 1.8, margin: 30.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-8', '2025-06-15', 'TB. BRM 07', '2024-12', '2025-06', {
        ...baseInput, kontribusiOmset: 0.8, margin: 52.9, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-9', '2025-06-15', 'BG. BRM 08', '2024-12', '2025-06', {
        ...baseInput, kontribusiOmset: 1.4, margin: 47.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-10', '2025-08-15', 'TB. BRM 17', '2025-02', '2025-08', {
        ...baseInput, kontribusiOmset: 0.9, margin: 53.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-11', '2025-08-15', 'BG. BRM 18', '2025-02', '2025-08', {
        ...baseInput, kontribusiOmset: 2.4, margin: 37.2, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-12', '2025-08-15', 'TB. BRM 11', '2025-02', '2025-08', {
        ...baseInput, kontribusiOmset: 0.6, margin: 47.4, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
      makeRepAssessment('r22-13', '2025-08-15', 'BG. BRM 12', '2025-02', '2025-08', {
        ...baseInput, kontribusiOmset: 1.2, margin: 41.2, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 5, fleetSize: 44, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-08-15',
  },
  {
    id: '23', companyName: 'PT. SERASI LOGISTICS INDONESIA', contactPerson: 'Mr. Henry',
    email: 'henry.dharmawan@sera.astra.co.id', phone: '085157715930',
    location: 'Jakarta Utara, DKI Jakarta', fleetSize: 20, industry: 'Maritime Services',
    registeredDate: '2024-09-01',
    newAssessments: [
      makeNewAssessment('n23-1', '2024-09-15', 'TB. SERASI VI', {
        ...baseInput, fleetSize: 20, estimatedValue: 339_508_660, termPayment: 30,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r23-1', '2024-09-15', 'OB. SERASI VII', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.6, margin: 33.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 20, hasReferral: true,
      }),
      makeRepAssessment('r23-2', '2025-04-15', 'LCT. SERASI IX', '2024-10', '2025-04', {
        ...baseInput, kontribusiOmset: 1.0, margin: 34.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 2, fleetSize: 20, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-04-15',
  },
  {
    id: '24', companyName: 'PT. PELAYARAN INTAN', contactPerson: 'Mr. Wito',
    email: 'pelayaran_intan@yahoo.com', phone: '082345567189',
    location: 'Pontianak, Kalimantan Barat', fleetSize: 20, industry: 'Maritime Services',
    registeredDate: '2024-09-01',
    newAssessments: [
      makeNewAssessment('n24-1', '2024-09-15', 'TB. WALES', {
        ...baseInput, fleetSize: 20, estimatedValue: 755_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r24-1', '2024-09-15', 'OB. MUDAH I', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.7, margin: 48.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 20, hasReferral: true,
      }),
      makeRepAssessment('r24-2', '2024-10-15', 'OB. MUDAH I', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 0.1, margin: 48.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 2, fleetSize: 20, hasReferral: true,
      }),
      makeRepAssessment('r24-3', '2025-07-15', 'TB. AS STAR 5', '2025-01', '2025-07', {
        ...baseInput, kontribusiOmset: 0.6, margin: 29.6, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 3, fleetSize: 20, hasReferral: true,
      }),
      makeRepAssessment('r24-4', '2025-07-15', 'OB. AS STAR 7', '2025-01', '2025-07', {
        ...baseInput, kontribusiOmset: 0.7, margin: 29.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 4, fleetSize: 20, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-07-15',
  },
  {
    id: '25', companyName: 'PT. SAMUDERA PRIMA SENTOSA', contactPerson: 'Mr. Wito',
    email: 'pelayaran_intan@yahoo.com', phone: '082345567189',
    location: 'Pontianak, Kalimantan Barat', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2024-09-01',
    newAssessments: [
      makeNewAssessment('n25-1', '2024-09-15', 'TB. AS JAYA 15', {
        ...baseInput, fleetSize: 2, estimatedValue: 160_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r25-1', '2024-09-15', 'OB. AS GLORY 20', '2024-03', '2024-09', {
        ...baseInput, kontribusiOmset: 0.1, margin: 47.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 2, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-09-15',
  },
  {
    id: '26', companyName: 'PT. ARGHANIAGA PANCATUNGGAL', contactPerson: 'Mrs. Mega',
    email: '-', phone: '081389643511',
    location: 'Tangerang, Banten', fleetSize: 20, industry: 'Maritime Services',
    registeredDate: '2024-09-01',
    newAssessments: [
      makeNewAssessment('n26-1', '2024-09-15', 'SPOB. KM SML 9', {
        ...baseInput, fleetSize: 20, estimatedValue: 1_650_000_000, termPayment: 30,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '27', companyName: 'PT. MUJI LINES', contactPerson: 'Mr. Catur',
    email: '-', phone: '081210796478',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2024-10-01',
    newAssessments: [
      makeNewAssessment('n27-1', '2024-10-15', 'KFT-2', {
        ...baseInput, fleetSize: 6, estimatedValue: 89_865_000, termPayment: 7,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '28', companyName: 'PT. PRIMATAMA JAYA ABADI', contactPerson: 'Mr. IWAN',
    email: '-', phone: '-',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2024-10-01',
    newAssessments: [
      makeNewAssessment('n28-1', '2024-10-15', 'CB. KINABALU', {
        ...baseInput, fleetSize: 1, estimatedValue: 8_000_000, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '29', companyName: 'PT. DIAN CIPTAMAS AGUNG', contactPerson: 'Mr. Harjo',
    email: 'harjo.sulistyawan@ptdca.co.id', phone: '081288642404',
    location: 'Jakarta Pusat, DKI Jakarta', fleetSize: 30, industry: 'Maritime Services',
    registeredDate: '2024-10-01',
    newAssessments: [
      makeNewAssessment('n29-1', '2024-10-15', 'TB. BINTANG 2002', {
        ...baseInput, fleetSize: 30, estimatedValue: 1_370_000_000, termPayment: 30,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r29-1', '2024-10-15', 'BG. SOEKAWATI 909', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 5.5, margin: 9.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 1, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-2', '2024-11-15', 'TB. PERKASA 3', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 1.5, margin: 18.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 2, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-3', '2024-11-15', 'BG. PSPM 3', '2024-05', '2024-11', {
        ...baseInput, kontribusiOmset: 8.4, margin: 10.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 3, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-4', '2025-01-15', 'TB. PERKASA 12', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 1.0, margin: 19.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 4, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-5', '2025-01-15', 'BG. PSPM 12', '2024-07', '2025-01', {
        ...baseInput, kontribusiOmset: 14.8, margin: 12.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-6', '2024-10-15', 'BG. PSPM 3', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 13.3, margin: 10.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-7', '2024-10-15', 'TB. PERKASA 3', '2024-04', '2024-10', {
        ...baseInput, kontribusiOmset: 1.7, margin: 18.6, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 5, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-8', '2025-11-15', 'TB. BERAU 21', '2025-05', '2025-11', {
        ...baseInput, kontribusiOmset: 1.0, margin: 25.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 5, fleetSize: 30, hasReferral: true,
      }),
      makeRepAssessment('r29-9', '2025-11-15', 'BG. PSPM 21', '2025-05', '2025-11', {
        ...baseInput, kontribusiOmset: 11.1, margin: 12.9, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 3, cancelOrder: 0, scheduleVariance: 3, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'K', claimCount: 1, lamaKerjasama: 5, fleetSize: 30, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-11-15',
  },
  {
    id: '30', companyName: 'PT. Andesit Karya Bersama', contactPerson: 'Mr. Yanuar',
    email: '-', phone: '081211399994',
    location: 'Palu, Sulawesi Tengah', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2024-10-01',
    newAssessments: [
      makeNewAssessment('n30-1', '2024-10-15', 'BG. MEGA TRANS VIII', {
        ...baseInput, fleetSize: 2, estimatedValue: 53_945_547, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '31', companyName: 'PT. DAVIDI INTERNATIONAL', contactPerson: 'Mr. Murdianto',
    email: '-', phone: '085247534377',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2024-10-01',
    newAssessments: [
      makeNewAssessment('n31-1', '2024-10-15', 'CB. DP03', {
        ...baseInput, fleetSize: 2, estimatedValue: 55_550_000, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '32', companyName: 'PT. CITRA MARITIME', contactPerson: 'Mr. Imam Maulana',
    email: '-', phone: '089518890536',
    location: 'Batam, Riau', fleetSize: 50, industry: 'Maritime Services',
    registeredDate: '2024-11-01',
    newAssessments: [
      makeNewAssessment('n32-1', '2024-11-15', 'TB. CITRA 52', {
        ...baseInput, fleetSize: 50, estimatedValue: 773_106_402, termPayment: 30,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r32-1', '2024-12-15', 'OB. CITRA 30001', '2024-06', '2024-12', {
        ...baseInput, kontribusiOmset: 1.5, margin: 27.0, ketepatanBayarHari: 7, revisiInvoice: 1,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 50, hasReferral: true,
      }),
    ],
    lastDealDate: '2024-12-15',
  },
  {
    id: '33', companyName: 'PT QUADRA SAMUDRA PERKASA', contactPerson: 'Mr. Utomo',
    email: '-', phone: '08115403456',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 10, industry: 'Maritime Services',
    registeredDate: '2024-12-01',
    newAssessments: [
      makeNewAssessment('n33-1', '2024-12-15', 'TB. MODALWAN 16107', {
        ...baseInput, fleetSize: 10, estimatedValue: 125_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r33-1', '2024-12-15', 'OB. OCEANBAY 23238', '2024-06', '2024-12', {
        ...baseInput, kontribusiOmset: 0.8, margin: 40.0, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 1, fleetSize: 10, hasReferral: false,
      }),
    ],
    lastDealDate: '2024-12-15',
  },
  {
    id: '34', companyName: 'PT. KENCANA MURIA JAYA', contactPerson: 'Mr. James Marcel',
    email: '-', phone: '085224857025',
    location: 'Kudus, Jawa Tengah', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2024-12-01',
    newAssessments: [
      makeNewAssessment('n34-1', '2024-12-15', 'TB. AMIN 01', {
        ...baseInput, fleetSize: 6, estimatedValue: 1_808_826_174, termPayment: 30,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '35', companyName: 'PT. SURYA MARITIM SHIPPINDO', contactPerson: 'Mr. Henry',
    email: '-', phone: '-',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2024-12-01',
    newAssessments: [
      makeNewAssessment('n35-1', '2024-12-15', 'TB. GOODWILL', {
        ...baseInput, fleetSize: 1, estimatedValue: 111_400_000, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '36', companyName: 'PT. PELAYARAN SEGARA NIAGA UTAMA', contactPerson: 'Mr. Catur',
    email: '-', phone: '081210796478',
    location: 'Jakarta Selatan, DKI Jakarta', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2025-01-01',
    newAssessments: [
      makeNewAssessment('n36-1', '2025-01-15', 'AWB. MAJULAH NO.1', {
        ...baseInput, fleetSize: 6, estimatedValue: 1_640_978_670, termPayment: 14,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '37', companyName: 'PT. ARTHA GRAHA SAMUDERA', contactPerson: 'Mr. Hendra',
    email: '-', phone: '081931603292',
    location: 'Surabaya, Jawa Timur', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2025-01-01',
    newAssessments: [
      makeNewAssessment('n37-1', '2025-01-15', 'BG.  NIKO I', {
        ...baseInput, fleetSize: 2, estimatedValue: 400_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '38', companyName: 'PT. ALORINDA SHIPPING', contactPerson: 'Mrs. Sarah',
    email: '-', phone: '081347203080',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 4, industry: 'Maritime Services',
    registeredDate: '2025-01-01',
    newAssessments: [
      makeNewAssessment('n38-1', '2025-01-15', 'BG. THOSAN 08', {
        ...baseInput, fleetSize: 4, estimatedValue: 301_840_133, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '39', companyName: 'PT. HERLIN SAMUDRA LINE', contactPerson: 'Mr. Karnadi',
    email: 'pthsl.smd@gmail.com', phone: '081347000133',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2025-04-01',
    newAssessments: [
      makeNewAssessment('n39-1', '2025-04-15', 'TB. HERLIN 27', {
        ...baseInput, fleetSize: 6, estimatedValue: 442_094_773, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r39-1', '2025-07-15', 'TB. HERLIN 18', '2025-01', '2025-07', {
        ...baseInput, kontribusiOmset: 0.6, margin: 41.1, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 6, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-07-15',
  },
  {
    id: '40', companyName: 'PT. WIRA ARIANDI UTAMA', contactPerson: 'Mr. Imam',
    email: 'imam.wau@gmail.com', phone: '081226748636',
    location: 'Berau, Kalimantan Timur', fleetSize: 24, industry: 'Maritime Services',
    registeredDate: '2025-04-01',
    newAssessments: [
      makeNewAssessment('n40-1', '2025-04-15', 'SPOB. WIRANDI X', {
        ...baseInput, fleetSize: 24, estimatedValue: 1_120_000_000, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r40-1', '2025-12-15', 'TB. DL 25', '2025-06', '2025-12', {
        ...baseInput, kontribusiOmset: 1.4, margin: 42.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 24, hasReferral: true,
      }),
      makeRepAssessment('r40-2', '2025-12-15', 'OB. PKPJ II', '2025-06', '2025-12', {
        ...baseInput, kontribusiOmset: 2.1, margin: 30.4, ketepatanBayarHari: 5, revisiInvoice: 1,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'B', claimCount: 0, lamaKerjasama: 2, fleetSize: 24, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-12-15',
  },
  {
    id: '41', companyName: 'PT. NIRMALA PATRANUSA', contactPerson: 'Mr. Catur',
    email: '-', phone: '081210796478',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 6, industry: 'Maritime Services',
    registeredDate: '2025-05-01',
    newAssessments: [
      makeNewAssessment('n41-1', '2025-05-15', 'AWB. ADMIRAYLTY 3', {
        ...baseInput, fleetSize: 6, estimatedValue: 1_253_354_525, termPayment: 14,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '42', companyName: 'PT. ATLANTIC EXPRESS LINE', contactPerson: 'Mr. Fauzan',
    email: '-', phone: '085250056661',
    location: 'Banjar Baru, Kalimantan Selatan', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2025-05-01',
    newAssessments: [
      makeNewAssessment('n42-1', '2025-05-15', 'BG. SOEKAWATI 2711', {
        ...baseInput, fleetSize: 2, estimatedValue: 1_700_000_000, termPayment: 30,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r42-1', '2025-05-15', 'TB. HARLINA 6', '2024-11', '2025-05', {
        ...baseInput, kontribusiOmset: 0.2, margin: 56.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 2, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-05-15',
  },
  {
    id: '43', companyName: 'PT. BAHAR RUAN SEJAHTERA', contactPerson: 'Mr. Halim',
    email: '-', phone: '0811741199',
    location: 'Jakarta Utara, DKI Jakarta', fleetSize: 16, industry: 'Maritime Services',
    registeredDate: '2025-06-01',
    newAssessments: [
      makeNewAssessment('n43-1', '2025-06-15', 'TB. ANUGRAH 11', {
        ...baseInput, fleetSize: 16, estimatedValue: 449_156_504, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '44', companyName: 'PT. JAMBI ANUGERAH MANDIRI', contactPerson: 'Mr. Halim',
    email: '-', phone: '0811741199',
    location: 'Jakarta Utara, DKI Jakarta', fleetSize: 16, industry: 'Maritime Services',
    registeredDate: '2025-06-01',
    newAssessments: [
      makeNewAssessment('n44-1', '2025-06-15', 'OB. SENTOSA JAYA 2501', {
        ...baseInput, fleetSize: 16, estimatedValue: 572_283_614, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '45', companyName: 'PT. GEMA SOERYA SAMODRA', contactPerson: 'Mr. Teddy',
    email: '-', phone: '08115821221',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2025-05-01',
    newAssessments: [
      makeNewAssessment('n45-1', '2025-05-15', 'TB. EQUATOR 9', {
        ...baseInput, fleetSize: 2, estimatedValue: 600_000_000, termPayment: 30,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r45-1', '2025-05-15', 'BG. FINACIA 39', '2024-11', '2025-05', {
        ...baseInput, kontribusiOmset: 3.3, margin: 23.0, ketepatanBayarHari: 7, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 0,
        komunikasiPIC: 'C', claimCount: 0, lamaKerjasama: 1, fleetSize: 2, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-05-15',
  },
  {
    id: '46', companyName: 'PT. BALIKPAPAN FOREST INDUSTRIES', contactPerson: 'Mr. Faisal',
    email: '-', phone: '085751804056',
    location: 'Balikpapan, Kalimantan Timur', fleetSize: 8, industry: 'Maritime Services',
    registeredDate: '2025-07-01',
    newAssessments: [
      makeNewAssessment('n46-1', '2025-07-15', 'TB. ASSIKE SATU', {
        ...baseInput, fleetSize: 8, estimatedValue: 242_679_460, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '1', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r46-1', '2025-07-15', 'BG. ASSIKE 4001', '2025-01', '2025-07', {
        ...baseInput, kontribusiOmset: 0.4, margin: 41.0, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 1, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 8, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-07-15',
  },
  {
    id: '47', companyName: 'PT. JAYA TRANSPORT LAUT', contactPerson: 'Mr. Robert',
    email: '-', phone: '082220369986',
    location: 'Jakarta Utara, DKI Jakarta', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2025-07-01',
    newAssessments: [
      makeNewAssessment('n47-1', '2025-07-15', 'MV. JTL 001', {
        ...baseInput, fleetSize: 1, estimatedValue: 900_000_000, termPayment: 30,
        legalDocuments: '', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '48', companyName: 'PT. IMC PELITA LOGISTIK', contactPerson: 'Mr. Zul',
    email: 'zulkhaidir@imcpelitalog.com', phone: '08115575690',
    location: 'Samarinda, Kalimantan Timur', fleetSize: 50, industry: 'Maritime Services',
    registeredDate: '2025-07-01',
    newAssessments: [
      makeNewAssessment('n48-1', '2025-07-15', 'TB. INTAN MEGAH 4', {
        ...baseInput, fleetSize: 50, estimatedValue: 757_424_999, termPayment: 30,
        legalDocuments: '1,2,3,4,5', backgroundMedia: '1,2,3', hasReference: true,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r48-1', '2025-07-15', 'BG. INTAN KELANA 25', '2025-01', '2025-07', {
        ...baseInput, kontribusiOmset: 4.9, margin: 16.0, ketepatanBayarHari: 14, revisiInvoice: 2,
        penagihanCount: 2, cancelOrder: 0, scheduleVariance: 0, konflikQC: 1, intervensi: 1,
        komunikasiPIC: 'C', claimCount: 1, lamaKerjasama: 1, fleetSize: 50, hasReferral: true,
      }),
    ],
    lastDealDate: '2025-07-15',
  },
  {
    id: '49', companyName: 'PT. BAYU BUANA SUKSES', contactPerson: 'Mr. Bayu',
    email: '-', phone: '081347504888',
    location: 'Palu, Sulawesi Tengah', fleetSize: 4, industry: 'Maritime Services',
    registeredDate: '2025-07-01',
    newAssessments: [
      makeNewAssessment('n49-1', '2025-07-15', 'BG. VALENCIA', {
        ...baseInput, fleetSize: 4, estimatedValue: 679_113_842, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '50', companyName: 'PT. WIDMARINE JAYA LINE', contactPerson: 'Mr. Celvin',
    email: '-', phone: '082146667921',
    location: 'Surabaya, Jawa Timur', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2025-08-01',
    newAssessments: [
      makeNewAssessment('n50-1', '2025-08-15', 'TB. KTS XV', {
        ...baseInput, fleetSize: 2, estimatedValue: 398_492_524, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '51', companyName: 'PT. PELAYARAN LINTAS KHATULISTIWA', contactPerson: '-',
    email: '-', phone: '-',
    location: 'Kubu Raya, Kalimantan Barat', fleetSize: 51, industry: 'Maritime Services',
    registeredDate: '2025-08-01',
    newAssessments: [
      makeNewAssessment('n51-1', '2025-08-15', 'TB. LOTUS 01', {
        ...baseInput, fleetSize: 51, estimatedValue: 100_000_000, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '52', companyName: 'PT. PELAYARAN SAMUDERA LESTARI', contactPerson: 'Mr. Indra',
    email: '-', phone: '081385889868',
    location: 'Jakarta Barat, DKI Jakarta', fleetSize: 2, industry: 'Maritime Services',
    registeredDate: '2025-10-01',
    newAssessments: [
      makeNewAssessment('n52-1', '2025-10-15', 'TB. TRUST 17', {
        ...baseInput, fleetSize: 2, estimatedValue: 562_966_565, termPayment: 14,
        legalDocuments: '1,2,3', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 4,
      }),
    ],
    repeatedAssessments: [
      makeRepAssessment('r52-1', '2025-10-15', 'BG. PSL 271', '2025-04', '2025-10', {
        ...baseInput, kontribusiOmset: 1.0, margin: 44.8, ketepatanBayarHari: 5, revisiInvoice: 0,
        penagihanCount: 1, cancelOrder: 0, scheduleVariance: -2, konflikQC: 0, intervensi: 0,
        komunikasiPIC: 'SB', claimCount: 0, lamaKerjasama: 1, fleetSize: 2, hasReferral: false,
      }),
    ],
    lastDealDate: '2025-10-15',
  },
  {
    id: '53', companyName: 'PT. PELAYARAN PENSUMBA BAHARI', contactPerson: '-',
    email: '-', phone: '-',
    location: 'Tanjung Ucang, Batam', fleetSize: 1, industry: 'Maritime Services',
    registeredDate: '2026-09-01',
    newAssessments: [
      makeNewAssessment('n53-1', '2026-09-15', 'TB. GEMA I', {
        ...baseInput, fleetSize: 1, estimatedValue: 787_430_000, termPayment: 30,
        legalDocuments: '', backgroundMedia: '', hasReference: false,
        technicalDocuments: '1,2,3', decisionSpeed: 3,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
  {
    id: '54', companyName: 'PT. BINA MARITIM SEJATI', contactPerson: 'Mr. Fakhry',
    email: '-', phone: '082290141166',
    location: 'Jakarta Barat, DKI Jakarta', fleetSize: 40, industry: 'Maritime Services',
    registeredDate: '2025-11-01',
    newAssessments: [
      makeNewAssessment('n54-1', '2025-11-15', 'OB. BMS 001A', {
        ...baseInput, fleetSize: 40, estimatedValue: 49_042_818, termPayment: 7,
        legalDocuments: '1,2,3', backgroundMedia: '1,2', hasReference: true,
        technicalDocuments: '2,3', decisionSpeed: 5,
      }),
    ],
    repeatedAssessments: [],
    lastDealDate: null,
  },
];

// Legacy compat export
export const sampleClients: ClientMaster[] = companies.map(c => {
  const score = c.repeatedAssessments.length > 0
    ? c.repeatedAssessments[c.repeatedAssessments.length - 1].scores.totalScore
    : c.newAssessments.length > 0
    ? c.newAssessments[c.newAssessments.length - 1].scores.totalScore
    : 0;
  const level = score > 4 ? 'STRATEGIC' as const : score >= 3 ? 'PREFERRED' as const : score >= 2 ? 'REGULAR' as const : 'HIGH_RISK' as const;
  return {
    id: c.id, companyName: c.companyName, contactPerson: c.contactPerson,
    email: c.email, phone: c.phone, location: c.location,
    customerType: c.repeatedAssessments.length > 0 ? 'REPEATED' as const : 'NEW' as const,
    fleetSize: c.fleetSize, legalDocuments: '', technicalDocuments: '',
    vesselCount: c.newAssessments.length + c.repeatedAssessments.length,
    lastScore: score, level, createdAt: c.registeredDate,
    updatedAt: c.lastDealDate || c.registeredDate,
  };
});
