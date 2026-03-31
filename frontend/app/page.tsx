"use client";

import { useState, useRef, useEffect } from "react";
// Text-only branding — no FlowerLogo

type Step = "upload" | "parsing" | "template" | "tasks" | "parsing_tasks" | "generating" | "result";
type Mode = "upload" | "manual";

interface Task {
  id: number;
  name: string;
  description: string;
  frequency: string;
  tools_systems: string;
  file_paths: string;
  contacts: string;
  kpi: string;
  automation_potential: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  tasks: Task[];
}

interface Template {
  job_title: string;
  department: string;
  employee_name: string;
  summary: string;
  projects: Project[];
  qualifications: string[];
  skills_mentioned: string[];
}

const API = process.env.NEXT_PUBLIC_API_URL;

const FIELD_CONFIG = [
  { key: "frequency", label: "Frequency", placeholder: "e.g. Daily, Weekly, Monthly, Quarterly" },
  { key: "tools_systems", label: "Tools / Systems", placeholder: "e.g. Salesforce, Excel, Google Sheets, SAP" },
  { key: "file_paths", label: "File / Folder Locations", placeholder: "e.g. /shared/reports/quarterly-P&L-2026/" },
  { key: "contacts", label: "Key Contacts", placeholder: "e.g. Rosemarie (NYC HQ), Tanaka-san (Sony)" },
  { key: "kpi", label: "KPI / Success Metric", placeholder: "e.g. Revenue growth %, number of new partners signed" },
] as const;

const emptyTask = (id: number): Task => ({
  id, name: "", description: "", frequency: "",
  tools_systems: "", file_paths: "", contacts: "", kpi: "",
  automation_potential: "unknown",
});

const SAMPLE_TEMPLATE: Template = {
  job_title: "Senior Marketing Manager, Consumer Products",
  department: "Marketing & Sales",
  employee_name: "Tanaka Yuki",
  summary: "Lead consumer product marketing strategy across APAC region. Responsible for brand positioning, retail partnerships, go-to-market execution, and quarterly business reviews. Reports to VP of Marketing.",
  projects: [
    {
      id: 1, name: "Retail Distribution & Partnerships",
      description: "Manage relationships with retail partners and optimize product placement across physical and digital channels.",
      tasks: [
        { id: 1, name: "Weekly sell-through reporting", description: "Pull sell-through data by retailer and region, compare against forecast, flag variances > 10% to VP.", frequency: "Weekly (Monday)", tools_systems: "SAP, Excel, Power BI", file_paths: "/shared/reports/sell-through/", contacts: "Rosemarie (NYC HQ), Distribution team", kpi: "Report delivered by Tuesday noon, variance accuracy > 95%", automation_potential: "unknown" },
        { id: 2, name: "Retailer QBR preparation", description: "Prepare quarterly business review decks for top 5 retail partners with sales trends, inventory status, and promotional ROI.", frequency: "Quarterly", tools_systems: "PowerPoint, SAP, Salesforce", file_paths: "/shared/QBR/retail/", contacts: "Account managers, Finance team", kpi: "Deck ready 5 days before QBR, partner satisfaction score > 4.2", automation_potential: "unknown" },
        { id: 3, name: "New retailer onboarding", description: "Evaluate potential retail partners, negotiate terms, coordinate product listing setup.", frequency: "As needed (3-5 per year)", tools_systems: "Salesforce, DocuSign, SAP", file_paths: "/shared/partnerships/new/", contacts: "Legal, Supply Chain, Account team", kpi: "Onboarding completed within 30 days of signed agreement", automation_potential: "unknown" },
      ],
    },
    {
      id: 2, name: "Marketing Campaigns & Brand",
      description: "Plan and execute integrated marketing campaigns across digital and traditional channels to drive brand awareness and sales.",
      tasks: [
        { id: 1, name: "Campaign brief & agency coordination", description: "Write creative briefs for seasonal campaigns, manage agency timelines, review deliverables.", frequency: "Monthly", tools_systems: "Asana, Google Docs, Figma", file_paths: "/shared/campaigns/briefs/", contacts: "Creative agency (Dentsu), Internal design team", kpi: "Campaign launch on time, within budget (+/- 5%)", automation_potential: "unknown" },
        { id: 2, name: "Digital marketing performance tracking", description: "Monitor paid/organic performance across Google Ads, Meta, and LINE. Optimize spend allocation weekly.", frequency: "Weekly", tools_systems: "Google Ads, Meta Business Suite, LINE Ads, Google Analytics", file_paths: "/shared/reports/digital/", contacts: "Digital agency, Media buyer", kpi: "ROAS > 4.0, CPA below target by channel", automation_potential: "unknown" },
        { id: 3, name: "Content calendar management", description: "Maintain editorial calendar for social media, blog, and email. Coordinate with PR for press releases.", frequency: "Weekly updates, monthly planning", tools_systems: "Notion, Hootsuite, Mailchimp", file_paths: "/shared/content/calendar/", contacts: "PR team, Content writers, Social media manager", kpi: "100% on-time publication rate, engagement rate > 3%", automation_potential: "unknown" },
      ],
    },
    {
      id: 3, name: "Sales Forecasting & P&L",
      description: "Own the product-level P&L and collaborate with finance on revenue forecasting and budget management.",
      tasks: [
        { id: 1, name: "Monthly P&L review", description: "Reconcile actuals vs. budget for consumer products division. Identify cost overruns and revenue shortfalls.", frequency: "Monthly", tools_systems: "SAP, Excel, NetSuite", file_paths: "/shared/finance/P&L/", contacts: "Finance controller, VP Marketing", kpi: "Report submitted by 5th business day, variance explanation for items > $10K", automation_potential: "unknown" },
        { id: 2, name: "Demand planning input", description: "Provide marketing-informed demand signals to supply chain for production planning. Adjust for promotions and seasonality.", frequency: "Bi-weekly", tools_systems: "SAP APO, Excel", file_paths: "/shared/supply-chain/demand/", contacts: "Supply chain planner, Production manager", kpi: "Forecast accuracy > 85% at SKU level", automation_potential: "unknown" },
      ],
    },
  ],
  qualifications: [
    "Bachelor's degree in Marketing, Business, or related field",
    "7+ years of experience in consumer products marketing",
    "Strong analytical skills with proficiency in SAP and Excel",
    "Experience managing agency relationships and campaign budgets",
    "Fluent in English and Japanese",
  ],
  skills_mentioned: ["SAP", "Excel", "Power BI", "Salesforce", "Google Ads", "Asana", "PowerPoint"],
};

