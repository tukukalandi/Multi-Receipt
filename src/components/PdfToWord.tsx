import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { UploadCloud, File as FileIcon, Download, FileText, Loader2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

// Set up the worker for pdfjs-dist to extract text
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setOutputUrl(null);
        setError(null);
        setProgress(0);
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setOutputUrl(null);
        setError(null);
        setProgress(0);
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const processToWord = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const paragraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        let currentPageText = '';
        let lastY = -1;

        for (const item of items) {
          if ('str' in item) {
             if (lastY !== -1 && lastY !== item.transform[5] && currentPageText.length > 0) {
                 currentPageText += '\n';
             }
             currentPageText += item.str;
             lastY = item.transform[5];
          }
        }
        
        const lines = currentPageText.split('\n');
        for (const line of lines) {
            paragraphs.push(new Paragraph({
                children: [new TextRun(line)],
            }));
        }

        setProgress(Math.round((i / numPages) * 100));
      }

      const doc = new Document({
          sections: [
              {
                  properties: {},
                  children: paragraphs,
              }
          ]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while converting the PDF. Please check if the PDF is readable.');
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
            Upload PDF to Convert
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
                  <p className="text-xs text-neutral-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  className="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setOutputUrl(null); setProgress(0); }}
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
                <p className="text-xs text-neutral-500">PDF files only (max 50MB)</p>
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
            <Info size={20} className="text-red-500" />
            About Conversion
          </h2>
          <p className="text-sm text-neutral-600">
            This tool extracts readable text from your PDF document and formats it into a standard Word Document (.docx).
            Note that complex layouts, images, and non-selectable text (like scanned images without OCR) cannot be extracted.
          </p>

          <button
            onClick={processToWord}
            disabled={!file || isProcessing}
            className="mt-6 w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Converting ({progress}%)...
              </>
            ) : (
              <>
                Convert to Word (.docx)
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
            Download
          </h2>
          
          <div className="flex-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden flex flex-col items-center justify-center relative">
            {outputUrl ? (
              <div className="text-center p-8 flex flex-col items-center max-w-sm">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <FileText size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-neutral-900 font-semibold mb-2 text-xl">Conversion Complete!</h3>
                <p className="text-neutral-500 text-sm mb-6">Your Word document is ready to download.</p>
                
                <a
                  href={outputUrl}
                  download={`${file?.name ? file.name.replace('.pdf', '') : 'Document'}.docx`}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  <Download size={20} />
                  Download Word Document
                </a>
              </div>
            ) : (
              <div className="text-center p-8 flex flex-col items-center max-w-sm">
                <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mb-6 text-neutral-400">
                  <FileText size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-neutral-900 font-semibold mb-2">Ready to Process</h3>
                <p className="text-neutral-500 text-sm">Upload a PDF file and click "Convert to Word".</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
