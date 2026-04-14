"use client";
import { useState, useMemo } from "react";
import {
  FileText, Upload, X, CheckCircle2, Loader2, Download,
  Brain, Database, Zap, ChevronRight, Sparkles, Scale, ArrowRight, Eye, RefreshCw,
} from "lucide-react";

const FIRST_NAMES = ["Arun","Priya","Vikram","Sunita","Rajesh","Kavita","Mohd.","Deepak","Lakshmi","Sanjay","Ravi","Meena","Gopal","Nirmala","Suresh","Anjali","Karan","Pooja","Ramesh","Geeta"];
const LAST_NAMES = ["Sharma","Patel","Singh","Gupta","Reddy","Kumar","Verma","Joshi","Iyer","Nair","Das","Mehta","Rao","Mishra","Shah","Bose","Desai","Kapoor","Saxena","Pillai"];
const STATES = ["Maharashtra","Delhi","Karnataka","Tamil Nadu","Uttar Pradesh","West Bengal","Rajasthan","Gujarat","Kerala","Madhya Pradesh","Bihar","Telangana","Punjab","Odisha","Andhra Pradesh"];
const DISTRICTS = ["Mumbai","New Delhi","Bengaluru","Chennai","Lucknow","Kolkata","Jaipur","Ahmedabad","Kochi","Bhopal","Patna","Hyderabad","Chandigarh","Bhubaneswar","Vijayawada"];
const COURTS = [{name:"Supreme Court of India",level:"Supreme Court"},{name:"Bombay High Court",level:"High Court"},{name:"Delhi High Court",level:"High Court"},{name:"Madras High Court",level:"High Court"},{name:"Calcutta High Court",level:"High Court"},{name:"Karnataka High Court",level:"High Court"},{name:"Allahabad High Court",level:"High Court"},{name:"Rajasthan High Court",level:"High Court"},{name:"Gujarat High Court",level:"High Court"},{name:"National Green Tribunal",level:"High Court"}];
const JUDGES = ["Justice D.Y. Chandrachud","Justice Sanjiv Khanna","Justice B.R. Gavai","Justice Surya Kant","Justice Hima Kohli","Justice Aniruddha Bose","Justice Vikram Nath","Justice Prathiba M. Singh","Justice Krishna S. Dixit","Justice Arun Tandon"];
const CATEGORIES = [
  {cat:"Criminal - Homicide",acts:["Indian Penal Code, 1860","Code of Criminal Procedure, 1973"],secs:["Section 302 IPC","Section 304 IPC"],tags:["murder","circumstantial evidence","last seen theory"],head:"Murder conviction based on circumstantial evidence - Chain of circumstances complete - Recovery of weapon corroborates prosecution case.",full:"The prosecution established that the accused was last seen with the deceased. Recovery of the weapon at the instance of accused strengthens the chain of evidence. The High Court rightly upheld the conviction. No hypothesis consistent with innocence exists."},
  {cat:"Criminal - Bail",acts:["Code of Criminal Procedure, 1973","Narcotic Drugs and Psychotropic Substances Act, 1985"],secs:["Section 439 CrPC","Section 37 NDPS Act"],tags:["bail","NDPS","speedy trial","Article 21"],head:"Bail in NDPS case - Prolonged incarceration - Small quantity - Right to speedy trial under Article 21.",full:"The applicant has been in custody for over two years. The quantity recovered is small under the NDPS Act. Trial has not progressed. Considering Article 21 and Section 436A CrPC, bail is granted."},
  {cat:"Constitutional - Fundamental Rights",acts:["Constitution of India","Information Technology Act, 2000"],secs:["Article 14","Article 19(1)(a)","Article 21"],tags:["privacy","digital rights","fundamental rights","Article 21"],head:"Right to Privacy - Digital surveillance - Proportionality test - Data protection framework directed.",full:"The right to privacy under Article 21 requires the State to pass the three-fold test of legality, necessity and proportionality for any surveillance. Mass surveillance without judicial oversight violates fundamental rights."},
  {cat:"Family - Matrimonial Disputes",acts:["Hindu Marriage Act, 1955","Protection of Women from Domestic Violence Act, 2005"],secs:["Section 13(1)(ia) HMA","Section 125 CrPC"],tags:["divorce","cruelty","maintenance","matrimonial"],head:"Divorce on ground of mental cruelty - Persistent dowry demands - Maintenance awarded to wife.",full:"The wife established persistent cruelty through continuous dowry demands. Marriage dissolved under Section 13(1)(ia) HMA. Maintenance of Rs. 50,000 per month awarded."},
  {cat:"Environmental Law",acts:["Environment Protection Act, 1986","Water Act, 1974"],secs:["Section 3 EPA","Section 24 Water Act"],tags:["pollution","environment","polluter pays","river contamination"],head:"Industrial pollution - Polluter pays principle - Compensation to affected villagers - Unit closure ordered.",full:"The unit discharged untreated effluents causing severe river contamination. Applying the polluter pays principle, compensation of Rs. 50 lakhs is directed. Unit to remain closed until proper effluent treatment is operational."},
  {cat:"Taxation",acts:["Income Tax Act, 1961"],secs:["Section 68","Section 147","Section 143(3)"],tags:["income tax","reassessment","cash credits","Section 68"],head:"Reassessment under Section 147 - Unexplained cash credits - Burden on assessee to prove identity and creditworthiness.",full:"The assessee failed to prove identity, creditworthiness and genuineness of cash credits under Section 68. Mere PAN cards and bank statements are insufficient. The addition of Rs. 3.5 crores is sustained."},
  {cat:"Commercial - Intellectual Property",acts:["Copyright Act, 1957","Patents Act, 1970"],secs:["Section 14 Copyright Act","Section 51 Copyright Act"],tags:["copyright","patent","intellectual property","injunction"],head:"Software copyright infringement - Source code similarity - Clean room defense rejected - Injunction granted.",full:"Substantial similarity between proprietary code and defendant product is demonstrated. Clean room defense fails as developers had prior access. Injunction granted. Damages of Rs. 2.5 crores awarded."},
  {cat:"Consumer Protection",acts:["Consumer Protection Act, 2019","RERA, 2016"],secs:["Section 2(7) CPA","Section 18 RERA"],tags:["consumer","deficiency of service","product liability","RERA"],head:"Deficiency in service - Delayed possession of flat - Builder directed to pay compensation and refund.",full:"The builder failed to deliver possession within the agreed timeline. This constitutes deficiency of service. Builder directed to refund the amount with 9% interest or deliver possession within 6 months with Rs. 5 lakh compensation."},
  {cat:"Labour and Employment",acts:["Industrial Disputes Act, 1947","Payment of Wages Act, 1936"],secs:["Section 25F ID Act","Section 11A ID Act"],tags:["retrenchment","reinstatement","wages","labour"],head:"Illegal retrenchment - Non-compliance with Section 25F - Reinstatement with back wages ordered.",full:"The workman was retrenched without complying with Section 25F. No retrenchment compensation was paid and no notice given. The retrenchment is set aside. Reinstatement with 50% back wages ordered."},
  {cat:"Criminal - Cyber Crime",acts:["Information Technology Act, 2000","Indian Penal Code, 1860"],secs:["Section 66 IT Act","Section 420 IPC","Section 66C IT Act"],tags:["cyber crime","phishing","identity theft","online fraud"],head:"Online banking fraud - Phishing attack - Identity theft - Accused convicted under IT Act and IPC.",full:"The accused created fake banking websites to harvest login credentials. Over 200 victims lost funds totalling Rs. 1.2 crores. Digital forensic evidence traced transactions to the accused. Conviction under Section 66 IT Act and Section 420 IPC upheld."},
];
const DISPOSITIONS = ["Allowed","Dismissed","Partly Allowed","Remanded"] as const;

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] { const s=[...arr]; for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];} return s.slice(0,n); }
function randYear() { return 2018 + Math.floor(Math.random()*7); }
function randDate(y:number) { const m=String(1+Math.floor(Math.random()*12)).padStart(2,"0"); const d=String(1+Math.floor(Math.random()*28)).padStart(2,"0"); return `${y}-${m}-${d}`; }

