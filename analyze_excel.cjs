const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'Citas embajada 2026.xlsx';

const logFile = 'analysis_output_utf8.txt';
fs.writeFileSync(logFile, '', 'utf8'); // Clear file

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n', 'utf8');
}

try {
    const workbook = XLSX.readFile(filePath, { cellStyles: true });

    log('--- Sheets Analysis ---');
    workbook.SheetNames.forEach(sheetName => {
        // Skip 'info incompleta' as requested
        if (sheetName.toLowerCase().includes('info incompleta')) {
            log(`Skipping ignored sheet: ${sheetName}`);
            return;
        }

        log(`\nSheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];

        // Get headers (first row functionality)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length > 0) {
            log('Headers:');
            log(jsonData[0]);

            // Sample data (first 3 rows) to understand format
            log('Sample Data (First 3 rows):');
            log(jsonData.slice(1, 4));
        } else {
            log('Sheet appears empty.');
        }
    });

} catch (error) {
    log('Error reading file: ' + error.message);
}
