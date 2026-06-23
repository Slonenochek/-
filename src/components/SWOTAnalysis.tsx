import { useState } from "react";
import { OptionAnalysis } from "../types";
import { ShieldCheck, AlertTriangle, Sparkles, AlertCircle } from "lucide-react";

interface SWOTAnalysisProps {
  options: OptionAnalysis[];
}

export default function SWOTAnalysis({ options }: SWOTAnalysisProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!options || options.length === 0) return null;
  
  const currentOption = options[activeTab] || options[0];
  const swot = currentOption?.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };

  return (
    <div id="swot-analysis-card" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-full">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div>
          <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            SWOT-аналіз варіантів
          </h3>
          <p className="font-sans text-[11px] text-slate-500 mt-0.5">
            Стратегічні вектори для кожного вибору
          </p>
        </div>

        {/* Option Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-950/80 rounded-xl max-w-full">
          {options.map((opt, idx) => (
            <button
              key={idx}
              id={`swot-tab-${idx}`}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                activeTab === idx
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.optionName}
            </button>
          ))}
        </div>
      </div>

      {/* SWOT Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* STRENGTHS */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black font-mono">S</span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              Сильні сторони
            </span>
          </div>
          <ul className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
            {swot.strengths && swot.strengths.length > 0 ? (
              swot.strengths.map((item, idx) => (
                <li key={idx} className="font-sans text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="font-sans text-xs text-slate-500 italic">Не виявлено</li>
            )}
          </ul>
        </div>

        {/* WEAKNESSES */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black font-mono">W</span>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              Слабкі сторони
            </span>
          </div>
          <ul className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
            {swot.weaknesses && swot.weaknesses.length > 0 ? (
              swot.weaknesses.map((item, idx) => (
                <li key={idx} className="font-sans text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="font-sans text-xs text-slate-500 italic">Не виявлено</li>
            )}
          </ul>
        </div>

        {/* OPPORTUNITIES */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black font-mono">O</span>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              Можливості
            </span>
          </div>
          <ul className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
            {swot.opportunities && swot.opportunities.length > 0 ? (
              swot.opportunities.map((item, idx) => (
                <li key={idx} className="font-sans text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="font-sans text-xs text-slate-500 italic">Не виявлено</li>
            )}
          </ul>
        </div>

        {/* THREATS */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-black font-mono">T</span>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              Загрози й ризики
            </span>
          </div>
          <ul className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
            {swot.threats && swot.threats.length > 0 ? (
              swot.threats.map((item, idx) => (
                <li key={idx} className="font-sans text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="font-sans text-xs text-slate-500 italic">Не виявлено</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
