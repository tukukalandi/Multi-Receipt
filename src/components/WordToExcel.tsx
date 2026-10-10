import React, { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Info, 
  Table as TableIcon, 
  Check, 
  FileText, 
  ListOrdered
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ExtractedSheet {
  name: string;
  data: string[][];
  sourceType: 'table' | 'text' | 'key-value';
}

export default function WordToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedSheets, setExtractedSheets] = useState<ExtractedSheet[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] = useState<'auto' | 'tables_only' | 'paragraphs'>('auto');

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleNewFile = (newFile: File) => {
    const isDocx = newFile.name.toLowerCase().endsWith('.docx') || 
      newFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (isDocx) {
      setFile(newFile);
      setExtractedSheets([]);
      setOutputUrl(null);
      setError(null);
    } else {
      setError('Please upload a valid Microsoft Word (.docx) file.');
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNewFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleNewFile(e.target.files[0]);
    }
  };

  const parseWordDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setExtractedSheets([]);
    setOutputUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const tables = Array.from(doc.querySelectorAll('table'));
      const sheets: ExtractedSheet[] = [];

      // 1. If tables are found and mode allows tables
      if (tables.length > 0 && extractionMode !== 'paragraphs') {
        tables.forEach((table, tableIdx) => {
          const rows: string[][] = [];
          const trElements = Array.from(table.querySelectorAll('tr'));

          trElements.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => {
              return cell.textContent?.trim() || '';
            });
            if (cells.some(c => c.length > 0)) {
              rows.push(cells);
            }
          });

          if (rows.length > 0) {
            sheets.push({
              name: `Table ${tableIdx + 1}`,
              data: rows,
              sourceType: 'table'
            });
          }
        });
      }

      // 2. If no tables or if mode is paragraphs or auto with no tables
      if (sheets.length === 0 || extractionMode === 'paragraphs') {
        const paragraphs = Array.from(doc.querySelectorAll('p, li, h1, h2, h3, h4'));
        const textRows: string[][] = [];

        // Check if many paragraphs have key: value patterns
        const keyValueMatches = paragraphs.filter(p => (p.textContent || '').includes(':'));
        const isMostlyKeyValue = keyValueMatches.length > paragraphs.length * 0.4 && keyValueMatches.length >= 3;

        if (isMostlyKeyValue && extractionMode !== 'paragraphs') {
          // Key-Value table extraction
          textRows.push(['Field / Parameter', 'Value']);
          paragraphs.forEach(p => {
            const text = p.textContent?.trim() || '';
            if (!text) return;
            const colonIdx = text.indexOf(':');
            if (colonIdx !== -1) {
              const key = text.substring(0, colonIdx).trim();
              const val = text.substring(colonIdx + 1).trim();
              textRows.push([key, val]);
            } else {
              textRows.push([text, '']);
            }
          });

          sheets.push({
            name: 'Key-Value Fields',
            data: textRows,
            sourceType: 'key-value'
          });
        } else {
          // Line by line
          textRows.push(['#', 'Content']);
          paragraphs.forEach((p, idx) => {
            const text = p.textContent?.trim() || '';
            if (text) {
              textRows.push([(textRows.length).toString(), text]);
            }
          });

          sheets.push({
            name: 'Document Content',
            data: textRows,
            sourceType: 'text'
          });
        }
      }

      if (sheets.length === 0) {
        throw new Error('No readable text or tables could be extracted from this Word document.');
      }

      // Build XLSX Workbook
      const wb = XLSX.utils.book_new();

      sheets.forEach((sheet) => {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data);

        // Compute column widths
        const colWidths = sheet.data.reduce((acc, row) => {
          row.forEach((cell, colIdx) => {
            const len = cell ? Math.min(Math.max(cell.toString().length + 2, 10), 50) : 10;
            acc[colIdx] = Math.max(acc[colIdx] || 10, len);
          });
          return acc;
        }, [] as number[]);

        ws['!cols'] = colWidths.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
      });

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);

      setExtractedSheets(sheets);
      setSelectedSheetIndex(0);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while converting Word to Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentSheet = extractedSheets[selectedSheetIndex] || extractedSheets[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Upload & Settings */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <UploadCloud size={20} className="text-red-500" />
            Upload Word Document
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
            onClick={() => document.getElementById('word2excel-file-input')?.click()}
          >
            <input
              id="word2excel-file-input"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Word Document (.docx)
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setExtractedSheets([]);
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
                <p className="text-xs text-neutral-500">Supports .docx files</p>
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

        {/* Extraction Options */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-800">
            <FileSpreadsheet size={18} className="text-red-500" />
            Extraction Mode
          </h2>

          <div className="space-y-2">
            {[
              {
                id: 'auto',
                title: 'Smart Auto-Detection (Recommended)',
                desc: 'Extracts embedded tables if present, otherwise parses structured data & paragraphs into columns'
              },
              {
                id: 'tables_only',
                title: 'Tables Only',
                desc: 'Only extracts data from existing tables inside the Word document'
              },
              {
                id: 'paragraphs',
                title: 'Text Lines & Paragraphs',
                desc: 'Transforms every paragraph and list item into ordered spreadsheet rows'
              }
            ].map(mode => (
              <label
                key={mode.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  extractionMode === mode.id
                    ? "bg-red-50/50 border-red-400 text-neutral-900"
                    : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                )}
              >
                <input
                  type="radio"
                  name="extractionMode"
                  checked={extractionMode === mode.id}
                  onChange={() => setExtractionMode(mode.id as any)}
                  className="mt-1 accent-red-600"
                />
                <div>
                  <p className="text-xs font-semibold">{mode.title}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">{mode.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={parseWordDocument}
            disabled={!file || isProcessing}
            className="w-full mt-4 py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Extracting Data to Excel...
              </>
            ) : (
              <>
                <FileSpreadsheet size={18} />
                Convert Word to Excel (.xlsx)
              </>
            )}
          </button>
        </section>
      </div>

      {/* Right Column: Spreadsheet Preview & Download */}
      <div className="lg:col-span-7">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TableIcon size={20} className="text-red-500" />
                Spreadsheet Preview
              </h2>
              {currentSheet && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {currentSheet.data.length} rows • {currentSheet.data[0]?.length || 0} columns
                </p>
              )}
            </div>

            {outputUrl && file && (
              <a
                href={outputUrl}
                download={file.name.replace(/\.[^/.]+$/, '') + '.xlsx'}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Download size={15} />
                Download Excel (.xlsx)
              </a>
            )}
          </div>

          {/* Multiple sheets switcher if applicable */}
          {extractedSheets.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2.5 border-b border-neutral-100">
              {extractedSheets.map((sheet, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setSelectedSheetIndex(sIdx)}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors",
                    selectedSheetIndex === sIdx
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  {sheet.name} ({sheet.data.length} rows)
                </button>
              ))}
            </div>
          )}

          {/* Table display */}
          <div className="flex-1 mt-4 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50/50">
            {currentSheet && currentSheet.data.length > 0 ? (
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full text-xs text-left border-collapse">
                  <thead className="bg-neutral-100 text-neutral-700 sticky top-0 shadow-2xs font-semibold">
                    <tr>
                      {currentSheet.data[0].map((header, colIdx) => (
                        <th
                          key={colIdx}
                          className="px-3 py-2.5 border-b border-r border-neutral-200 last:border-r-0 whitespace-nowrap bg-neutral-200/80"
                        >
                          {header || `Column ${colIdx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {currentSheet.data.slice(1).map((row, rowIdx) => (
                      <tr 
                        key={rowIdx} 
                        className={rowIdx % 2 === 0 ? "bg-white hover:bg-neutral-50" : "bg-neutral-50/50 hover:bg-neutral-100"}
                      >
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-3 py-2 border-r border-neutral-200 last:border-r-0 text-neutral-800 max-w-xs truncate"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 min-h-[380px]">
                <div className="w-16 h-16 bg-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-1">
                  Ready to Extract Data to Excel
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4">
                  Upload a Word (.docx) document on the left. All tables, forms, and structured content will be converted into clean Excel spreadsheets.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-600 bg-white py-1.5 px-3 rounded-full border border-neutral-200">
                  <Check size={12} className="text-emerald-600" />
                  Preserves Table Headers, Rows & Cells in .xlsx
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