interface GeneratedJudgment {
  _id: string; filename: string; caseNumber: string; caseTitle: string; court: string;
  courtLevel: string; bench: string[]; dateOfJudgment: string; year: number;
  disposition: string; category: string; acts: string[]; sections: string[];
  headnotes: string; fullText: string; snippet: string; citedBy: string[]; citesTo: string[];
  district: string; state: string; petitioner: string; respondent: string; tags: string[];
}

function generateJudgments(count: number): GeneratedJudgment[] {
  const out: GeneratedJudgment[] = [];
  for (let i = 0; i < count; i++) {
    const cat = pick(CATEGORIES);
    const court = pick(COURTS);
    const stIdx = Math.floor(Math.random() * STATES.length);
    const y = randYear();
    const p = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const r = Math.random()>0.5 ? `State of ${STATES[stIdx]}` : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const caseNum = `${pick(["WP(C)","SLP(Crl.)","CrlA","FA","CS(Comm)","BA","ITA","OA"])} ${1000+Math.floor(Math.random()*9000)}/${y}`;
    const id = `ingest_${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`;
    out.push({
      _id: id,
      filename: `${court.level.replace(/ /g,"_")}_${caseNum.replace(/[^a-zA-Z0-9]/g,"_")}.pdf`,
      caseNumber: caseNum, caseTitle: `${p} v. ${r}`,
      court: court.name, courtLevel: court.level,
      bench: pickN(JUDGES, Math.random()>0.6?2:1),
      dateOfJudgment: randDate(y), year: y,
      disposition: pick([...DISPOSITIONS]),
      category: cat.cat, acts: cat.acts, sections: cat.secs,
      headnotes: cat.head, fullText: cat.full,
      snippet: cat.head.split(" - ").slice(0,2).join(". ")+".",
      citedBy: [], citesTo: [],
      district: DISTRICTS[stIdx] || "New Delhi",
      state: STATES[stIdx], petitioner: p, respondent: r,
      tags: cat.tags,
    });
  }
  return out;
}

