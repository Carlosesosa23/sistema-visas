import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'Citas embajada 2026.xlsx';

try {
    const workbook = XLSX.readFile(filePath, { cellStyles: true });

    console.log('--- Sheets Analysis ---');
    workbook.SheetNames.forEach(sheetName => {
        // Skip 'info incompleta' as requested
        if (sheetName.toLowerCase().includes('info incompleta')) {
            console.log(`Skipping ignored sheet: ${sheetName}`);
            return;
        }

        console.log(`\nSheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];

        // Get headers (first row functionality)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length > 0) {
            console.log('Headers:', jsonData[0]);

            // Sample data (first 3 rows) to understand format
            console.log('Sample Data (First 3 rows):');
            console.log(jsonData.slice(1, 4));
        } else {
            console.log('Sheet appears empty.');
        }

        // Color analysis (heuristic based on cell styles if available, or just noting limits)
        console.log('Note: Programmatic color extraction depends on file format nuances.');
    });

} catch (error) {
    console.error('Error reading file:', error.message);
}
