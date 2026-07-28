/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { PDFDocument, PageSizes, rgb } from 'pdf-lib';
import { UploadCloud, File as FileIcon, Download, Settings, FileText, Loader2, Info } from 'lucide-react';
import { cn } from './lib/utils';

type LayoutOption = 'stack-4-fit' | 'stack-6-fit' | 'grid-2x2';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [layout, setLayout] = useState<LayoutOption>('stack-4-fit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const processPdf = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setOutputUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();
      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      if (pageCount === 0) {
        throw new Error('The uploaded PDF has no pages.');
      }

      if (layout === 'stack-4-fit') {
        // Stack 4 vertically (Fit full original page into 1/4 of A4)
        for (let i = 0; i < pageCount; i += 4) {
          const newPage = newPdfDoc.addPage(PageSizes.A4);
          const { width: a4Width, height: a4Height } = newPage.getSize();
          const sectionHeight = a4Height / 4;

          const pagesToEmbed = [
            pages[i],
            i + 1 < pageCount ? pages[i + 1] : null,
            i + 2 < pageCount ? pages[i + 2] : null,
            i + 3 < pageCount ? pages[i + 3] : null,
          ].filter(Boolean) as any[];

          const embeddedPages = await newPdfDoc.embedPages(pagesToEmbed);

          embeddedPages.forEach((embPage, index) => {
            const margin = 15;
            const availWidth = a4Width - margin * 2;
            const availHeight = sectionHeight - margin * 2;
            
            const scale = Math.min(availWidth / embPage.width, availHeight / embPage.height);
            const scaledWidth = embPage.width * scale;
            const scaledHeight = embPage.height * scale;
            
            const x = margin + (availWidth - scaledWidth) / 2;
            const y = a4Height - (sectionHeight * index) - sectionHeight + margin + (availHeight - scaledHeight) / 2;

            newPage.drawPage(embPage, { x, y, width: scaledWidth, height: scaledHeight });
            
            if (index < 3) {
                const lineY = a4Height - (sectionHeight * (index + 1));
                newPage.drawLine({ start: { x: margin, y: lineY }, end: { x: a4Width - margin, y: lineY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
            }
          });
        }
      } else if (layout === 'stack-6-fit') {
        // Stack 6 vertically (Fit full original page into 1/6 of A4)
        for (let i = 0; i < pageCount; i += 6) {
          const newPage = newPdfDoc.addPage(PageSizes.A4);
          const { width: a4Width, height: a4Height } = newPage.getSize();
          const sectionHeight = a4Height / 6;

          const pagesToEmbed = [
            pages[i],
            i + 1 < pageCount ? pages[i + 1] : null,
            i + 2 < pageCount ? pages[i + 2] : null,
            i + 3 < pageCount ? pages[i + 3] : null,
            i + 4 < pageCount ? pages[i + 4] : null,
            i + 5 < pageCount ? pages[i + 5] : null,
          ].filter(Boolean) as any[];

          const embeddedPages = await newPdfDoc.embedPages(pagesToEmbed);

          embeddedPages.forEach((embPage, index) => {
            const margin = 10;
            const availWidth = a4Width - margin * 2;
            const availHeight = sectionHeight - margin * 2;
            
            const scale = Math.min(availWidth / embPage.width, availHeight / embPage.height);
            const scaledWidth = embPage.width * scale;
            const scaledHeight = embPage.height * scale;
            
            const x = margin + (availWidth - scaledWidth) / 2;
            const y = a4Height - (sectionHeight * index) - sectionHeight + margin + (availHeight - scaledHeight) / 2;

            newPage.drawPage(embPage, { x, y, width: scaledWidth, height: scaledHeight });
            
            if (index < 5) {
                const lineY = a4Height - (sectionHeight * (index + 1));
                newPage.drawLine({ start: { x: margin, y: lineY }, end: { x: a4Width - margin, y: lineY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
            }
          });
        }
      } else if (layout === 'grid-2x2') {
        // 2x2 Grid on A4
        for (let i = 0; i < pageCount; i += 4) {
          const newPage = newPdfDoc.addPage(PageSizes.A4);
          const { width: a4Width, height: a4Height } = newPage.getSize();

          const pagesToEmbed = [
            pages[i],
            i + 1 < pageCount ? pages[i + 1] : null,
            i + 2 < pageCount ? pages[i + 2] : null,
            i + 3 < pageCount ? pages[i + 3] : null,
          ].filter(Boolean) as any[];

          const embeddedPages = await newPdfDoc.embedPages(pagesToEmbed);

          embeddedPages.forEach((embPage, index) => {
             const col = index % 2;
             const row = Math.floor(index / 2); // 0 or 1
             
             const sectionWidth = a4Width / 2;
             const sectionHeight = a4Height / 2;
             
             const margin = 15;
             const availWidth = sectionWidth - margin * 2;
             const availHeight = sectionHeight - margin * 2;
             
             const scale = Math.min(availWidth / embPage.width, availHeight / embPage.height);
             const scaledWidth = embPage.width * scale;
             const scaledHeight = embPage.height * scale;
             
             const x = (col * sectionWidth) + margin + (availWidth - scaledWidth) / 2;
             const y = a4Height - (row * sectionHeight) - sectionHeight + margin + (availHeight - scaledHeight) / 2;
             
             newPage.drawPage(embPage, { x, y, width: scaledWidth, height: scaledHeight });
          });
          
          newPage.drawLine({ start: { x: a4Width / 2, y: 0 }, end: { x: a4Width / 2, y: a4Height }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
          newPage.drawLine({ start: { x: 0, y: a4Height / 2 }, end: { x: a4Width, y: a4Height / 2 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        }
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while processing the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <header className="bg-red-600 border-b border-red-700 py-6 px-8 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 sm:gap-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-yellow-400 text-red-700 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Print Multi-Receipt</h1>
            <p className="text-sm text-red-100 font-medium mt-0.5">Format A4 PDFs to print 4 receipts per page</p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-sm text-red-100 font-medium bg-red-700/50 px-3 py-1.5 rounded-lg border border-red-500/30">
            Prepared by Kalandi Charan Sahoo, PA, Dhenkanal RS SO
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <UploadCloud size={20} className="text-red-500" />
              Upload PDF
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
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
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
                    onClick={(e) => { e.stopPropagation(); setFile(null); setOutputUrl(null); }}
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
              <Settings size={20} className="text-red-500" />
              Layout Options
            </h2>
            
            <div className="space-y-3">
              <label className={cn(
                "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                layout === 'stack-4-fit' ? "border-red-600 bg-red-50/50 ring-1 ring-red-600" : "border-neutral-200 hover:border-neutral-300"
              )}>
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="layout"
                    value="stack-4-fit"
                    checked={layout === 'stack-4-fit'}
                    onChange={(e) => setLayout(e.target.value as LayoutOption)}
                    className="w-4 h-4 text-red-600 border-neutral-300 focus:ring-red-600"
                  />
                </div>
                <div className="ml-3 flex-1 flex gap-4">
                  <div>
                    <span className="block text-sm font-medium text-neutral-900">Stack 4 (Fit Full Page)</span>
                    <span className="block text-xs text-neutral-500 mt-1">Best if your PDF pages are already small receipt size. Stacks 4 full pages vertically on one A4 page.</span>
                  </div>
                  <div className="w-8 h-10 border-2 border-neutral-300 rounded shrink-0 flex flex-col p-1 gap-1">
                    <div className="bg-red-300 flex-1 rounded-sm"></div>
                    <div className="bg-red-300 flex-1 rounded-sm"></div>
                    <div className="bg-red-300 flex-1 rounded-sm"></div>
                    <div className="bg-red-300 flex-1 rounded-sm"></div>
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                layout === 'stack-6-fit' ? "border-red-600 bg-red-50/50 ring-1 ring-red-600" : "border-neutral-200 hover:border-neutral-300"
              )}>
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="layout"
                    value="stack-6-fit"
                    checked={layout === 'stack-6-fit'}
                    onChange={(e) => setLayout(e.target.value as LayoutOption)}
                    className="w-4 h-4 text-red-600 border-neutral-300 focus:ring-red-600"
                  />
                </div>
                <div className="ml-3 flex-1 flex gap-4">
                  <div>
                    <span className="block text-sm font-medium text-neutral-900">Stack 6 (Fit Full Page)</span>
                    <span className="block text-xs text-neutral-500 mt-1">Best if your PDF pages are already small receipt size. Stacks 6 full pages vertically on one A4 page.</span>
                  </div>
                  <div className="w-8 h-10 border-2 border-neutral-300 rounded shrink-0 flex flex-col p-1 gap-[2px]">
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                    <div className="bg-red-300 flex-1 rounded-[1px]"></div>
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-start p-4 border rounded-xl cursor-pointer transition-all",
                layout === 'grid-2x2' ? "border-red-600 bg-red-50/50 ring-1 ring-red-600" : "border-neutral-200 hover:border-neutral-300"
              )}>
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="layout"
                    value="grid-2x2"
                    checked={layout === 'grid-2x2'}
                    onChange={(e) => setLayout(e.target.value as LayoutOption)}
                    className="w-4 h-4 text-red-600 border-neutral-300 focus:ring-red-600"
                  />
                </div>
                <div className="ml-3 flex-1 flex gap-4">
                  <div>
                    <span className="block text-sm font-medium text-neutral-900">4 Pages in 1 (2x2 Grid)</span>
                    <span className="block text-xs text-neutral-500 mt-1">Shrinks entire original pages by 50% and places 4 in a grid. Best if the receipt takes up the full page.</span>
                  </div>
                  <div className="w-8 h-10 border-2 border-neutral-300 rounded shrink-0 grid grid-cols-2 grid-rows-2 p-0.5 gap-0.5">
                    <div className="bg-red-300 rounded-[1px]"></div>
                    <div className="bg-red-300 rounded-[1px]"></div>
                    <div className="bg-red-300 rounded-[1px]"></div>
                    <div className="bg-red-300 rounded-[1px]"></div>
                  </div>
                </div>
              </label>
            </div>

            <button
              onClick={processPdf}
              disabled={!file || isProcessing}
              className="mt-6 w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Generate Printable PDF
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
                      download={`Reformatted_${file?.name || 'Receipts'}.pdf`}
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
                  <h3 className="text-neutral-900 font-semibold mb-2">Ready to Process</h3>
                  <p className="text-neutral-500 text-sm">Upload a PDF file and configure the layout options on the left to generate your printable document.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