function generatePDF(j: GeneratedJudgment) {
  import("jspdf").then(({ jsPDF }) => {
    const doc = new jsPDF({ unit:"mm", format:"a4" });
    const W = 210, M = 20, TW = W - 2*M;
    let y = 25;
    const ln = (size:number, style:string, text:string, align?:string) => {
      doc.setFontSize(size); doc.setFont("helvetica", style);
      const lines = doc.splitTextToSize(text, TW);
      if (align==="center") { lines.forEach((l:string) => { doc.text(l, W/2, y, {align:"center"}); y+=size*0.45; }); }
      else { doc.text(lines, M, y); y += lines.length * size * 0.45; }
      y += 2;
    };
    // Header
    doc.setDrawColor(0,100,0); doc.setLineWidth(0.8); doc.line(M, 18, W-M, 18);
    ln(9,"italic",j.court,"center");
    y+=2; ln(13,"bold",j.caseTitle,"center");
    ln(10,"normal",j.caseNumber,"center");
    ln(8,"italic",`Date of Judgment: ${j.dateOfJudgment}`,"center");
    ln(8,"italic",`Bench: ${j.bench.join(", ")}`,"center");
    y+=2; doc.setDrawColor(180); doc.line(M, y, W-M, y); y+=6;
    // Headnotes
    ln(9,"bold","HEADNOTES"); ln(9,"italic",j.headnotes); y+=3;
    // Judgment
    ln(9,"bold","JUDGMENT"); ln(9,"normal",j.fullText); y+=3;
    // Acts
    ln(9,"bold","ACTS & SECTIONS CITED");
    ln(9,"normal",[...j.acts,...j.sections].join(" | ")); y+=3;
    // Disposition
    ln(9,"bold","DISPOSITION"); ln(10,"bold",j.disposition); y+=3;
    // Tags
    ln(9,"bold","TAGS"); ln(9,"normal",j.tags.join(", "));
    // Footer
    doc.setDrawColor(0,100,0); doc.line(M, 280, W-M, 280);
    doc.setFontSize(7); doc.setFont("helvetica","italic");
    doc.text("Generated by JusticeSearch.ai | MongoDB Atlas Demo", W/2, 285, {align:"center"});
    doc.save(`${j.caseNumber.replace(/[^a-zA-Z0-9]/g,"_")}.pdf`);
  });
}

interface IngestPDFProps { onClose: () => void; onIngested: () => void; }
interface IngestStep { step: string; time: number; detail: string; }
interface IngestResult { success: boolean; totalTime: number; documentId: string; totalDocuments: number; hasEmbedding: boolean; embeddingDimensions: number; steps: IngestStep[]; }

