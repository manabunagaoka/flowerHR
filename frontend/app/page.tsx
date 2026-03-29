"use client";

import { useState } from "react";

export default function Home() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tasks, setTasks] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [skillMd, setSkillMd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSkillMd("");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-skill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: jobTitle,
        job_description: jobDescription,
        daily_tasks: tasks.split("\n").filter((t) => t.trim()),
        employee_name: employeeName || null,
      }),
    });

    const text = await res.text();
    setSkillMd(text);
    setLoading(false);
  };

  const handleDownload = () => {
    const blob = new Blob([skillMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SKILL_${jobTitle.replace(/\s+/g, "_")}.md`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">flowerHR</h1>
        <p className="text-gray-500 mb-8">JD + Tasks → SKILL.md</p>

        <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-xl shadow-sm mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name (optional)</label>
            <input
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="e.g. Sarah Chen"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="e.g. Senior Marketing Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              className="w-full border rounded-lg p-2 text-sm h-40"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day-to-Day Tasks</label>
            <p className="text-xs text-gray-400 mb-1">One task per line</p>
            <textarea
              className="w-full border rounded-lg p-2 text-sm h-40 font-mono"
              placeholder={"Manage editorial calendar\nBrief agency on campaigns\nReport monthly to VP on KPIs"}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !jobTitle || !jobDescription || !tasks}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40"
          >
            {loading ? "Generating..." : "Generate SKILL.md"}
          </button>
        </div>

        {skillMd && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Generated SKILL.md</h2>
              <button
                onClick={handleDownload}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-1 rounded-lg"
              >
                Download
              </button>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
              {skillMd}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
