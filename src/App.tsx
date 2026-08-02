/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Grid, FileType, Layers, Scissors, FileCode } from 'lucide-react';
import { cn } from './lib/utils';
import MultiReceipt from './components/MultiReceipt';
import PdfToWord from './components/PdfToWord';
import PdfMerger from './components/PdfMerger';
import PdfSplitter from './components/PdfSplitter';
import WordToPdf from './components/WordToPdf';

type Tab = 'receipts' | 'pdf2word' | 'pdfmerge' | 'pdfsplit' | 'word2pdf';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('receipts');

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      <header className="bg-red-600 border-b border-red-700 py-6 px-8 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 sm:gap-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-yellow-400 text-red-700 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Post Office PDF Tools</h1>
            <p className="text-sm text-red-100 font-medium mt-0.5">Format receipts or convert documents</p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-sm text-red-100 font-medium bg-red-700/50 px-3 py-1.5 rounded-lg border border-red-500/30">
            Prepared by Kalandi Charan Sahoo, PA, Dhenkanal RS SO
          </p>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('receipts')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'receipts' 
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <Grid size={18} />
              Multi-Receipt Printer
            </button>
            <button
              onClick={() => setActiveTab('pdf2word')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'pdf2word' 
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <FileType size={18} />
              PDF to Word Converter
            </button>
            <button
              onClick={() => setActiveTab('pdfmerge')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'pdfmerge' 
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <Layers size={18} />
              PDF Merger
            </button>
            <button
              onClick={() => setActiveTab('pdfsplit')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'pdfsplit' 
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <Scissors size={18} />
              PDF Splitter
            </button>
            <button
              onClick={() => setActiveTab('word2pdf')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'word2pdf' 
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <FileCode size={18} />
              Word to PDF
            </button>
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        {activeTab === 'receipts' && <MultiReceipt />}
        {activeTab === 'pdf2word' && <PdfToWord />}
        {activeTab === 'pdfmerge' && <PdfMerger />}
        {activeTab === 'pdfsplit' && <PdfSplitter />}
        {activeTab === 'word2pdf' && <WordToPdf />}
      </main>
    </div>
  );
}

