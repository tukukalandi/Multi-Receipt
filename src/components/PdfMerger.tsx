import React, { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, File as FileIcon, Download, FileText, Loader2, Info, X, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface PdfFile {
  id: string;
  file: File;
}

export default function PdfMerger() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (validFiles.length !== newFiles.length) {
      setError('Some files were ignored because they are not valid PDF files.');
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [
        ...prev,
        ...validFiles.map(file => ({ id: Math.random().toString(36).substring(7), file }))
      ]);
      setOutputUrl(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setOutputUrl(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    } else if (direction === 'down' && index < files.length - 1) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
        return newFiles;
      });
    }
    setOutputUrl(null);
  };

  const processMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const { file } of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while merging the PDFs.');
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
            Upload PDFs to Merge
          </h2>
          
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
              isDragging ? "border-red-500 bg-red-50" : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 bg-white shadow-sm border border-neutral-200 text-neutral-400 rounded-full flex items-center justify-center mb-1">
                <UploadCloud size={24} />
              </div>
              <p className="font-medium text-neutral-700 text-sm">Click to upload or drag and drop multiple files</p>
              <p className="text-xs text-neutral-500">PDF files only</p>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {files.length > 0 && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-red-500" />
                Files to Merge ({files.length})
              </h2>
              <button 
                onClick={() => setFiles([])}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {files.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex flex-col text-neutral-400">
                      <button 
                        onClick={() => moveFile(index, 'up')} 
                        disabled={index === 0}
                        className="hover:text-neutral-700 disabled:opacity-30"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <button 
                        onClick={() => moveFile(index, 'down')} 
                        disabled={index === files.length - 1}
                        className="hover:text-neutral-700 disabled:opacity-30"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>
                    <FileIcon size={20} className="text-red-500 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-neutral-800 truncate">{item.file.name}</p>
                      <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(item.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={processMerge}
              disabled={files.length < 2 || isProcessing}
              className="mt-6 w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  Merge PDFs
                </>
              )}
            </button>
          </section>
        )}
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
                    download="Merged_Document.pdf"
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
                <h3 className="text-neutral-900 font-semibold mb-2">Ready to Merge</h3>
                <p className="text-neutral-500 text-sm">Upload multiple PDF files, arrange them in order, and click "Merge PDFs".</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
