import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  TextRun, 
  HeadingLevel, 
  PageOrientation, 
  AlignmentType,
  ShadingType,
  BorderStyle
} from 'docx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Info, 
  FileText, 
  Check, 
  Palette, 
  Layout
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ExcelToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [docTitle, setDocTitle] = useState<string>('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [tableStyle, setTableStyle] = useState<'red' | 'navy' | 'gray'>('red');
  const [includeZebra, setIncludeZebra] = useState<boolean>(true);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const loadWorkbook = async (newFile: File) => {
    const isExcel = newFile.name.toLowerCase().endsWith('.xlsx') || 
      newFile.name.toLowerCase().endsWith('.xls') ||
      newFile.type.includes('spreadsheet') ||
      newFile.type.includes('excel');

    if (!isExcel) {
      setError('Please upload a valid Excel spreadsheet (.xlsx or .xls).');
      return;
    }

    setFile(newFile);
    setOutputUrl(null);
    setError(null);
    setDocTitle(newFile.name.replace(/\.[^/.]+$/, ''));

    try {
      const buffer = await newFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      
      if (wb.SheetNames.length > 0) {
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        parseSheet(wb, firstSheet);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to parse Excel workbook. Please verify the file.');
    }
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
    // Filter out completely empty rows
    const cleaned = rawData.filter(row => row && row.some(cell => cell !== undefined && cell !== ''));
    setSheetData(cleaned);
    setOutputUrl(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadWorkbook(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadWorkbook(e.target.files[0]);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheet(workbook, sheetName);
    }
  };

  const generateWordDoc = async () => {
    if (!sheetData || sheetData.length === 0) {
      setError('Selected sheet does not contain any readable data.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);

    try {
      // Find maximum number of columns
      const maxCols = sheetData.reduce((max, row) => Math.max(max, row.length), 0);
      if (maxCols === 0) throw new Error('Sheet is empty.');

      // Colors based on tableStyle
      const headerBg = tableStyle === 'red' ? 'B91C1C' : tableStyle === 'navy' ? '1E3A8A' : '374151';
      const zebraBg = tableStyle === 'red' ? 'FEF2F2' : tableStyle === 'navy' ? 'EFF6FF' : 'F9FAFB';

      const tableRows: TableRow[] = [];

      sheetData.forEach((row, rowIdx) => {
        const isHeader = rowIdx === 0;
        const isEven = rowIdx % 2 === 0;

        const cells: TableCell[] = [];
        for (let colIdx = 0; colIdx < maxCols; colIdx++) {
          const val = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : '';

          cells.push(
            new TableCell({
              width: {
                size: Math.floor(100 / maxCols),
                type: WidthType.PERCENTAGE
              },
              shading: {
                type: ShadingType.CLEAR,
                fill: isHeader ? headerBg : (includeZebra && !isEven ? zebraBg : 'FFFFFF')
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: val,
                      bold: isHeader,
                      color: isHeader ? 'FFFFFF' : '111827',
                      size: isHeader ? 20 : 18 // 10pt / 9pt
                    })
                  ],
                  alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
                })
              ],
              margins: {
                top: 120,
                bottom: 120,
                left: 120,
                right: 120
              }
            })
          );
        }

        tableRows.push(
          new TableRow({
            children: cells,
            tableHeader: isHeader
          })
        );
      });

      const docTable = new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE
        }
      });

      // Construct Docx document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
                },
                margin: {
                  top: 720,
                  bottom: 720,
                  left: 720,
                  right: 720
                }
              }
            },
            children: [
              new Paragraph({
                text: docTitle || 'Data Table',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              }),
              new Paragraph({
                text: `Sheet: ${selectedSheet} • Generated on ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
              }),
              docTable
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during Word document generation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Upload & Options */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UploadCloud size={20} className="text-red-500" />
            Upload Excel Spreadsheet
          </h2>

          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
              isDragging ? "border-red-500 bg-red-50" : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50",
              file && "border-red-200 bg-red-50/30"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('excel2word-file-input')?.click()}
          >
            <input
              id="excel2word-file-input"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {sheets.length} Sheet(s)
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setWorkbook(null);
                    setSheets([]);
                    setSheetData([]);
                    setOutputUrl(null);
                  }}
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-white shadow-sm border border-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-1">
                  <UploadCloud size={24} />
                </div>
                <p className="font-medium text-neutral-800 text-sm">Click to upload or drag & drop</p>
                <p className="text-xs text-neutral-500">Supports .xlsx and .xls files</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Configuration */}
        {file && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-800">
              <Layout size={18} className="text-red-500" />
              Document & Table Formatting
            </h2>

            {/* Sheet Selector */}
            {sheets.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Select Worksheet to Convert
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {sheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Document Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Word Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Daily Collection Register"
                className="w-full text-xs border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Page Orientation */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Word Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center",
                    orientation === 'landscape'
                      ? "bg-red-50 border-red-500 text-red-700 shadow-2xs"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  )}
                >
                  Landscape (Best for Wide Tables)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center",
                    orientation === 'portrait'
                      ? "bg-red-50 border-red-500 text-red-700 shadow-2xs"
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  )}
                >
                  Portrait (Standard)
                </button>
              </div>
            </div>

            {/* Table Styling */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Table Header Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'red', label: 'Post Office Red', color: 'bg-red-600' },
                  { id: 'navy', label: 'Classic Navy', color: 'bg-blue-900' },
                  { id: 'gray', label: 'Minimalist Gray', color: 'bg-neutral-700' }
                ].map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTableStyle(theme.id as any)}
                    className={cn(
                      "py-2 px-2.5 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-all",
                      tableStyle === theme.id
                        ? "border-red-500 bg-red-50/50 text-red-800 font-bold"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    )}
                  >
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", theme.color)} />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zebra Striping */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeZebra}
                onChange={(e) => setIncludeZebra(e.target.checked)}
                className="accent-red-600 rounded"
              />
              <span className="text-xs text-neutral-700 font-medium">
                Alternate row zebra striping for easy reading
              </span>
            </label>

            <button
              onClick={generateWordDoc}
              disabled={sheetData.length === 0 || isProcessing}
              className="w-full mt-3 py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating Word Document (.docx)...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Convert Excel to Word (.docx)
                </>
              )}
            </button>
          </section>
        )}
      </div>

      {/* Right Column: Preview & Download */}
      <div className="lg:col-span-7">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-red-500" />
                Table Preview & Export
              </h2>
              {sheetData.length > 0 && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sheet: {selectedSheet} • {sheetData.length} rows loaded
                </p>
              )}
            </div>

            {outputUrl && file && (
              <a
                href={outputUrl}
                download={`${docTitle || 'Converted_Spreadsheet'}.docx`}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Download size={15} />
                Download Word (.docx)
              </a>
            )}
          </div>

          {/* Table display */}
          <div className="flex-1 mt-4 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50/50">
            {sheetData.length > 0 ? (
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full text-xs text-left border-collapse">
                  <thead className={cn(
                    "sticky top-0 text-white shadow-2xs font-semibold",
                    tableStyle === 'red' ? "bg-red-600" : tableStyle === 'navy' ? "bg-blue-900" : "bg-neutral-800"
                  )}>
                    <tr>
                      {sheetData[0].map((header, colIdx) => (
                        <th
                          key={colIdx}
                          className="px-3 py-2.5 border-r border-white/20 last:border-r-0 whitespace-nowrap"
                        >
                          {header !== undefined && header !== null ? String(header) : `Col ${colIdx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {sheetData.slice(1).map((row, rowIdx) => (
                      <tr 
                        key={rowIdx} 
                        className={includeZebra && rowIdx % 2 === 1 ? "bg-neutral-50/80 hover:bg-neutral-100" : "bg-white hover:bg-neutral-50"}
                      >
                        {sheetData[0].map((_, colIdx) => {
                          const cell = row[colIdx];
                          return (
                            <td
                              key={colIdx}
                              className="px-3 py-2 border-r border-neutral-200 last:border-r-0 text-neutral-800 max-w-xs truncate"
                              title={cell !== undefined ? String(cell) : ''}
                            >
                              {cell !== undefined && cell !== null ? String(cell) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[380px]">
                <div className="w-16 h-16 bg-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-1">
                  Ready to Convert Excel to Word
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4">
                  Upload an Excel (.xlsx or .xls) file on the left. It will be converted into a beautifully styled, editable Microsoft Word table (.docx).
                </p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-600 bg-white py-1.5 px-3 rounded-full border border-neutral-200">
                  <Check size={12} className="text-emerald-600" />
                  Auto-formats into Landscape / Portrait Microsoft Word Tables
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
