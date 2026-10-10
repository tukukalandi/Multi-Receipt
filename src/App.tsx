/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Grid, 
  FileType, 
  Layers, 
  Scissors, 
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  Table as TableIcon,
  Menu,
  X,
  Search,
  ArrowRight,
  FileImage,
  ChevronRight,
  Sparkles,
  Layers2
} from 'lucide-react';
import { cn } from './lib/utils';
import MultiReceipt from './components/MultiReceipt';
import PdfToWord from './components/PdfToWord';
import PdfMerger from './components/PdfMerger';
import PdfSplitter from './components/PdfSplitter';
import WordToPdf from './components/WordToPdf';
import ImageConverter from './components/ImageConverter';
import WordToExcel from './components/WordToExcel';
import ExcelToWord from './components/ExcelToWord';
import ImageToPdf, { ImageToPdfPreset } from './components/ImageToPdf';

export type Tab = 
  | 'receipts' 
  | 'jpg2pdf'
  | 'png2pdf'
  | 'img2pdf'
  | 'pdf2word' 
  | 'word2pdf' 
  | 'pdfmerge' 
  | 'pdfsplit' 
  | 'imgconvert' 
  | 'word2excel' 
  | 'excel2word';

interface ConverterItem {
  id: Tab;
  title: string;
  description: string;
  category: 'Image to PDF' | 'PDF Tools' | 'Word & Excel' | 'Image Format';
  icon: React.ReactNode;
  badge?: string;
}

