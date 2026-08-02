import React, { useState, useCallback, useRef } from 'react';
import mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { UploadCloud, File as FileIcon, Download, FileText, Loader2, Info, FileCode } from 'lucide-react';
import { cn } from '../lib/utils';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');

  const hiddenDivRef = useRef<HTMLDivElement>(null);

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
    if (newFile.name.toLowerCase().endsWith('.docx') || newFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setFile(newFile);
      setOutputUrl(null);
      setError(null);
      setHtmlContent('');
    } else {
      setError('Please upload a valid Word (.docx) file.');
    }
  };

  const processConversion = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);

    try {
      // 1. Read DOCX and convert to HTML
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);

      // Wait a moment for React to render the HTML content into the hidden div
      setTimeout(async () => {
        try {
          if (!hiddenDivRef.current) throw new Error("Could not find hidden render element");
          
          const opt = {
            margin:       15,
            filename:     file.name.replace('.docx', '.pdf'),
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          const pdfBlob = await html2pdf().set(opt).from(hiddenDivRef.current).output('blob');
          const url = URL.createObjectURL(pdfBlob);
          setOutputUrl(url);

        } catch (err: any) {
          console.error(err);
          setError(err.message || 'An error occurred during PDF generation.');
        } finally {
          setIsProcessing(false);
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while reading the Word document. Note: Only .docx files are supported.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      
      {/* Hidden div for PDF rendering */}
      <div className="absolute left-[-9999px] top-[-9999px] w-[793px] bg-white text-black z-[-1]">
         <div 
           ref={hiddenDivRef} 
           className="p-8 font-sans"
           dangerouslySetInnerHTML={{ __html: htmlContent }} 
         />
      </div>

      {/* Left Column: Upload & Options */}
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
            onClick={() => document.getElementById('file-upload-word')?.click()}
          >
            <input
              id="file-upload-word"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <FileCode size={28} />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button 
                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setOutputUrl(null); setHtmlContent(''); }}
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
                <p className="text-xs text-neutral-500">Word (.docx) files only</p>
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
            <FileText size={20} className="text-red-500" />
            Convert to PDF
          </h2>
          
          <p className="text-sm text-neutral-600 mb-6">
            Convert your Word document to a PDF file. Note that complex formatting like headers, footers, or embedded charts may not be perfectly preserved.
          </p>

          <button
            onClick={processConversion}
            disabled={!file || isProcessing}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Converting...
              </>
            ) : (
              <>
                Convert to PDF
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
                    download={file?.name.replace('.docx', '.pdf') || 'Converted_Document.pdf'}
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
                <h3 className="text-neutral-900 font-semibold mb-2">Ready to Convert</h3>
                <p className="text-neutral-500 text-sm">Upload a Word (.docx) file and click "Convert to PDF" to generate your document.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