function AutoTextarea({ value, onChange, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.max(64, ref.current.scrollHeight) + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ overflow: "hidden" }}
    />
  );
}

function AiPolishButton({ text, onPolished }: { text: string; onPolished: (v: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handlePolish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/polish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) onPolished(await res.text());
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePolish}
      disabled={loading || !text.trim()}
      title="AI: fix grammar, spelling, and optimize"
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 hover:bg-[#2a2a2a] text-[#8b9a6b] hover:text-[#b5c48e]"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.5 2l1.5 4.5L15.5 8l-4.5 1.5L9.5 14l-1.5-4.5L3.5 8l4.5-1.5L9.5 2z" />
          <path d="M18 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.7" />
          <path d="M15 16l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L13 18l1.5-.5.5-1.5z" opacity="0.5" />
        </svg>
      )}
    </button>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [mode, setMode] = useState<Mode>("upload");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dailyTasks, setDailyTasks] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [skillMd, setSkillMd] = useState("");
  const [error, setError] = useState("");

  const loadSample = () => {
    setTemplate(SAMPLE_TEMPLATE);
    setJobTitle(SAMPLE_TEMPLATE.job_title);
    setEmployeeName(SAMPLE_TEMPLATE.employee_name);
    setStep("tasks");
  };

  // Step 1: Parse JD
  const handleParse = async () => {
    setError("");
    setStep("parsing");

    try {
      let res;
      if (mode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch(`${API}/api/upload-jd`, { method: "POST", body: formData });
      } else {
        res = await fetch(`${API}/api/parse-jd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_title: jobTitle,
            job_description: jobDescription,
            daily_tasks: dailyTasks.split("\n").filter((t) => t.trim()),
          }),
        });
      }

      if (!res.ok) throw new Error(await res.text());
      const data: Template = await res.json();
      setTemplate(data);
      setJobTitle(data.job_title);
      if (data.employee_name) setEmployeeName(data.employee_name);
      setStep("tasks");
    } catch (e: any) {
      setError(e.message || "Failed to parse JD");
      setStep("upload");
    }
  };

  // Step 2: Upload task doc
  const handleUploadTasks = async () => {
    if (!taskFile || !template) return;
    setError("");
    setStep("parsing_tasks");

    try {
      const formData = new FormData();
      formData.append("file", taskFile);
      const res = await fetch(`${API}/api/parse-task-doc`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Merge uploaded tasks into existing template
      if (data.projects && data.projects.length > 0) {
        setTemplate({
          ...template,
          projects: data.projects.map((p: any, i: number) => ({
            ...p,
            id: p.id || i + 1,
            tasks: (p.tasks || []).map((t: any, j: number) => ({
              ...emptyTask(j + 1),
              ...t,
              id: t.id || j + 1,
            })),
          })),
        });
      }
      setStep("tasks");
    } catch (e: any) {
      setError(e.message || "Failed to parse task document");
      setStep("tasks");
    }
  };

  // Download task template
  const handleDownloadTaskTemplate = async () => {
    if (!template) return;
    try {
      const res = await fetch(`${API}/api/generate-task-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, employee_name: employeeName || null }),
      });
      if (!res.ok) throw new Error("Failed to generate template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tasks_Template_${(employeeName || jobTitle).replace(/\s+/g, "_")}.docx`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  // Generate all outputs
  const handleGenerate = async () => {
    if (!template) return;
    setStep("generating");
    setError("");

    try {
      const res = await fetch(`${API}/api/generate-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, employee_name: employeeName || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSkillMd(await res.text());
      setStep("result");
    } catch (e: any) {
      setError(e.message || "Failed to generate SKILL.md");
      setStep("tasks");
    }
  };

  // Template editing helpers
  const updateTask = (projectId: number, taskId: number, field: string, value: string) => {
    if (!template) return;
    setTemplate({
      ...template,
      projects: template.projects.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)) }
          : p
      ),
    });
  };

  const updateProject = (projectId: number, field: string, value: string) => {
    if (!template) return;
    setTemplate({
      ...template,
      projects: template.projects.map((p) =>
        p.id === projectId ? { ...p, [field]: value } : p
      ),
    });
  };

  const addProject = () => {
    if (!template) return;
    const newId = Math.max(...template.projects.map((p) => p.id), 0) + 1;
    setTemplate({
      ...template,
      projects: [...template.projects, { id: newId, name: "", description: "", tasks: [emptyTask(1)] }],
    });
  };

  const removeProject = (projectId: number) => {
    if (!template) return;
    setTemplate({ ...template, projects: template.projects.filter((p) => p.id !== projectId) });
    setConfirmDelete(null);
  };

  const addTask = (projectId: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      projects: template.projects.map((p) => {
        if (p.id !== projectId) return p;
        const newId = Math.max(...p.tasks.map((t) => t.id), 0) + 1;
        return { ...p, tasks: [...p.tasks, emptyTask(newId)] };
      }),
    });
  };

  const removeTask = (projectId: number, taskId: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      projects: template.projects.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      ),
    });
    setConfirmDelete(null);
    if (expandedTask === `${projectId}-${taskId}`) setExpandedTask(null);
  };

  const getCompletionCount = (task: Task) =>
    FIELD_CONFIG.filter((f) => task[f.key as keyof Task]).length;

  const getTotalTasks = () =>
    template?.projects.reduce((sum, p) => sum + p.tasks.length, 0) ?? 0;

  // Download handlers
  const handleDownloadJd = async () => {
    if (!template) return;
    try {
      const res = await fetch(`${API}/api/download-jd-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, employee_name: employeeName || null }),
      });
      if (!res.ok) throw new Error("Failed to generate docx");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `JD_${(employeeName || jobTitle).replace(/\s+/g, "_")}.docx`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSkillMd = () => {
    const blob = new Blob([skillMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SKILL_${(employeeName || jobTitle).replace(/\s+/g, "_")}.md`;
    a.click();
  };

  const handleDownloadTasksDocx = async () => {
    if (!template) return;
    try {
      const res = await fetch(`${API}/api/download-tasks-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, employee_name: employeeName || null }),
      });
      if (!res.ok) throw new Error("Failed to generate docx");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tasks_${(employeeName || jobTitle).replace(/\s+/g, "_")}.docx`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadTasksJson = async () => {
    if (!template) return;
    try {
      const res = await fetch(`${API}/api/download-tasks-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, employee_name: employeeName || null }),
      });
      if (!res.ok) throw new Error("Failed to generate JSON");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tasks_${(employeeName || jobTitle).replace(/\s+/g, "_")}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setTemplate(null);
    setSkillMd("");
    setExpandedTask(null);
    setConfirmDelete(null);
    setTaskFile(null);
    setError("");
  };

  const stepLabels = ["JD Input", "Projects / Tasks", "Results"];
  const stepIndex =
    step === "upload" || step === "parsing" ? 0
    : step === "tasks" || step === "parsing_tasks" || step === "template" ? 1
    : 2;

  return (
    <main className="min-h-screen bg-[#141414] text-gray-200">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">JD / <em className="italic text-[#8b9a6b]">Skills</em></h1>
              <p className="text-xs text-[#666] uppercase tracking-widest">Cadence by Manaboodle</p>
            </div>
          </div>
          {step !== "upload" && (
            <button onClick={handleReset} className="text-sm text-[#666] hover:text-[#8b9a6b] transition-colors">
              Start over
            </button>
          )}
        </div>
      </header>

      <div className={`mx-auto px-6 py-8 ${step === "result" ? "max-w-7xl" : "max-w-5xl"}`}>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === stepIndex ? "bg-[#2a2a2a] text-[#8b9a6b] border border-[#3a3a3a]"
                  : i < stepIndex ? "bg-[#2a2a2a] text-[#8b9a6b]"
                  : "bg-[#1e1e1e] text-[#555]"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === stepIndex ? "bg-[#8b9a6b] text-[#141414]"
                    : i < stepIndex ? "bg-[#8b9a6b]/30 text-[#8b9a6b]"
                    : "bg-[#252525] text-[#555]"
                }`}>
                  {i < stepIndex ? "\u2713" : i + 1}
                </span>
                {label}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-8 h-px ${i < stepIndex ? "bg-[#8b9a6b]/40" : "bg-[#2a2a2a]"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* ───── Step 1: JD Input ───── */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setMode("upload")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "upload"
                    ? "bg-[#8b9a6b] text-[#141414]"
                    : "bg-[#1e1e1e] text-[#8a8278] border border-[#333] hover:border-[#8b9a6b]/50"
                }`}
              >
                Upload Document
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "manual"
                    ? "bg-[#8b9a6b] text-[#141414]"
                    : "bg-[#1e1e1e] text-[#8a8278] border border-[#333] hover:border-[#8b9a6b]/50"
                }`}
              >
                Manual Entry
              </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8 space-y-5">
              {mode === "upload" ? (
                <div>
                  <label className="block text-sm font-medium text-[#9a9284] mb-1.5">Job Description Document</label>
                  <label
                    htmlFor="file-upload"
                    className="block border-2 border-dashed border-[#333] hover:border-[#8b9a6b]/50 rounded-xl p-10 text-center cursor-pointer transition-all"
                  >
                    <input
                      type="file"
                      accept=".docx,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-[#8b9a6b]">{file.name}</p>
                        <p className="text-xs text-[#666] mt-1">Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#8b9a6b]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#8b9a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-[#9a9284]">Drop a <strong className="text-white">.docx</strong> or <strong className="text-white">.pdf</strong></p>
                        <p className="text-xs text-[#666] mt-1">Company JD templates supported</p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#9a9284] mb-1.5">Job Title</label>
                    <input
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 focus:border-[#8b9a6b]/60 placeholder-[#555]"
                      placeholder="e.g. Senior Marketing Manager"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9a9284] mb-1.5">Job Description</label>
                    <textarea
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white h-36 resize-none focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 focus:border-[#8b9a6b]/60 placeholder-[#555]"
                      placeholder="Paste the full job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9a9284] mb-1.5">Day-to-Day Tasks</label>
                    <p className="text-xs text-[#666] mb-1.5">One task per line</p>
                    <textarea
                      className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white h-36 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 focus:border-[#8b9a6b]/60 placeholder-[#555]"
                      placeholder={"Manage editorial calendar\nBrief agency on campaigns\nReport monthly to VP on KPIs"}
                      value={dailyTasks}
                      onChange={(e) => setDailyTasks(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleParse}
                disabled={mode === "upload" ? !file : !jobTitle || !jobDescription || !dailyTasks}
                className="w-full bg-[#8b9a6b] hover:bg-[#9aab78] text-[#141414] py-3 rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next: Extract Roles &amp; Responsibilities
              </button>
              <button
                onClick={loadSample}
                className="w-full text-[#555] hover:text-[#8b9a6b] py-2 text-sm font-medium transition-all"
              >
                Load Sample (demo)
              </button>
            </div>
          </div>
        )}

        {/* Parsing spinner */}
        {step === "parsing" && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-16 text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-[#333] border-t-[#8b9a6b] animate-spin" />
            <p className="text-[#8a8278] text-sm">Extracting roles and responsibilities from JD...</p>
          </div>
        )}

        {/* ───── Step 2: Projects / Tasks ───── */}
        {step === "tasks" && template && (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-[#c4a55a]/8 border border-[#c4a55a]/20 rounded-xl p-4">
              <p className="text-sm text-[#c4a55a]">
                <strong>AI found {template.projects.length} responsibility areas</strong> from the JD.
                Add detailed projects and tasks below, or download a template to fill in offline.
              </p>
            </div>

            {/* Employee name + JD header info */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8a8278] mb-1">Employee Name</label>
                <input
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                  placeholder="Enter employee name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a8278] mb-1">Job Title</label>
                  <input
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                    value={template.job_title}
                    onChange={(e) => setTemplate({ ...template, job_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a8278] mb-1">Department</label>
                  <input
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                    value={template.department}
                    onChange={(e) => setTemplate({ ...template, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#8a8278] mb-1">Role Summary</label>
                    <AutoTextarea
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                      value={template.summary}
                      onChange={(v) => setTemplate({ ...template, summary: v })}
                    />
                  </div>
                  <div className="pt-5">
                    <AiPolishButton text={template.summary} onPolished={(v) => setTemplate({ ...template, summary: v })} />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-[#666]">
                {template.projects.length} projects, {getTotalTasks()} total tasks
              </div>
            </div>

            {/* Upload / Template download bar */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-6">
              <p className="text-xs text-[#8a8278] uppercase tracking-wide font-medium mb-4">Import Tasks</p>
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleDownloadTaskTemplate}
                  className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template (.docx)
                </button>
                <div className="text-xs text-[#444]">or</div>
                <label className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {taskFile ? taskFile.name : "Upload Filled Template"}
                  <input
                    type="file"
                    accept=".docx,.pdf"
                    onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {taskFile && (
                  <button
                    onClick={handleUploadTasks}
                    className="bg-[#8b9a6b] hover:bg-[#9aab78] text-[#141414] px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    Parse Tasks
                  </button>
                )}
              </div>
              <p className="text-xs text-[#555] mt-3">
                Download the template, fill in your projects and tasks, then upload it back. Or edit manually below.
              </p>
            </div>

            {/* Projects & Tasks editor */}
            {template.projects.map((project) => (
              <div key={project.id} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
                {/* Project header */}
                <div className="bg-[#1e1e1e] px-6 py-4 border-b border-[#2a2a2a]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder-[#555]"
                        placeholder="Project / Area Name"
                        value={project.name}
                        onChange={(e) => updateProject(project.id, "name", e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          className="flex-1 bg-transparent text-xs text-[#8a8278] focus:outline-none placeholder-[#444]"
                          placeholder="Brief description of this responsibility area"
                          value={project.description}
                          onChange={(e) => updateProject(project.id, "description", e.target.value)}
                        />
                        <AiPolishButton
                          text={project.description}
                          onPolished={(v) => updateProject(project.id, "description", v)}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#666] flex-shrink-0">{project.tasks.length} tasks</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-[#222]">
                  {project.tasks.map((task) => {
                    const taskKey = `${project.id}-${task.id}`;
                    const filled = getCompletionCount(task);
                    const isExpanded = expandedTask === taskKey;
                    const isDeleting = confirmDelete === taskKey;

                    return (
                      <div key={task.id}>
                        <div
                          className="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-[#1e1e1e] transition-colors"
                          onClick={() => setExpandedTask(isExpanded ? null : taskKey)}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            filled === FIELD_CONFIG.length
                              ? "bg-[#8b9a6b]/20 text-[#8b9a6b]"
                              : filled > 0
                              ? "bg-[#c4a55a]/15 text-[#c4a55a]"
                              : "bg-[#252525] text-[#555]"
                          }`}>
                            {filled}/{FIELD_CONFIG.length}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#d4cfc4] truncate">{task.name || "Untitled task"}</p>
                          </div>
                          <svg
                            className={`w-4 h-4 text-[#444] transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-5 pt-1 bg-[#161616] space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-[#8a8278] mb-1">Task Name</label>
                              <input
                                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                                value={task.name}
                                onChange={(e) => updateTask(project.id, task.id, "name", e.target.value)}
                              />
                            </div>
                            <div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-[#8a8278] mb-1">Description</label>
                                  <AutoTextarea
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                                    value={task.description}
                                    onChange={(v) => updateTask(project.id, task.id, "description", v)}
                                  />
                                </div>
                                <div className="pt-5">
                                  <AiPolishButton
                                    text={task.description}
                                    onPolished={(v) => updateTask(project.id, task.id, "description", v)}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {FIELD_CONFIG.map((field) => (
                                <div key={field.key}>
                                  <label className="block text-xs font-medium text-[#8a8278] mb-1">{field.label}</label>
                                  <input
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8b9a6b]/40 placeholder-[#555]"
                                    placeholder={field.placeholder}
                                    value={(task as any)[field.key]}
                                    onChange={(e) => updateTask(project.id, task.id, field.key, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="pt-3 border-t border-[#2a2a2a] flex justify-end">
                              {isDeleting ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-400">Remove this task?</span>
                                  <button
                                    onClick={() => removeTask(project.id, task.id)}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                                  >
                                    Yes, remove
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="text-xs text-[#8a8278] px-3 py-1 rounded-lg hover:bg-[#2a2a2a]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(taskKey)}
                                  className="text-xs text-[#555] hover:text-red-400 transition-colors"
                                >
                                  Remove task
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
                  <button
                    onClick={() => addTask(project.id)}
                    className="text-xs text-[#8b9a6b] hover:text-[#b5c48e] font-medium"
                  >
                    + Add task
                  </button>

                  {confirmDelete === `project-${project.id}` ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">Remove project and all tasks?</span>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Yes, remove
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-[#8a8278] px-3 py-1 rounded-lg hover:bg-[#2a2a2a]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(`project-${project.id}`)}
                      className="text-xs text-[#555] hover:text-red-400 transition-colors"
                    >
                      Remove project
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Bottom actions */}
            <div className="flex gap-3">
              <button
                onClick={addProject}
                className="flex-shrink-0 bg-[#1e1e1e] border border-[#333] text-[#9a9284] px-5 py-3 rounded-xl text-sm font-medium hover:border-[#8b9a6b]/50 hover:text-[#8b9a6b] transition-all"
              >
                + Add Project
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 bg-[#8b9a6b] hover:bg-[#9aab78] text-[#141414] py-3 rounded-xl font-semibold transition-all"
              >
                Generate JD, Tasks &amp; SKILL.md
              </button>
            </div>
          </div>
        )}

        {/* Parsing tasks spinner */}
        {step === "parsing_tasks" && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-16 text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-[#333] border-t-[#8b9a6b] animate-spin" />
            <p className="text-[#8a8278] text-sm">Parsing task document...</p>
          </div>
        )}

        {/* Generating spinner */}
        {step === "generating" && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-16 text-center">
            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-[#333] border-t-[#8b9a6b] animate-spin" />
            <p className="text-[#8a8278] text-sm">Generating JD, Tasks, and SKILL.md...</p>
          </div>
        )}

        {/* ───── Step 3: Results ───── */}
        {step === "result" && template && (
          <div className="space-y-4">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("tasks")}
                className="flex items-center gap-2 text-sm text-[#666] hover:text-[#8b9a6b] px-4 py-2 rounded-lg hover:bg-[#1e1e1e] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Edit
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadJd}
                  className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  JD (.docx)
                </button>
                <button
                  onClick={handleDownloadTasksDocx}
                  className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tasks (.docx)
                </button>
                <button
                  onClick={handleDownloadTasksJson}
                  className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tasks (.json)
                </button>
                <button
                  onClick={handleDownloadSkillMd}
                  className="flex items-center gap-2 bg-[#1e1e1e] border border-[#333] hover:border-[#8b9a6b]/50 text-[#9a9284] hover:text-[#8b9a6b] px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  SKILL.md
                </button>
              </div>
            </div>

            {/* Three preview panes */}
            <div className="grid grid-cols-3 gap-4">
              {/* JD Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e]">
                  <h2 className="text-sm font-semibold text-[#d4cfc4]">Job Description</h2>
                </div>
                <div className="flex-1 overflow-auto max-h-[65vh] p-6" style={{ fontFamily: "Calibri, Carlito, sans-serif" }}>
                  <h1 className="text-xl font-bold text-white text-center mb-4 pb-2 border-b-2 border-[#8b9a6b]">
                    JOB DESCRIPTION
                  </h1>
                  <div className="space-y-0.5 mb-4 text-xs text-[#b8b0a2]">
                    <p><span className="font-bold text-[#8b9a6b]">Employee:</span> {employeeName || "TBD"}</p>
                    <p><span className="font-bold text-[#8b9a6b]">Job Title:</span> {template.job_title}</p>
                    <p><span className="font-bold text-[#8b9a6b]">Department:</span> {template.department}</p>
                  </div>
                  <h2 className="text-sm font-bold text-white mt-4 mb-1 border-b border-[#333] pb-0.5">Summary</h2>
                  <p className="text-xs text-[#a89f91] leading-relaxed mb-3">{template.summary}</p>
                  {template.projects.map((project) => (
                    <div key={project.id} className="mb-3">
                      <h2 className="text-sm font-bold text-white mt-3 mb-1 border-b border-[#333] pb-0.5">
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-xs text-[#8a8278] mb-2">{project.description}</p>
                      )}
                      {project.tasks.map((task) => (
                        <div key={task.id} className="ml-2 mb-2">
                          <p className="text-xs font-bold text-[#d4cfc4]">{task.name}</p>
                          {task.description && (
                            <p className="text-xs text-[#8a8278] ml-2">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {template.qualifications.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-white mt-3 mb-1 border-b border-[#333] pb-0.5">Qualifications</h2>
                      <ul className="list-disc list-inside text-xs text-[#a89f91] space-y-0.5">
                        {template.qualifications.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e]">
                  <h2 className="text-sm font-semibold text-[#d4cfc4]">Projects &amp; Tasks</h2>
                </div>
                <div className="flex-1 overflow-auto max-h-[65vh] p-6" style={{ fontFamily: "Calibri, Carlito, sans-serif" }}>
                  <h1 className="text-xl font-bold text-white text-center mb-4 pb-2 border-b-2 border-[#8b9a6b]">
                    PROJECTS &amp; TASKS
                  </h1>
                  <div className="space-y-0.5 mb-4 text-xs text-[#b8b0a2]">
                    <p><span className="font-bold text-[#8b9a6b]">Employee:</span> {employeeName || "TBD"}</p>
                    <p><span className="font-bold text-[#8b9a6b]">Role:</span> {template.job_title}</p>
                  </div>
                  {template.projects.map((project) => (
                    <div key={project.id} className="mb-4">
                      <h2 className="text-sm font-bold text-white mt-3 mb-1 border-b border-[#333] pb-0.5">
                        {project.name}
                      </h2>
                      {project.description && (
                        <p className="text-xs text-[#8a8278] mb-2">{project.description}</p>
                      )}
                      {project.tasks.map((task) => (
                        <div key={task.id} className="ml-2 mb-3 pl-2 border-l-2 border-[#333]">
                          <p className="text-xs font-bold text-[#d4cfc4]">{task.name}</p>
                          {task.description && (
                            <p className="text-xs text-[#7a7268] mb-1">{task.description}</p>
                          )}
                          <div className="text-[11px] text-[#666] space-y-0.5">
                            {task.frequency && <p><span className="font-medium text-[#8a8278]">Frequency:</span> {task.frequency}</p>}
                            {task.tools_systems && <p><span className="font-medium text-[#8a8278]">Tools:</span> {task.tools_systems}</p>}
                            {task.file_paths && <p><span className="font-medium text-[#8a8278]">Files:</span> {task.file_paths}</p>}
                            {task.contacts && <p><span className="font-medium text-[#8a8278]">Contacts:</span> {task.contacts}</p>}
                            {task.kpi && <p><span className="font-medium text-[#8a8278]">KPI:</span> {task.kpi}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* SKILL.md Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#d4cfc4]">SKILL.md</h2>
                  <span className="text-[10px] text-[#666] bg-[#252525] px-2 py-0.5 rounded">read-only</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap text-[#a89f91] p-6 leading-relaxed flex-1 overflow-auto max-h-[65vh]">
                  {skillMd}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
