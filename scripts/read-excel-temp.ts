import ExcelJS from 'exceljs';

async function readExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:/dev/simon/jadwal.piket/JADWAL PIKET PST BPS PROVINSI SUMATERA BARAT 2026 (1) (1).xlsx');
  
  const pegawaiSheet = workbook.getWorksheet('Pegawai');
  if (pegawaiSheet) {
    console.log('Found Pegawai sheet');
    let rowCount = 0;
    pegawaiSheet.eachRow((row, rowNumber) => {
      if (rowCount < 10) {
        console.log(`Row ${rowNumber}:`, row.values);
      }
      rowCount++;
    });
  } else {
    console.log('No Pegawai sheet found.');
  }
}

readExcel().catch(console.error);