const ALL_CONVERTERS: ConverterItem[] = [
  // Image to PDF Converters (New)
  {
    id: 'jpg2pdf',
    title: 'JPG / JPEG to PDF Converter',
    description: 'Convert JPG and JPEG photos or scanned documents into clean, multi-page PDFs.',
    category: 'Image to PDF',
    icon: <FileImage size={20} className="text-red-600" />,
    badge: 'New'
  },
  {
    id: 'png2pdf',
    title: 'PNG to PDF Converter',
    description: 'Convert PNG graphics, digital forms, and pictures into high quality PDF files.',
    category: 'Image to PDF',
    icon: <FileImage size={20} className="text-red-600" />,
    badge: 'New'
  },
  {
    id: 'img2pdf',
    title: 'All Images to PDF',
    description: 'Combine mixed JPG, JPEG, and PNG images into a single sorted PDF document.',
    category: 'Image to PDF',
    icon: <ImageIcon size={20} className="text-red-600" />,
    badge: 'New'
  },

  // Document & PDF Tools
  {
    id: 'pdf2word',
    title: 'PDF to Word Converter',
    description: 'Convert PDF files into fully editable Microsoft Word (.docx) documents.',
    category: 'PDF Tools',
    icon: <FileType size={20} className="text-blue-600" />
  },
  {
    id: 'word2pdf',
    title: 'Word to PDF Converter',
    description: 'Convert Microsoft Word (.docx) documents into standard print-ready PDFs.',
    category: 'PDF Tools',
    icon: <FileCode size={20} className="text-blue-600" />
  },
  {
    id: 'pdfmerge',
    title: 'PDF Merger',
    description: 'Combine and merge multiple PDF documents into a single organized file.',
    category: 'PDF Tools',
    icon: <Layers size={20} className="text-blue-600" />
  },
  {
    id: 'pdfsplit',
    title: 'PDF Splitter',
    description: 'Extract individual pages or custom page ranges (e.g. 1-3, 5) from PDF files.',
    category: 'PDF Tools',
    icon: <Scissors size={20} className="text-blue-600" />
  },

  // Spreadsheet & Word Tools
  {
    id: 'word2excel',
    title: 'Word to Excel Converter',
    description: 'Extract tables, accounts, and lists from Word .docx into Excel .xlsx workbooks.',
    category: 'Word & Excel',
    icon: <FileSpreadsheet size={20} className="text-emerald-600" />,
    badge: 'Popular'
  },
  {
    id: 'excel2word',
    title: 'Excel to Word Converter',
    description: 'Convert Excel spreadsheets (.xlsx/.xls) into styled Microsoft Word tables.',
    category: 'Word & Excel',
    icon: <TableIcon size={20} className="text-emerald-600" />,
    badge: 'Popular'
  },

  // Image Format Converter
  {
    id: 'imgconvert',
    title: 'Image Converter (PNG ⇄ JPG ⇄ JPEG)',
    description: 'Convert between PNG, JPG, and JPEG with custom compression & background fill.',
    category: 'Image Format',
    icon: <ImageIcon size={20} className="text-purple-600" />
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('receipts');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectConverter = (id: Tab) => {
    setActiveTab(id);
    setIsMenuOpen(false);
    setSearchQuery('');
  };

  const filteredConverters = ALL_CONVERTERS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  const categories = ['Image to PDF', 'PDF Tools', 'Word & Excel', 'Image Format'] as const;

  // Find info of currently selected converter if not on receipts
  const currentConverter = ALL_CONVERTERS.find((c) => c.id === activeTab);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {/* Header with Postal Branding and Preparer Attribution */}
      <header className="bg-red-600 border-b border-red-700 py-5 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 sm:gap-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-yellow-400 text-red-700 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Post Office Office & Document Tools</h1>
            <p className="text-sm text-red-100 font-medium mt-0.5">
              Receipts, PDF Tools, Word ⇄ Excel & Image to PDF Suite
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs sm:text-sm text-red-100 font-medium bg-red-700/50 px-3 py-1.5 rounded-lg border border-red-500/30">
            Prepared by Kalandi Charan Sahoo, PA, Dhenkanal RS SO
          </p>
        </div>
      </header>

      {/* Navigation Bar: ONLY Menu (Three Lines) Button and Multi Receipt Printer Button */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Menu (Three Lines) Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open all converters menu"
                className={cn(
                  "py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs border",
                  isMenuOpen
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border-neutral-300/80 active:scale-[0.98]"
                )}
              >
                <Menu size={19} className="text-red-600" />
                <span className="tracking-wide">All Converters Menu</span>
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-bold uppercase">
                  9 Tools
                </span>
              </button>

              {/* ONLY Multi-Receipt Printer Button in the navigation bar */}
              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={cn(
                  "py-2.5 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all shadow-xs shrink-0",
                  activeTab === 'receipts'
                    ? "bg-red-600 text-white shadow-red-600/20"
                    : "text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300"
                )}
              >
                <Grid size={18} className={activeTab === 'receipts' ? "text-white" : "text-neutral-500"} />
                <span>Multi-Receipt Printer</span>
              </button>
            </div>

            {/* Current Active Converter Indicator / Switcher */}
            {activeTab !== 'receipts' && currentConverter && (
              <div className="hidden md:flex items-center gap-2 bg-neutral-100/90 py-1.5 px-3 rounded-xl border border-neutral-200 text-xs">
                <span className="text-neutral-500 font-medium">Active Converter:</span>
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  {currentConverter.title}
                </span>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="ml-2 text-red-600 hover:text-red-700 font-semibold underline underline-offset-2 hover:bg-red-50 px-2 py-0.5 rounded"
                >
                  Change Tool
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb banner on small screens when a converter is active */}
      {activeTab !== 'receipts' && currentConverter && (
        <div className="md:hidden bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-red-900 font-semibold truncate">
            <span>Tool:</span>
            <span className="truncate">{currentConverter.title}</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-red-700 font-bold underline shrink-0 ml-2"
          >
            Switch
          </button>
        </div>
      )}

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === 'receipts' && <MultiReceipt />}
        {activeTab === 'jpg2pdf' && <ImageToPdf key="jpg2pdf" initialPreset="jpg" />}
        {activeTab === 'png2pdf' && <ImageToPdf key="png2pdf" initialPreset="png" />}
        {activeTab === 'img2pdf' && <ImageToPdf key="img2pdf" initialPreset="all" />}
        {activeTab === 'pdf2word' && <PdfToWord />}
        {activeTab === 'word2pdf' && <WordToPdf />}
        {activeTab === 'pdfmerge' && <PdfMerger />}
        {activeTab === 'pdfsplit' && <PdfSplitter />}
        {activeTab === 'imgconvert' && <ImageConverter />}
        {activeTab === 'word2excel' && <WordToExcel />}
        {activeTab === 'excel2word' && <ExcelToWord />}
      </main>

      {/* All Converters Drawer / Menu (Three Lines Modal) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Dialog Panel */}
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
                  <Menu size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <span>All Converters & Tools</span>
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                      Full Office Suite
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Select any converter below to immediately switch and start processing files.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-4 sm:px-6 border-b border-neutral-200 bg-white">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search converters (e.g. PDF, Word, Excel, JPG, PNG, Merge, Split)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Converters Grid by Category */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Quick Link to Multi-Receipt Printer */}
              <div 
                onClick={() => selectConverter('receipts')}
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                  activeTab === 'receipts'
                    ? "bg-red-50 border-red-500 ring-1 ring-red-500"
                    : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-400 text-red-800 rounded-xl font-bold">
                    <Grid size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                      <span>Multi-Receipt Printer</span>
                      <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                        Primary Nav
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Optimize postal receipts into 4-in-1 or 6-in-1 A4 sheet layout for efficient printing.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-red-600">
                  <span>Open Tool</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {filteredConverters.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <p className="text-base font-semibold">No converters found matching "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try searching for keywords like "pdf", "jpg", "excel", or "word".</p>
                </div>
              ) : (
                categories.map((category) => {
                  const items = filteredConverters.filter((item) => item.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold tracking-wider uppercase text-neutral-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                          <span>{category}</span>
                        </h3>
                        <span className="text-[11px] font-medium text-neutral-400">
                          {items.length} {items.length === 1 ? 'tool' : 'tools'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((item) => {
                          const isSelected = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectConverter(item.id)}
                              className={cn(
                                "text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group",
                                isSelected
                                  ? "bg-red-50/70 border-red-500 shadow-xs ring-1 ring-red-500"
                                  : "bg-white border-neutral-200 hover:border-red-300 hover:shadow-xs hover:bg-neutral-50/50"
                              )}
                            >
                              <div className={cn(
                                "p-2.5 rounded-xl shrink-0 transition-colors",
                                isSelected ? "bg-red-600 text-white" : "bg-neutral-100 group-hover:bg-red-100"
                              )}>
                                {item.icon}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={cn(
                                    "font-bold text-sm truncate",
                                    isSelected ? "text-red-900" : "text-neutral-800 group-hover:text-red-700"
                                  )}>
                                    {item.title}
                                  </h4>
                                  {item.badge && (
                                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              <div className="text-neutral-300 group-hover:text-red-600 transition-colors shrink-0 self-center">
                                <ArrowRight size={16} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span className="hidden sm:inline">Tip: Press <kbd className="px-1.5 py-0.5 bg-neutral-200 rounded text-neutral-700 font-mono text-[10px]">Esc</kbd> anytime to close this menu.</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="ml-auto font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-200/70 transition-colors"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
