/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { FileText, Grid, FileType, Layers, Scissors, FileCode, Receipt } from 'lucide-react';
import { cn } from './lib/utils';
import MultiReceipt from './components/MultiReceipt';
import PdfToWord from './components/PdfToWord';
import PdfMerger from './components/PdfMerger';
import PdfSplitter from './components/PdfSplitter';
import WordToPdf from './components/WordToPdf';
import ACG17Receipt from './components/ACG17Receipt';

type Tab = 'receipts' | 'acg17' | 'pdf2word' | 'pdfmerge' | 'pdfsplit' | 'word2pdf';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('acg17');
  const tabs: {id:Tab; label:string; icon:React.ReactNode}[] = [
    {id:'receipts',label:'Multi-Receipt Printer',icon:<Grid size={18}/>},
    {id:'acg17',label:'ACG-17 Receipt',icon:<Receipt size={18}/>},
    {id:'pdf2word',label:'PDF to Word Converter',icon:<FileType size={18}/>},
    {id:'pdfmerge',label:'PDF Merger',icon:<Layers size={18}/>},
    {id:'pdfsplit',label:'PDF Splitter',icon:<Scissors size={18}/>},
    {id:'word2pdf',label:'Word to PDF',icon:<FileCode size={18}/>},
  ];
  return <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
    <header className="bg-red-600 border-b border-red-700 py-6 px-8 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
      <div className="flex items-center"><div className="w-10 h-10 bg-yellow-400 text-red-700 rounded-xl flex items-center justify-center mr-4"><FileText size={24}/></div><div><h1 className="text-2xl font-bold tracking-tight text-white">Post Office PDF Tools</h1><p className="text-sm text-red-100 font-medium mt-0.5">Postal forms, receipts and document tools</p></div></div>
      <div className="text-center sm:text-right"><p className="text-sm text-red-100 font-medium bg-red-700/50 px-3 py-1.5 rounded-lg border border-red-500/30">Prepared by Kalandi Charan Sahoo, Dhenkanal Division</p></div>
    </header>
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm"><div className="max-w-6xl mx-auto px-6"><nav className="flex space-x-7 overflow-x-auto">{tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={cn('py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap',activeTab===t.id?'border-red-600 text-red-600':'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300')}>{t.icon}{t.label}</button>)}</nav></div></div>
    <main className="flex-1 max-w-6xl w-full mx-auto p-8">
      {activeTab==='receipts'&&<MultiReceipt/>}{activeTab==='acg17'&&<ACG17Receipt/>}{activeTab==='pdf2word'&&<PdfToWord/>}{activeTab==='pdfmerge'&&<PdfMerger/>}{activeTab==='pdfsplit'&&<PdfSplitter/>}{activeTab==='word2pdf'&&<WordToPdf/>}
    </main>
  </div>;
}
