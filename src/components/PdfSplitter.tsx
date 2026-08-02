import React, { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, File as FileIcon, Download, FileText, Loader2, Info, Scissors } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageRange, setPageRange] = useState('');
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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

  const handleNewFile = async (newFile: File) => {
    if (newFile.type === 'application/pdf') {
      setFile(newFile);
      setOutputUrl(null);
      setError(null);
      
      // Get total pages
      try {
        const arrayBuffer = await newFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (err) {
        console.error(err);
        setTotalPages(null);
      }
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(p => p.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        
        if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= maxPages) {
          for (let i = start; i <= end; i++) {
            pages.add(i - 1); // zero-based index
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          pages.add(pageNum - 1);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const processSplit = async () => {
    if (!file) return;
    if (!pageRange.trim()) {
      setError('Please enter a page range.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const maxPages = pdfDoc.getPageCount();
      
      const pageIndices = parsePageRange(pageRange, maxPages);
      
      if (pageIndices.length === 0) {
        throw new Error(`Invalid page range. Please enter valid pages between 1 and ${maxPages}.`);
      }

      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      
      copiedPages.forEach((page) => {
        newPdfDoc.addPage(page);
      });

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while splitting the PDF.');
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
            Upload PDF to Split
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
            onClick={() => document.getElementById('file-upload-split')?.click()}
          >
            <input
              id="file-upload-split"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <FileIcon size={28} />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB 
                    {totalPages !== null && ` • ${totalPages} pages`}
                  </p>
                </div>
                <button 
                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setOutputUrl(null); setTotalPages(null); }}
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-white shadow-sm border border-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-1">
                  <UploadCloud size={24} />
                </div>
                <p className="font-medium text-neutral-700 text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-neutral-500">PDF files only</p>
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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Scissors size={20} className="text-red-500" />
            Extract Pages
          </h2>
          
          <div>
            <label htmlFor="pageRange" className="block text-sm font-medium text-neutral-700 mb-2">
              Pages to extract
            </label>
            <input
              type="text"
              id="pageRange"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="e.g. 1, 3, 5-10"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-red-500 focus:border-red-500 outline-none"
              disabled={!file}
            />
            <p className="text-xs text-neutral-500 mt-2">
              Enter page numbers and/or page ranges separated by commas.
            </p>
          </div>

          <button
            onClick={processSplit}
            disabled={!file || !pageRange.trim() || isProcessing}
            className="mt-6 w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                Extract Pages
              </>
            )}
          </button>
        </section>
      </div>

      {/* Right Column: Preview/Download */}
      <div className="lg:col-span-7">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col min-h-[500px]">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileText size={20} className="text-red-500" />
            Preview & Download
          </h2>
          
          <div className="flex-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden flex flex-col items-center justify-center relative">
            {outputUrl ? (
              <>
                <iframe 
                  src={`${outputUrl}#toolbar=0&navpanes=0`} 
                  className="w-full h-full border-0 absolute inset-0 z-0 bg-neutral-200/50"
                  title="PDF Preview"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <p className="text-neutral-500 bg-white/80 px-4 py-2 rounded-lg font-medium shadow-sm backdrop-blur-sm pointer-events-auto text-sm">If preview is blank, please Download or Open in New Tab.</p>
                </div>
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <a
                    href={outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-neutral-50 text-neutral-700 py-2.5 px-4 rounded-lg font-medium shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border border-neutral-200 text-sm"
                  >
                    <FileText size={16} />
                    Open
                  </a>
                  <a
                    href={outputUrl}
                    download={`Split_${file?.name || 'Document'}`}
                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-sm"
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center p-8 flex flex-col items-center max-w-sm">
                <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mb-6 text-neutral-400">
                  <FileText size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-neutral-900 font-semibold mb-2">Ready to Extract</h3>
                <p className="text-neutral-500 text-sm">Upload a PDF file, enter the pages you want to extract, and click "Extract Pages".</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
