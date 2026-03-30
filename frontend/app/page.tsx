"use client";

import { useState, useRef, useEffect } from "react";
import FlowerLogo from "@/components/FlowerLogo";

type Step = "upload" | "parsing" | "template" | "generating" | "result";
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
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20 hover:bg-rose-100 text-rose-400 hover:text-rose-600"
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
  const [template, setTemplate] = useState<Template | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [skillMd, setSkillMd] = useState("");
  const [error, setError] = useState("");

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
      setStep("template");
    } catch (e: any) {
      setError(e.message || "Failed to parse JD");
      setStep("upload");
    }
  };

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
      setStep("template");
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

  const buildJdText = () => {
    if (!template) return "";
    let text = `JOB DESCRIPTION\n${"=".repeat(50)}\n\n`;
    text += `Employee: ${employeeName || "TBD"}\n`;
    text += `Job Title: ${template.job_title}\n`;
    text += `Department: ${template.department}\n\n`;
    text += `Summary:\n${template.summary}\n\n`;
    text += `${"=".repeat(50)}\n\n`;

    for (const project of template.projects) {
      text += `PROJECT: ${project.name}\n`;
      text += `${"-".repeat(40)}\n`;
      if (project.description) text += `${project.description}\n\n`;

      for (const task of project.tasks) {
        text += `  TASK: ${task.name}\n`;
        if (task.description) text += `    Description: ${task.description}\n`;
        if (task.frequency) text += `    Frequency: ${task.frequency}\n`;
        if (task.tools_systems) text += `    Tools/Systems: ${task.tools_systems}\n`;
        if (task.file_paths) text += `    File Locations: ${task.file_paths}\n`;
        if (task.contacts) text += `    Key Contacts: ${task.contacts}\n`;
        if (task.kpi) text += `    KPI: ${task.kpi}\n`;
        text += "\n";
      }
      text += "\n";
    }

    if (template.qualifications.length > 0) {
      text += `QUALIFICATIONS\n${"-".repeat(40)}\n`;
      template.qualifications.forEach((q) => (text += `- ${q}\n`));
    }
    return text;
  };

  const handleDownloadJd = () => {
    const text = buildJdText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JD_${(employeeName || jobTitle).replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const handleReset = () => {
    setStep("upload");
    setTemplate(null);
    setSkillMd("");
    setExpandedTask(null);
    setConfirmDelete(null);
    setError("");
  };

  const stepLabels = ["Upload JD", "Fill Template", "SKILL.md"];
  const stepIndex = step === "upload" || step === "parsing" ? 0 : step === "template" ? 1 : 2;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlowerLogo size={36} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">flowerHR</h1>
              <p className="text-xs text-gray-400">JD + Tasks &rarr; SKILL.md</p>
            </div>
          </div>
          {step !== "upload" && (
            <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600">
              Start over
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === stepIndex ? "bg-rose-100 text-rose-700"
                  : i < stepIndex ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === stepIndex ? "bg-rose-200 text-rose-800"
                    : i < stepIndex ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {i < stepIndex ? "\u2713" : i + 1}
                </span>
                {label}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-8 h-px ${i < stepIndex ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setMode("upload")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "upload"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-rose-200"
                }`}
              >
                Upload Document
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "manual"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-rose-200"
                }`}
              >
                Manual Entry
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
              {mode === "upload" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Job Description Document</label>
                  <label
                    htmlFor="file-upload"
                    className="block border-2 border-dashed border-gray-200 hover:border-rose-300 rounded-xl p-10 text-center cursor-pointer transition-all"
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
                        <p className="text-sm font-medium text-rose-600">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Drop a <strong>.docx</strong> or <strong>.pdf</strong></p>
                        <p className="text-xs text-gray-400 mt-1">Company JD templates supported</p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Job Title</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                      placeholder="e.g. Senior Marketing Manager"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Job Description</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm h-36 resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                      placeholder="Paste the full job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Day-to-Day Tasks</label>
                    <p className="text-xs text-gray-400 mb-1.5">One task per line</p>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm h-36 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
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
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-200"
              >
                Parse JD into Template
              </button>
            </div>
          </div>
        )}

        {/* Parsing spinner */}
        {step === "parsing" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="animate-spin w-10 h-10 mx-auto mb-4">
              <FlowerLogo size={40} />
            </div>
            <p className="text-gray-500 text-sm">Parsing job description into template...</p>
          </div>
        )}

        {/* Step 2: Template */}
        {step === "template" && template && (
          <div className="space-y-6">
            {/* Employee name — top of template */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Employee Name</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  placeholder="Enter employee name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-200"
                    value={template.job_title}
                    onChange={(e) => setTemplate({ ...template, job_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                    value={template.department}
                    onChange={(e) => setTemplate({ ...template, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Role Summary</label>
                    <AutoTextarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200"
                      value={template.summary}
                      onChange={(v) => setTemplate({ ...template, summary: v })}
                    />
                  </div>
                  <div className="pt-5">
                    <AiPolishButton text={template.summary} onPolished={(v) => setTemplate({ ...template, summary: v })} />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {template.projects.length} projects, {getTotalTasks()} total tasks
              </div>
            </div>

            {/* Projects */}
            {template.projects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Project header */}
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none placeholder-gray-400"
                        placeholder="Project / Area Name"
                        value={project.name}
                        onChange={(e) => updateProject(project.id, "name", e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          className="flex-1 bg-transparent text-xs text-gray-500 focus:outline-none placeholder-gray-300"
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
                    <span className="text-xs text-gray-400 flex-shrink-0">{project.tasks.length} tasks</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-gray-50">
                  {project.tasks.map((task) => {
                    const taskKey = `${project.id}-${task.id}`;
                    const filled = getCompletionCount(task);
                    const isExpanded = expandedTask === taskKey;
                    const isDeleting = confirmDelete === taskKey;

                    return (
                      <div key={task.id}>
                        {/* Task row */}
                        <div
                          className="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => setExpandedTask(isExpanded ? null : taskKey)}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            filled === FIELD_CONFIG.length
                              ? "bg-green-100 text-green-700"
                              : filled > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-400"
                          }`}>
                            {filled}/{FIELD_CONFIG.length}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{task.name || "Untitled task"}</p>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="px-6 pb-5 pt-1 bg-gray-50/30 space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Task Name</label>
                              <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                                value={task.name}
                                onChange={(e) => updateTask(project.id, task.id, "name", e.target.value)}
                              />
                            </div>
                            <div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                  <AutoTextarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
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
                                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                                  <input
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    placeholder={field.placeholder}
                                    value={(task as any)[field.key]}
                                    onChange={(e) => updateTask(project.id, task.id, field.key, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Delete task */}
                            <div className="pt-3 border-t border-gray-100 flex justify-end">
                              {isDeleting ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-600">Remove this task?</span>
                                  <button
                                    onClick={() => removeTask(project.id, task.id)}
                                    className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                                  >
                                    Yes, remove
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="text-xs text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(taskKey)}
                                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
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

                {/* Add task + remove project */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => addTask(project.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    + Add task
                  </button>

                  {confirmDelete === `project-${project.id}` ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Remove project and all tasks?</span>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Yes, remove
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-500 px-3 py-1 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(`project-${project.id}`)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove project
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add project + generate */}
            <div className="flex gap-3">
              <button
                onClick={addProject}
                className="flex-shrink-0 bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm font-medium hover:border-rose-200 hover:text-rose-600 transition-all"
              >
                + Add Project
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all shadow-md shadow-rose-200"
              >
                Generate SKILL.md
              </button>
            </div>
          </div>
        )}

        {/* Generating spinner */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="animate-spin w-10 h-10 mx-auto mb-4">
              <FlowerLogo size={40} />
            </div>
            <p className="text-gray-500 text-sm">Generating SKILL.md from your template...</p>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Generated SKILL.md</h2>
                <button
                  onClick={() => setStep("template")}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-lg"
                >
                  Back to template
                </button>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 p-8 leading-relaxed">
                {skillMd}
              </pre>
            </div>

            {/* Download bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide font-medium">Save & Download</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadJd}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download JD
                </button>
                <button
                  onClick={handleDownloadSkillMd}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download SKILL.md
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(skillMd)}
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
