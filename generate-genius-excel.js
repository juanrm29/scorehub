const ExcelJS = require('exceljs');

async function createGeniusExcel() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'ScoreHub AI';
    wb.created = new Date();

    // 1. ENGINE SHEET (Hidden/Logic)
    const engine = wb.addWorksheet('ENGINE', { state: 'hidden' });
    
    // Weights
    engine.getCell('A1').value = 'NEW CUSTOMER WEIGHTS';
    engine.getCell('A2').value = 'Commercial'; engine.getCell('B2').value = 0.5;
    engine.getCell('A3').value = 'Credibility'; engine.getCell('B3').value = 0.3;
    engine.getCell('A4').value = 'Technical'; engine.getCell('B4').value = 0.2;

    engine.getCell('D1').value = 'REPEATED CUSTOMER WEIGHTS';
    engine.getCell('D2').value = 'Revenue'; engine.getCell('E2').value = 0.3;
    engine.getCell('D3').value = 'Payment'; engine.getCell('E3').value = 0.3;
    engine.getCell('D4').value = 'Operational'; engine.getCell('E4').value = 0.15;
    engine.getCell('D5').value = 'Relationship'; engine.getCell('E5').value = 0.15;
    engine.getCell('D6').value = 'Value'; engine.getCell('E6').value = 0.1;

    // Mapping Lists for Dropdowns
    engine.getCell('A10').value = 'Term Payment Options';
    const termOpts = ['≤14 Hari (Kontrak)', '≤30 Hari (SPK/PO)', '≤45 Hari (Quotation)', '≤60 Hari', '>60 Hari'];
    termOpts.forEach((o, i) => { engine.getCell(`A${11+i}`).value = o; engine.getCell(`B${11+i}`).value = 5-i; });

    engine.getCell('D10').value = 'Decision Speed Options';
    const decOpts = ['≤2 Hari', '3-5 Hari', '5-7 Hari', '7-14 Hari', '>14 Hari'];
    decOpts.forEach((o, i) => { engine.getCell(`D${11+i}`).value = o; engine.getCell(`E${11+i}`).value = 5-i; });

    engine.getCell('G10').value = 'Yes/No Options';
    engine.getCell('G11').value = 'Ya'; engine.getCell('H11').value = 5;
    engine.getCell('G12').value = 'Tidak'; engine.getCell('H12').value = 2; // For Reference

    // 2. DATA MASTER SHEET
    const master = wb.addWorksheet('DATA MASTER');
    master.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Company', key: 'company', width: 30 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Level', key: 'level', width: 15 },
        { header: 'Notes', key: 'notes', width: 50 }
    ];
    master.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    master.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1E2D' } };

    // 3. DASHBOARD SHEET (Main UI)
    const ui = wb.addWorksheet('SCOREHUB CALCULATOR', { views: [{ showGridLines: false }] });
    
    // Background color for whole screen
    for(let r=1; r<=40; r++) {
        for(let c=1; c<=12; c++) {
            ui.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D0D1A' } };
        }
    }

    // Header
    ui.mergeCells('B2:H3');
    const header = ui.getCell('B2');
    header.value = '🚢 SCOREHUB MARITIME INTELLIGENCE';
    header.font = { size: 20, bold: true, color: { argb: 'FF3B82F6' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };

    // Input Section: NEW CUSTOMER
    ui.mergeCells('B5:D5');
    ui.getCell('B5').value = '🆕 NEW CUSTOMER SCORING';
    ui.getCell('B5').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    
    const inputs = [
        { row: 7, label: 'Fleet Size (1-50)', type: 'num', ref: 'C7', scoreFormula: '=IF(C7>20, 5, IF(C7>=15, 4, IF(C7>=10, 3, IF(C7>=5, 2, 1))))' },
        { row: 8, label: 'Est. Value (IDR)', type: 'num', ref: 'C8', scoreFormula: '=IF(C8>3000000000, 5, IF(C8>=2000000000, 4, IF(C8>=1000000000, 3, IF(C8>=500000000, 2, 1))))' },
        { row: 9, label: 'Term Payment', type: 'dropdown', opts: 'ENGINE!$A$11:$A$15', scoreFormula: '=IFERROR(VLOOKUP(C9, ENGINE!A11:B15, 2, FALSE), 0)' },
        
        { row: 11, label: 'Legal Docs Count (1-5)', type: 'num', ref: 'C11', scoreFormula: '=IF(C11>=5, 5, IF(C11>=4, 4, IF(C11>=3, 3, IF(C11>=2, 2, 1))))' },
        { row: 12, label: 'Background Media (1-3)', type: 'num', ref: 'C12', scoreFormula: '=IF(C12>=3, 5, IF(C12>=2, 4, IF(C12>=1, 3, 1)))' },
        { row: 13, label: 'Ada Referensi?', type: 'dropdown', opts: 'ENGINE!$G$11:$G$12', scoreFormula: '=IFERROR(VLOOKUP(C13, ENGINE!G11:H12, 2, FALSE), 0)' },
        
        { row: 15, label: 'Tech Docs Count (1-3)', type: 'num', ref: 'C15', scoreFormula: '=IF(C15>=3, 5, IF(C15>=2, 4, IF(C15>=1, 3, 1)))' },
        { row: 16, label: 'Decision Speed', type: 'dropdown', opts: 'ENGINE!$D$11:$D$15', scoreFormula: '=IFERROR(VLOOKUP(C16, ENGINE!D11:E15, 2, FALSE), 0)' },
    ];

    inputs.forEach(inp => {
        ui.getCell(`B${inp.row}`).value = inp.label;
        ui.getCell(`B${inp.row}`).font = { color: { argb: 'FF888888' }, bold: true };
        
        const inputCell = ui.getCell(`C${inp.row}`);
        inputCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
        inputCell.font = { color: { argb: 'FFFFFFFF' } };
        inputCell.border = { bottom: { style: 'thin', color: { argb: 'FF3B82F6' } } };
        
        if (inp.type === 'dropdown') {
            inputCell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [inp.opts]
            };
        }

        // Hidden score calculation
        ui.getCell(`D${inp.row}`).value = { formula: inp.scoreFormula };
        ui.getCell(`D${inp.row}`).font = { color: { argb: 'FF0D0D1A' } }; // Hide it in bg
    });

    // Scoring Engine for New Customer
    // Category 1: Commercial (Rows 7,8,9)
    ui.getCell('E9').value = { formula: '=IFERROR(AVERAGE(D7:D9), 0)' };
    // Category 2: Credibility (Rows 11,12,13)
    ui.getCell('E13').value = { formula: '=IFERROR(AVERAGE(D11:D13), 0)' };
    // Category 3: Technical (Rows 15,16)
    ui.getCell('E16').value = { formula: '=IFERROR(AVERAGE(D15:D16), 0)' };

    ui.getCell('E9').font = { color: { argb: 'FF0D0D1A' } };
    ui.getCell('E13').font = { color: { argb: 'FF0D0D1A' } };
    ui.getCell('E16').font = { color: { argb: 'FF0D0D1A' } };

    // Result Panel
    ui.mergeCells('F7:H13');
    const resultPanel = ui.getCell('F7');
    resultPanel.value = { formula: '="FINAL SCORE: " & ROUND((E9*ENGINE!B2) + (E13*ENGINE!B3) + (E16*ENGINE!B4), 2)' };
    resultPanel.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    resultPanel.alignment = { vertical: 'middle', horizontal: 'center' };
    resultPanel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A2A3A' } };
    
    // Level Badge
    ui.mergeCells('F14:H16');
    const levelBadge = ui.getCell('F14');
    levelBadge.value = { formula: '=IF(ROUND((E9*ENGINE!B2) + (E13*ENGINE!B3) + (E16*ENGINE!B4), 2)>4, "STRATEGIC", IF(ROUND((E9*ENGINE!B2) + (E13*ENGINE!B3) + (E16*ENGINE!B4), 2)>=3, "PREFERRED", IF(ROUND((E9*ENGINE!B2) + (E13*ENGINE!B3) + (E16*ENGINE!B4), 2)>=2, "REGULAR", "HIGH RISK")))' };
    levelBadge.font = { size: 24, bold: true };
    levelBadge.alignment = { vertical: 'middle', horizontal: 'center' };

    // Conditional Formatting for Level Badge
    ui.addConditionalFormatting({
        ref: 'F14:H16',
        rules: [
            { type: 'containsText', text: 'STRATEGIC', operator: 'containsText', style: { font: { color: { argb: 'FF10B981' } } } },
            { type: 'containsText', text: 'PREFERRED', operator: 'containsText', style: { font: { color: { argb: 'FF3B82F6' } } } },
            { type: 'containsText', text: 'REGULAR', operator: 'containsText', style: { font: { color: { argb: 'FFF59E0B' } } } },
            { type: 'containsText', text: 'HIGH RISK', operator: 'containsText', style: { font: { color: { argb: 'FFEF4444' } } } }
        ]
    });

    // Formatting column widths
    ui.getColumn('B').width = 25;
    ui.getColumn('C').width = 30;
    ui.getColumn('D').width = 2; // hidden calc
    ui.getColumn('E').width = 2; // hidden calc

    // Save
    const desktopPath = require('os').homedir() + '/Desktop/ScoreHub_Genius_Master.xlsx';
    await wb.xlsx.writeFile(desktopPath);
    console.log('✅ EXCEL JENIUS BERHASIL DIBUAT: ' + desktopPath);
}

createGeniusExcel().catch(console.error);