export default function IngestPDF({ onClose, onIngested }: IngestPDFProps) {
  const [pdfs, setPdfs] = useState<GeneratedJudgment[]>(() => generateJudgments(6));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [currentStep, setCurrentStep] = useState("");
  const [ingestedPdf, setIngestedPdf] = useState<GeneratedJudgment | null>(null);

  const refreshPdfs = () => { setPdfs(generateJudgments(6)); setSelectedIdx(null); setPreviewMode(false); };

  const handleIngest = async (idx: number) => {
    const pdf = pdfs[idx];
    setIngesting(true); setIngestedPdf(pdf);
    setCurrentStep("Extracting text from PDF..."); await sleep(600);
    setCurrentStep("Parsing judgment metadata..."); await sleep(400);
    setCurrentStep("Generating Voyage AI embedding...");
    try {
      const res = await fetch("/api/ingest", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({judgment:pdf}) });
      setCurrentStep("Inserting into MongoDB Atlas...");
      const data = await res.json();
      if (data.success) { setResult(data); onIngested(); }
      else { setCurrentStep("Error: "+data.error); }
    } catch { setCurrentStep("Ingestion failed"); }
    finally { setIngesting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e)=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">PDF Judgment Ingestion</h2>
              <p className="text-[12px] text-slate-500">Extract → Embed → Index → Search-Ready</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6">
          {result && ingestedPdf ? (
            <SuccessView result={result} pdf={ingestedPdf} onAnother={()=>{setResult(null);setSelectedIdx(null);setPreviewMode(false);setIngestedPdf(null);refreshPdfs();}} />
          ) : previewMode && selectedIdx !== null ? (
            <PreviewView pdf={pdfs[selectedIdx]} onBack={()=>setPreviewMode(false)} onIngest={()=>handleIngest(selectedIdx)} ingesting={ingesting} currentStep={currentStep} />
          ) : (
            <SelectionView pdfs={pdfs} onSelect={(i)=>{setSelectedIdx(i);setPreviewMode(true);}} onRefresh={refreshPdfs} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Selection View ── */
function SelectionView({ pdfs, onSelect, onRefresh }: { pdfs: GeneratedJudgment[]; onSelect:(i:number)=>void; onRefresh:()=>void; }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200/60 rounded-2xl">
        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 text-blue-600" /></div>
        <div>
          <p className="text-[13px] font-bold text-blue-800">How PDF Ingestion Works</p>
          <p className="text-[12px] text-blue-600 mt-0.5">Select a judgment PDF → Preview extracted data → Confirm → System generates a <strong>1024-dim Voyage AI embedding</strong>, creates a MongoDB document, and makes it instantly searchable via <strong>Atlas Search + Vector Search</strong>.</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2 flex-wrap">
        {[
          {icon:FileText,label:"PDF Upload",color:"bg-orange-500"},
          {icon:Scale,label:"Text Extract",color:"bg-amber-500"},
          {icon:Brain,label:"Voyage AI Embed",color:"bg-violet-500"},
          {icon:Database,label:"MongoDB Insert",color:"bg-emerald-500"},
          {icon:Sparkles,label:"Search Ready",color:"bg-blue-500"},
        ].map((s,i)=>(
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center shadow-md`}><s.icon className="w-4 h-4 text-white" /></div>
              <span className="text-[9px] text-slate-500 font-semibold">{s.label}</span>
            </div>
            {i<4 && <ChevronRight className="w-4 h-4 text-slate-300 mt-[-14px]" />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-slate-700">Select a Judgment PDF to Ingest</p>
        <button onClick={onRefresh} className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pdfs.map((pdf,i)=>(
          <button key={pdf._id} onClick={()=>onSelect(i)} className="group text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 bg-white hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className="w-12 h-14 bg-red-50 border border-red-200/60 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-500" /><span className="text-[7px] font-bold text-red-400 mt-0.5">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-slate-400 truncate">{pdf.filename}</p>
                <p className="text-[13px] font-bold text-slate-800 mt-0.5 line-clamp-1">{pdf.caseTitle}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{pdf.courtLevel}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{pdf.category}</span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">{pdf.year}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-3.5 h-3.5" /><span className="text-[10px] font-semibold">Preview</span></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Preview View ── */
function PreviewView({ pdf, onBack, onIngest, ingesting, currentStep }: { pdf:GeneratedJudgment; onBack:()=>void; onIngest:()=>void; ingesting:boolean; currentStep:string; }) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[12px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1">← Back to selection</button>
        <button onClick={()=>generatePDF(pdf)} className="flex items-center gap-1.5 text-[12px] text-red-600 hover:text-red-800 font-semibold transition-colors"><Download className="w-3.5 h-3.5" />Download PDF</button>
      </div>

      <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-red-400" /><span className="text-[12px] text-slate-300 font-mono">{pdf.filename}</span></div>
          <span className="text-[10px] text-slate-500">Judgment PDF Preview</span>
        </div>
        <div className="bg-white p-6 space-y-4 font-serif max-h-[350px] overflow-y-auto">
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">{pdf.court}</p>
            <p className="text-[14px] font-bold text-slate-900">{pdf.caseTitle}</p>
            <p className="text-[12px] text-slate-600">{pdf.caseNumber}</p>
            <p className="text-[11px] text-slate-400">Date: {pdf.dateOfJudgment} | Bench: {pdf.bench.join(", ")}</p>
          </div>
          <div><p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Headnotes</p><p className="text-[12px] text-slate-600 leading-relaxed italic">{pdf.headnotes}</p></div>
          <div><p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Judgment</p><p className="text-[12px] text-slate-700 leading-relaxed">{pdf.fullText}</p></div>
          <div><p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Acts & Sections</p><div className="flex flex-wrap gap-1">{[...pdf.acts,...pdf.sections].map((s,i)=>(<span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>))}</div></div>
          <div className="border-t border-slate-200 pt-3"><p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Disposition</p><span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${pdf.disposition==="Allowed"?"bg-emerald-100 text-emerald-700":pdf.disposition==="Dismissed"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{pdf.disposition}</span></div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
        <h4 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Extracted MongoDB Document Preview</h4>
        <div className="bg-[#1E293B] rounded-xl p-4 overflow-x-auto">
          <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed">{`{
  caseTitle: "${pdf.caseTitle}",
  court: "${pdf.court}",
  courtLevel: "${pdf.courtLevel}",
  category: "${pdf.category}",
  disposition: "${pdf.disposition}",
  year: ${pdf.year}, state: "${pdf.state}",
  acts: ${JSON.stringify(pdf.acts)},
  tags: ${JSON.stringify(pdf.tags)},
  embedding: [/* 1024-dim voyage-law-2 vector */]
}`}</pre>
        </div>
      </div>

      <button onClick={onIngest} disabled={ingesting} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98]">
        {ingesting ? (<><Loader2 className="w-5 h-5 animate-spin" />{currentStep}</>) : (<><Upload className="w-5 h-5" />Ingest This Judgment into MongoDB Atlas</>)}
      </button>
    </div>
  );
}

/* ── Success View ── */
function SuccessView({ result, pdf, onAnother }: { result:IngestResult; pdf:GeneratedJudgment; onAnother:()=>void; }) {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
        <h3 className="text-xl font-bold text-slate-900">Judgment Ingested Successfully!</h3>
        <p className="text-[13px] text-slate-500 mt-1">Document is now searchable via Atlas Search & Vector Search</p>
        <p className="text-[12px] font-semibold text-slate-700 mt-2">{pdf.caseTitle}</p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
        <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Ingestion Pipeline</h4>
        <div className="space-y-2">
          {[
            {icon:FileText,label:"PDF Text Extraction",time:"~600ms",detail:"Parsed judgment text, metadata, and sections",color:"text-orange-500 bg-orange-100"},
            {icon:Brain,label:"Metadata Parsing",time:"~400ms",detail:"Extracted case number, parties, acts, tags",color:"text-violet-500 bg-violet-100"},
            ...result.steps.map(s=>({icon:s.step.includes("Voyage")?Sparkles:s.step.includes("MongoDB")?Database:Zap,label:s.step,time:s.time+"ms",detail:s.detail,color:s.step.includes("Voyage")?"text-blue-500 bg-blue-100":"text-emerald-500 bg-emerald-100"})),
          ].map((step,i)=>(
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}><step.icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><span className="text-[12px] font-bold text-slate-800">{step.label}</span><span className="text-[11px] font-mono text-emerald-600 font-bold">{step.time}</span></div>
                <p className="text-[11px] text-slate-500 truncate">{step.detail}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase">Total Time</p><p className="text-[22px] font-extrabold text-slate-900 mt-1">{result.totalTime}ms</p><p className="text-[10px] text-emerald-600 font-medium">End to end</p></div>
        <div className="bg-slate-50 rounded-xl p-4 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase">Embedding</p><p className="text-[22px] font-extrabold text-slate-900 mt-1">{result.hasEmbedding?result.embeddingDimensions+"-dim":"None"}</p><p className="text-[10px] text-emerald-600 font-medium">voyage-law-2</p></div>
        <div className="bg-slate-50 rounded-xl p-4 text-center"><p className="text-[10px] font-semibold text-slate-500 uppercase">Collection</p><p className="text-[22px] font-extrabold text-slate-900 mt-1">{result.totalDocuments.toLocaleString()}</p><p className="text-[10px] text-emerald-600 font-medium">Total documents</p></div>
      </div>

      <div className="flex gap-3">
        <button onClick={()=>generatePDF(pdf)} className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />Download Judgment PDF
        </button>
        <button onClick={onAnother} className="flex-1 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2">
          Ingest Another <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
