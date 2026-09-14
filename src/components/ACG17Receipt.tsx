import React, { useMemo, useState } from 'react';
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib';
import { Download, FileText, Printer, RotateCcw } from 'lucide-react';

type FormState = {
  receiptNo: string;
  payAmount: string;
  date: string;
  voucherNo: string;
  receivedFrom: string;
  amountWords: string;
  accountOf: string;
  amount: string;
  witnessName: string;
  payeeName: string;
  payingOfficer: string;
  counterSigned: string;
  disbursingOfficer1: string;
  detailText: string;
  date2: string;
  disbursingOfficer2: string;
};

const initialState: FormState = {
  receiptNo: '', payAmount: '', date: '', voucherNo: '', receivedFrom: '', amountWords: '',
  accountOf: '', amount: '', witnessName: '', payeeName: '', payingOfficer: '', counterSigned: '',
  disbursingOfficer1: '', detailText: '', date2: '', disbursingOfficer2: ''
};

const Field = ({label, value, onChange, className='' }: {label:string; value:string; onChange:(v:string)=>void; className?:string}) => (
  <label className={className}>
    <span className="block text-sm font-semibold text-neutral-700 mb-1">{label}</span>
    <input value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none" />
  </label>
);

export default function ACG17Receipt() {
  const [form, setForm] = useState<FormState>(initialState);
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const set = (k: keyof FormState) => (v: string) => setForm(f => ({...f, [k]: v}));

  const preview = useMemo(() => ({...form}), [form]);

  async function generatePdf() {
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage(PageSizes.A4);
      const { width, height } = page.getSize();
      const font = await pdf.embedFont(StandardFonts.TimesRoman);
      const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
      const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
      const boldItalic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
      const mx = 38;
      const right = width - 38;
      const black = rgb(0,0,0);
      const size = 9.5;
      const boldSize = 10;
      const line = (y:number, t=0.9) => page.drawLine({start:{x:mx,y}, end:{x:right,y}, thickness:t, color:black});
      const text = (s:string,x:number,y:number,sz=size,f=font) => page.drawText(s || '', {x,y,size:sz,font:f,color:black});
      const centered = (s:string,y:number,sz:number,f=font) => { const w=f.widthOfTextAtSize(s||'',sz); text(s,(width-w)/2,y,sz,f); };
      const fitText = (s:string, x:number, y:number, maxW:number, sz=boldSize, f=bold) => { let q=s||''; let z=sz; while(z>7 && f.widthOfTextAtSize(q,z)>maxW) z-=0.2; text(q,x,y,z,f); };

      text(`A.C.G.- 17`, mx, height-43, 8.5, bold);
      centered(`Please Pay Rs. ${preview.payAmount}`, height-43, 12, boldItalic);
      centered(`Rupees ${preview.payAmount ? (preview.amountWords || '') : ''} Only`, height-60, 12, boldItalic);
      centered(`DEPARTMENT OF POSTS - INDIA`, height-88, 15, bold);
      centered(`(See Note below Rule 6 (b) of Appendix II to Posts and Telegraphs Financial Handbook Volume I)`, height-106, 8.5, bold);
      centered(`2nd Edition 2nd Reprinting)`, height-120, 9.2, bold);
      centered(`/Receipt`, height-139, 12, bold);

      text(`The`, mx, height-165, 10.5, bold);
      fitText(preview.date, 105, height-165, 120, 10.5, boldItalic);
      text(`Voucher No`, width-270, height-165, 10.5, bold);
      fitText(preview.voucherNo, width-198, height-165, 80, 10.5, boldItalic);

      text(`Received from`, mx, height-191, 10.5, bold);
      fitText(preview.receivedFrom, mx+105, height-191, width-mx-(mx+105), 10.5, boldItalic);
      text(`The Sum of Rupees`, mx, height-217, 10.5, bold);
      fitText(preview.amountWords, mx+125, height-217, width-mx-(mx+125), 10.5, boldItalic);
      text(`On Account of`, mx, height-243, 10.5, bold);
      fitText(preview.accountOf, mx+95, height-243, width-mx-(mx+95), 10.5, boldItalic);
      text(`/Rs.`, mx, height-295, 10.5, bold);
      fitText(preview.amount, mx+70, height-295, 130, 10.5, boldItalic);

      text(`Witnessed Payment`, mx, height-337, 10, bold);
      text(`Rev Stamp`, width-155, height-346, 9.5, boldItalic);
      line(height-383, 1.1);
      text(`Signature of Witness`, mx+22, height-375, 9.5, bold);
      text(`Signature of Payee`, width-190, height-375, 9.5, bold);

      line(height-444, 0.7);
      const notes = [
        `Note :- If the receipt be not written or not signed in English/Hindi the whole of the portion not in`,
        `English/Hindi must be translated by the Paying Officer. A person signing such receipt in Hindi should be`,
        `required to indicate his full name in block letters within brackets below his signature.`,
        `If the person paid cannot sign, the payment must be certified by the paying officer and atleast one witness.`,
        `If the amount be paid more than Rs. 5000/- a Receipt Stamp of 1/- must be affixed and this stamp must be`,
        `paid for by the person to whom the amount of receipt is paid.`
      ];
      let ny = height-462;
      notes.forEach((n,i)=>{ text(n,mx,ny,8.8,i===2||i===3||i===4||i===5?bold:bold); ny-=12; if(i===2||i===3||i===5) line(ny+5,0.6); });
      text(`1. Certified that the amount included in the voucher has been disbursed to the proper person.`, mx, ny-4, 9.2, bold);
      text(preview.payingOfficer, width-150, ny-58, 9, bold);
      text(`Paying Officer`, width-120, ny-72, 9.5, bold);
      text(preview.counterSigned, width-160, ny-95, 9, bold);
      text(`Counter Signed`, width-130, ny-109, 9.5, bold);
      text(preview.disbursingOfficer1, width-175, ny-151, 9, bold);
      text(`Disbursing Officer`, width-150, ny-165, 9.5, bold);

      const detailY = ny-205;
      const detailLines = [
        `2. Received contents and certified that I have satisfied myself that all advances included in receipt form`,
        `A.C.G. 17 drawn 1 month / 2 months / 3 months previous to this date with the exception of those detailed`,
        `below (of which the total has been refunded from this receipt) has been disbursed to the proper persons`,
        `and that their acceptances have been taken & filed in my office with receipt stamps duly cancelled for`,
        `every payment in excess of Rs. 5000/-`
      ];
      let dy=detailY;
      detailLines.forEach(d=>{ text(d,mx,dy,8.9,bold); dy-=12; });
      text(`Date:`,mx,dy-7,9.5,bold); text(preview.date2,mx+55,dy-7,9.5,bold); text(preview.disbursingOfficer2,width-150,dy-7,9,bold); text(`Disbursing Officer`,width-150,dy-21,9.5,bold);

      const bytes = await pdf.save();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(new Blob([bytes], {type:'application/pdf'})));
    } finally { setBusy(false); }
  }

  function reset() { setForm(initialState); setPdfUrl(null); }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <section className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2"><FileText className="text-red-600" size={20}/><h2 className="font-bold text-lg">ACG-17 Receipt Generator</h2></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Please Pay Rs." value={form.payAmount} onChange={set('payAmount')}/>
          <Field label="Amount in Words" value={form.amountWords} onChange={set('amountWords')}/>
          <Field label="Date" value={form.date} onChange={set('date')}/>
          <Field label="Voucher No." value={form.voucherNo} onChange={set('voucherNo')}/>
        </div>
        <Field label="Received from" value={form.receivedFrom} onChange={set('receivedFrom')}/>
        <Field label="The Sum of Rupees" value={form.amountWords} onChange={set('amountWords')}/>
        <Field label="On Account of" value={form.accountOf} onChange={set('accountOf')}/>
        <Field label="/Rs." value={form.amount} onChange={set('amount')}/>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Witness Name / Sign" value={form.witnessName} onChange={set('witnessName')}/>
          <Field label="Payee Name / Sign" value={form.payeeName} onChange={set('payeeName')}/>
          <Field label="Paying Officer" value={form.payingOfficer} onChange={set('payingOfficer')}/>
          <Field label="Counter Signed" value={form.counterSigned} onChange={set('counterSigned')}/>
          <Field label="Disbursing Officer" value={form.disbursingOfficer1} onChange={set('disbursingOfficer1')}/>
          <Field label="Date (Clause 2)" value={form.date2} onChange={set('date2')}/>
          <Field label="Disbursing Officer (Clause 2)" value={form.disbursingOfficer2} onChange={set('disbursingOfficer2')} className="col-span-2"/>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={generatePdf} disabled={busy} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"><Printer size={18}/>{busy?'Generating…':'Generate PDF'}</button>
          <button onClick={reset} className="rounded-lg border border-neutral-300 px-4 py-2.5 flex items-center gap-2"><RotateCcw size={18}/>Reset</button>
        </div>
        {pdfUrl && <a href={pdfUrl} download="ACG-17-Receipt.pdf" className="w-full rounded-lg bg-neutral-900 text-white font-semibold px-4 py-2.5 flex items-center justify-center gap-2"><Download size={18}/>Download PDF</a>}
      </section>

      <section className="lg:col-span-3 bg-neutral-100 rounded-2xl border border-neutral-200 p-4 overflow-auto">
        <div className="bg-white mx-auto shadow-md" style={{width:'210mm', minHeight:'297mm', padding:'13mm 10mm', fontFamily:'Times New Roman'}}>
          <div className="text-[11px] font-bold">A.C.G.- 17</div>
          <div className="text-center font-bold italic text-[18px] leading-tight">Please Pay Rs. {preview.payAmount || '_____'}<br/>Rupees {preview.amountWords || '________________'} Only</div>
          <div className="text-center font-bold text-[20px] mt-5">DEPARTMENT OF POSTS - INDIA</div>
          <div className="text-center font-bold text-[11px] mt-1">(See Note below Rule 6 (b) of Appendix II to Posts and Telegraphs Financial Handbook Volume I)</div>
          <div className="text-center font-bold text-[12px]">2nd Edition 2nd Reprinting)</div>
          <div className="text-center font-bold text-[16px] mt-2">/Receipt</div>
          <div className="flex justify-between mt-6 font-bold text-[13px]"><span>The &nbsp; <i>{preview.date||'____________'}</i></span><span>Voucher No &nbsp; {preview.voucherNo||'____'}</span></div>
          <div className="mt-5 text-[13px] leading-6"><b>Received from</b> <i>{preview.receivedFrom||'________________________________________'}</i><br/><b>The Sum of Rupees</b> <i>{preview.amountWords||'________________________________'}</i><br/><b>On Account of</b> <i>{preview.accountOf||'________________________________________________'}</i><br/><b>/Rs.</b> <i>{preview.amount||'__________'}</i></div>
          <div className="mt-8 text-[13px] font-bold">Witnessed Payment <span className="float-right italic">Rev Stamp</span></div>
          <div className="border-b-2 border-black mt-10 flex justify-between font-bold text-[12px] pb-1"><span>Signature of Witness</span><span>Signature of Payee</span></div>
          <div className="mt-2 border-t border-black pt-2 text-[11px] leading-tight font-bold">
            Note :- If the receipt be not written or not signed in English/Hindi the whole of the portion not in<br/>English/Hindi must be translated by the Paying Officer. A person signing such receipt in Hindi should be<br/>required to indicate his full name in block letters within brackets below his signature.<hr className="my-1 border-black"/>If the person paid cannot sign, the payment must be certified by the paying officer and atleast one witness.<hr className="my-1 border-black"/>If the amount be paid more than Rs. 5000/- a Receipt Stamp of 1/- must be affixed and this stamp must be<br/>paid for by the person to whom the amount of receipt is paid.
          </div>
          <div className="mt-2 text-[12px] leading-5 font-bold">1. Certified that the amount included in the voucher has been disbursed to the proper person.</div>
          <div className="h-28 flex flex-col justify-end items-end text-[12px] font-bold gap-5"><span>{preview.payingOfficer||''}<br/>Paying Officer</span><span>{preview.counterSigned||''}<br/>Counter Signed</span><span>{preview.disbursingOfficer1||''}<br/>Disbursing Officer</span></div>
          <div className="mt-5 text-[12px] leading-5 font-bold">2. Received contents and certified that I have satisfied myself that all advances included in receipt form<br/>A.C.G. 17 drawn 1 month / 2 months / 3 months previous to this date with the exception of those detailed<br/>below (of which the total has been refunded from this receipt) has been disbursed to the proper persons<br/>and that their acceptances have been taken & filed in my office with receipt stamps duly cancelled for<br/>every payment in excess of Rs. 5000/-</div>
          <div className="mt-5 flex justify-between text-[12px] font-bold"><span>Date: {preview.date2||'__________'}</span><span>{preview.disbursingOfficer2||''}<br/>Disbursing Officer</span></div>
        </div>
      </section>
    </div>
  );
}
