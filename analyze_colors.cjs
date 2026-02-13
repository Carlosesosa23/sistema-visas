const fs = require('fs');
const ExcelJS = require('exceljs');
const filePath = 'Citas embajada 2026.xlsx';
const logFile = 'colors.txt';

async function analyzeColors() {
    const workbook = new ExcelJS.Workbook();
    fs.writeFileSync(logFile, '', 'utf8');

    function log(msg) {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n', 'utf8');
    }

    try {
        await workbook.xlsx.readFile(filePath);
        log('--- Color Analysis ---');

        workbook.eachSheet((worksheet, sheetId) => {
            if (worksheet.name.toLowerCase().includes('info incompleta')) return;

            log(`\nSheet: ${worksheet.name}`);

            // Analyze first 50 rows to find colors
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber <= 1) return; // Skip header

                const nameCell = row.getCell(1);

                // Inspect cell style
                const fill = nameCell.fill;

                if (fill && fill.type === 'pattern') {
                    let color = 'Unknown';
                    if (fill.fgColor) {
                        color = fill.fgColor.argb || `Theme:${fill.fgColor.theme},Tint:${fill.fgColor.tint}`;
                    }

                    const name = nameCell.text || nameCell.value;
                    // Only log if it has a fill
                    log(`Row ${rowNumber}: Name="${name}" | Color=${color}`);
                }
            });
        });
    } catch (error) {
        log('Error: ' + error.message);
    }
}

analyzeColors();
