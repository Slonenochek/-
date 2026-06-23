import { useState, useEffect } from "react";
import { 
  Brain, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  History, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  ArrowRight, 
  Check, 
  RefreshCw, 
  FileText, 
  Bookmark, 
  Star,
  CheckSquare,
  Square
} from "lucide-react";
import { DECISION_TEMPLATES } from "./templates";
import { Decision, AnalysisResult } from "./types";
import SWOTAnalysis from "./components/SWOTAnalysis";
import ComparisonTable from "./components/ComparisonTable";

export default function App() {
  // Decision Form State
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [options, setOptions] = useState<string[]>(["Варіант А", "Варіант Б"]);
  const [newOptionText, setNewOptionText] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterionText, setNewCriterionText] = useState("");

  // History and Active Decision State
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);

  // App UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  // Interactive Checklist State (for analyzed decision next steps)
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // Loading phase messages
  const loadingSteps = [
    "Зчитуємо введений контекст та варіанти...",
    "Аналізуємо сильні та слабкі сторони через ШІ...",
    "Будуємо SWOT-матрицю зовнішніх факторів...",
    "Оцінюємо кожен критерій за шкалою від 1 до 10...",
    "Формулюємо покроковий план втілення рішення..."
  ];

  // Load saved decisions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("decision_analyzer_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validDecisions = parsed.filter(
            (d) => d && typeof d === "object" && typeof d.id === "string" && typeof d.title === "string"
          );
          setDecisions(validDecisions);
          if (validDecisions.length > 0) {
            setActiveDecision(validDecisions[0]);
          }
        } else {
          localStorage.removeItem("decision_analyzer_records");
        }
      }
    } catch (e) {
      console.error("Failed to load decisions from localStorage", e);
    }
  }, []);

  // Sync to localStorage
  const saveToStorage = (updatedList: Decision[]) => {
    setDecisions(updatedList);
    localStorage.setItem("decision_analyzer_records", JSON.stringify(updatedList));
  };

  // Cycling through loading steps
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Apply a template to the form inputs
  const applyTemplate = (templateId: string) => {
    const t = DECISION_TEMPLATES.find((item) => item.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setContext(t.context);
    setOptions([...t.options]);
    setCriteria([...t.criteria]);
    setErrorStatus(null);
  };

  // Add a custom option
  const addOption = () => {
    const trimmed = newOptionText.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setErrorStatus("Такий варіант вже додано.");
      return;
    }
    setOptions([...options, trimmed]);
    setNewOptionText("");
    setErrorStatus(null);
  };

  // Remove option
  const removeOption = (index: number) => {
    if (options.length <= 1) {
      setErrorStatus("Рішення повинно мати хоча б один варіант.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // Add custom criterion
  const addCriterion = () => {
    const trimmed = newCriterionText.trim();
    if (!trimmed) return;
    if (criteria.includes(trimmed)) {
      setErrorStatus("Такий критерій вже додано.");
      return;
    }
    setCriteria([...criteria, trimmed]);
    setNewCriterionText("");
    setErrorStatus(null);
  };

  // Quick select popular criteria
  const addQuickCriterion = (name: string) => {
    if (criteria.includes(name)) return;
    setCriteria([...criteria, name]);
  };

  // Remove criterion
  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  // Reset current builder form
  const resetForm = () => {
    setTitle("");
    setContext("");
    setOptions(["Варіант А", "Варіант Б"]);
    setCriteria([]);
    setNewOptionText("");
    setNewCriterionText("");
    setErrorStatus(null);
  };

  // Send data to Gemini backend for analysis
  const handleAnalyze = async () => {
    if (!title.trim()) {
      setErrorStatus("Будь ласка, вкажіть назву або запитання рішення.");
      return;
    }
    if (options.length === 0) {
      setErrorStatus("Будь ласка, вкажіть хоча б один варіант.");
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    setCheckedSteps({});

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          context: context.trim(),
          options: options.map(o => o.trim()),
          criteria: criteria.map(c => c.trim())
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Помилка при проведенні аналізу.");
      }

      // Create new decision record
      const newD: Decision = {
        id: "d-" + Date.now(),
        title: title.trim(),
        context: context.trim() || "Опис контексту відсутній.",
        options: [...options],
        criteria: [...criteria],
        createdAt: new Date().toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        resolved: false,
        analysis: data as AnalysisResult
      };

      const newList = [newD, ...decisions];
      saveToStorage(newList);
      setActiveDecision(newD);
    } catch (e: any) {
      console.error(e);
      setErrorStatus(e?.message || "Не вдалося з'єднатися з AI-сервером. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete decision from history
  const deleteDecision = (id: string, e: any) => {
    e.stopPropagation();
    const updated = decisions.filter((d) => d.id !== id);
    saveToStorage(updated);
    if (activeDecision?.id === id) {
      setActiveDecision(updated.length > 0 ? updated[0] : null);
    }
  };

  // Select decision from history to display
  const selectDecision = (d: Decision) => {
    setActiveDecision(d);
    // Sync inputs back to active form just in case user wants to rerun/adjust
    setTitle(d.title);
    setContext(d.context);
    setOptions([...d.options]);
    setCriteria([...d.criteria]);
    setErrorStatus(null);
    setCheckedSteps({});
  };

  // Resolve / Commit final choice
  const makeFinalChoice = (optionName: string) => {
    if (!activeDecision) return;
    const updated = decisions.map((d) => {
      if (d.id === activeDecision.id) {
        return { ...d, resolved: true, finalChoice: optionName };
      }
      return d;
    });
    saveToStorage(updated);
    const updatedActive = updated.find((d) => d.id === activeDecision.id);
    if (updatedActive) {
      setActiveDecision(updatedActive);
    }
  };

  // Dynamic status details for sidebar list
  const getDecisionStatus = (d: Decision) => {
    if (d.resolved && d.finalChoice) {
      return `Обрано: ${d.finalChoice}`;
    }
    return "Аналіз готовий";
  };

  // Quick key list of pre-defined popular criteria to pick
  const popularCriteria = [
    "Бюджет / Вартість", 
    "Швидкість втілення", 
    "Складність / зусилля", 
    "Перспектива у майбутньому", 
    "Ризик та безпека", 
    "Обсяг користі"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white antialiased">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-[10%] w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-[5%] w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 shrink-0">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Аналізатор рішень</h1>
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border border-indigo-500/30">
                  AI v3.5
                </span>
              </div>
              <p className="text-xs text-slate-400">Розумний ШІ-помічник для зваженої аналітики вибору</p>
            </div>
          </div>

          {/* Preset templates selector & New Analysis */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              Очистити поля
            </button>
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <span className="text-xs text-slate-500 font-medium hidden md:inline">Спробувати готовий шаблон:</span>
            <div className="flex gap-1.5 overflow-x-auto max-w-[280px] md:max-w-none pb-1 sm:pb-0">
              {DECISION_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/40 hover:border-indigo-800 border border-slate-800 text-[11px] rounded-lg transition-all text-slate-300 font-semibold cursor-pointer shrink-0"
                  title={tmpl.description}
                >
                  {tmpl.id === "job-offer" ? "💼 Робота" : tmpl.id === "housing" ? "🏠 Житло" : tmpl.id === "purchase-car" ? "🚗 Авто" : "🎓 Курси"}
                </button>
              ))}
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: INPUT BUILDER (cols 4) & HISTORY LIST */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Builder Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-800 text-indigo-400 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Нова дилема</h2>
                </div>
                <span className="text-[11px] text-indigo-400 font-bold">Крок 1 з 2</span>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5 mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Яке рішення ви приймаєте? <span className="text-indigo-450 text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Наприклад: Куди поїхати в першу відпустку?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-650 focus:outline-hidden focus:border-indigo-600 transition"
                />
              </div>

              {/* Context Input */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Контекст та важливі нюанси
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Опціонально</span>
                </div>
                <textarea
                  placeholder="Опишіть ситуацію детальніше: обмеження у бюджеті, терміновість, особисті преференції чи страхи..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-650 focus:outline-hidden focus:border-indigo-600 transition resize-none leading-relaxed"
                />
              </div>

              {/* Options Dynamic List */}
              <div className="space-y-2.5 mb-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Порівнювані Варіанти ({options.length})
                  </label>
                  <span className="text-[10px] text-slate-500">Додайте альтернативи</span>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl group/opt">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono">0{index + 1}</span>
                      <span className="text-xs text-slate-200 font-medium flex-1 truncate">{opt}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-1 text-slate-500 hover:text-rose-500 transition cursor-pointer opacity-0 group-hover/opt:opacity-100"
                        title="Вилучити"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add options form input */}
                <div className="flex gap-2.5 mt-2">
                  <input
                    type="text"
                    placeholder="Назва варіанту..."
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-700"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Додати варіант"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Criteria Dynamic List */}
              <div className="space-y-2.5 mb-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Критерії Оцінки ({criteria.length})
                  </label>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold">ШІ підбере за замовчуванням</span>
                </div>

                {criteria.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {criteria.map((crt, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-950/40 text-indigo-300 border border-indigo-900/60 pl-2 pr-1 py-0.5 rounded-lg"
                      >
                        <span className="truncate max-w-[120px]">{crt}</span>
                        <button
                          type="button"
                          onClick={() => removeCriterion(index)}
                          className="p-0.5 hover:text-rose-500 hover:bg-rose-550/10 rounded transition text-slate-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Popular criteria quick addition pills */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Швидкий вибір критеріїв:</span>
                  <div className="flex flex-wrap gap-1">
                    {popularCriteria.map((keyStr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addQuickCriterion(keyStr)}
                        disabled={criteria.includes(keyStr)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border text-left transition cursor-pointer ${
                          criteria.includes(keyStr)
                            ? "bg-slate-950 border-slate-900 text-slate-650 cursor-not-allowed"
                            : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-750"
                        }`}
                      >
                        + {keyStr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Власний критерій..."
                    value={newCriterionText}
                    onChange={(e) => setNewCriterionText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCriterion())}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-700"
                  />
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="p-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Додати критерій"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full py-4 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-3 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:animate-shine" />
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Розпочати ШІ-Аналітика</span>
                </button>
              </div>

              {/* Visual error display */}
              {errorStatus && (
                <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorStatus}</span>
                </div>
              )}

            </div>

            {/* History List Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-800 text-amber-500 rounded-lg">
                    <History className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Історія аналізів</h2>
                </div>
                <span className="text-xs bg-slate-950 px-2 py-0.5 rounded-full font-bold text-slate-400">
                  {decisions.length}
                </span>
              </div>

              {decisions.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-850">
                  <HelpCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  <p className="font-sans text-xs text-slate-400">Тут будуть збережені аналізи.</p>
                  <p className="font-sans text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                    Скористайтеся формою вище або оберіть демонстраційний шаблон.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {decisions.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => selectDecision(d)}
                      className={`group p-3 rounded-2xl border transition-all text-left cursor-pointer relative ${
                        activeDecision?.id === d.id
                          ? "bg-indigo-950/20 border-indigo-500/40"
                          : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-750"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1 max-w-full">
                          {d.resolved ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <CirclePlaceholder />
                          )}
                          <h4 className="font-sans text-xs font-bold text-slate-100 truncate flex-1 group-hover:text-indigo-400 transition-colors">
                            {d.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => deleteDecision(d.id, e)}
                          className="p-1 text-slate-600 hover:text-rose-500 rounded-md hover:bg-rose-500/10 cursor-pointer shrink-0 transition"
                          title="Видалити"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5 text-slate-500" />
                          {d.createdAt}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                          d.resolved 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {getDecisionStatus(d)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: BENTO GRID DASHBOARD / ACTIVE DEMO DISPLAY */}
          <div className="lg:col-span-8">
            
            {/* Loading / Processing State */}
            {isLoading && (
              <div id="decision-loader" className="bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[500px] flex flex-col justify-center items-center text-center shadow-xl space-y-6">
                
                {/* Floating Brain Icon Loader */}
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full scale-125 blur-xl animate-pulse" />
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 animate-bounce">
                    <RefreshCw className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="font-sans text-base font-bold text-white tracking-wide">ШІ будує найкращу траєкторію...</h3>
                  <p className="font-sans text-xs text-slate-400">
                    Це займає близько 4-8 секунд, за цей час модель глибоко аналізує альтернативи за кожним критерієм.
                  </p>
                </div>

                {/* Animated progress stages bar */}
                <div className="w-full max-w-sm space-y-2 mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 uppercase tracking-widest font-black">СТАДІЯ ОБРОБКИ</span>
                    <span className="text-indigo-400 font-bold">{loadingStep + 1} / {loadingSteps.length}</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 shadow-md shadow-indigo-500/40 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-indigo-300 font-semibold italic animate-pulse">
                    “{loadingSteps[loadingStep]}”
                  </p>
                </div>

                {/* Skeleton Preview Grid placeholder */}
                <div className="w-full grid grid-cols-2 gap-3 opacity-20 pointer-events-none pt-4">
                  <div className="h-20 bg-slate-800 rounded-2xl" />
                  <div className="h-20 bg-slate-800 rounded-2xl" />
                  <div className="h-32 bg-slate-800 col-span-2 rounded-2xl" />
                </div>

              </div>
            )}

            {/* Empty Context (Instructions) display if no active analysis */}
            {!isLoading && !activeDecision && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[550px] flex flex-col justify-center items-center text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="w-14 h-14 bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-800/30 mb-5 shadow-inner">
                  <Brain className="h-7 w-7" />
                </div>

                <h3 className="font-sans text-lg font-black text-white tracking-wide">
                  Аналізатор рішень готовий до роботи
                </h3>
                <p className="font-sans text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                  Будь-який вибір — від кар'єрного росту до побутових покупок — містить приховані переваги та підводні загрози. Наш сервіс проводить комбінований факторний SWOT та матричний аналізи.
                </p>

                {/* Walkthrough guide steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-10">
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl transition hover:border-slate-750 text-left">
                    <span className="text-xs font-mono font-bold text-indigo-400">Крок 1</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Введіть Дилему</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Напишіть варіанти рішень та додайте критерії які вас хвилюють.</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl transition hover:border-slate-750 text-left">
                    <span className="text-xs font-mono font-bold text-indigo-400">Крок 2</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Отримайте SWOT</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">ШІ розкриє приховані ризики, переваги та загрози для кожної альтернативи.</p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl transition hover:border-slate-750 text-left">
                    <span className="text-xs font-mono font-bold text-indigo-400">Крок 3</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">Порівняльна матриця</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Система проставить оцінки та розрахує середній бал для кожного рішення.</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">Швидкий старт:</span>
                  <button
                    onClick={() => applyTemplate("job-offer")}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-indigo-600/10"
                  >
                    Завантажити шаблон Зміни Роботи
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* BENTO GRID: COMPREHENSIVE DASHBOARD RESULT PANEL */}
            {!isLoading && activeDecision && activeDecision.analysis && (
              <div id="analytics-grid" className="space-y-6">
                
                {/* Query Title bar */}
                <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] uppercase font-mono tracking-wider rounded font-bold border border-indigo-600/30">
                        Тема аналітики
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {activeDecision.createdAt}
                      </span>
                    </div>
                    <div className="text-slate-100 font-black text-md md:text-lg leading-snug">
                      {activeDecision.title}
                    </div>
                  </div>
                  
                  {activeDecision.resolved && activeDecision.finalChoice ? (
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-2 shrink-0 self-start md:self-center font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      Обране рішення: {activeDecision.finalChoice}
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-2xl flex items-center gap-2 shrink-0 self-start md:self-center font-bold">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                      Аналіз завершено
                    </div>
                  )}
                </div>

                {/* Context Expandable Box if present */}
                {activeDecision.context && (
                  <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Опис умов та контексту користувача
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      “{activeDecision.context}”
                    </p>
                  </div>
                )}

                {/* THE 12-COLUMN BENTO GRID STARTS HERE */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* BENTO BLOCK 1: Verdict / AI Verdict Card (indigo gradient - Span 8 cols) */}
                  <div className="md:col-span-8 bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 text-slate-100 relative overflow-hidden flex flex-col justify-between shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                          Реєстр Вердиктів та Рекомендація ШІ
                        </h3>
                        <span className="text-[10px] bg-indigo-600 font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-indigo-600/30">
                          Математичний переможець
                        </span>
                      </div>

                      {/* Confidence Score Dial */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-4xl font-extrabold text-white tracking-tighter">
                          {activeDecision.analysis?.recommendation?.score || 0}%
                        </span>
                        <span className="text-xs text-indigo-300 font-semibold">
                          впевненості у варіанті
                        </span>
                      </div>

                      {/* Recommended Choice Box */}
                      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 mb-4">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-0.5">Рекомендоване Рішення:</span>
                        <span className="text-base font-black text-white block">
                          {activeDecision.analysis?.recommendation?.recommendedOptionName || "—"}
                        </span>
                      </div>

                      {/* Justification analytical message */}
                      <p className="font-sans text-xs text-slate-300 leading-relaxed">
                        {activeDecision.analysis?.recommendation?.justification}
                      </p>
                    </div>

                    {/* Commit choice action inside Verdict card */}
                    {!activeDecision.resolved ? (
                      <div className="border-t border-slate-800/80 pt-4 mt-6">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2.5">
                          Ви погоджуєтеся з рекомендацією? Зафіксуйте свій остаточний вибір:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(activeDecision.options || []).map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => makeFinalChoice(option)}
                              className="px-3.5 py-2 bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 rounded-xl text-xs font-black text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Обрати &ldquo;{option}&rdquo;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 mt-5 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-150 block">Ваш остаточний вибір підтверджено</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">Ви зафіксували рішення: {activeDecision.finalChoice}</span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* BENTO BLOCK 2: Quick Specs / Complexity Dial (Span 4 cols) */}
                  <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-md">
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-400 mb-3.5 uppercase tracking-wider">
                        Метрики Рішення
                      </h3>
                      
                      {/* Metric 1 */}
                      <div className="mb-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Складність оцінювання</div>
                        <div className="text-xl font-extrabold text-white mt-0.5">
                          {(activeDecision.options || []).length > 2 ? "Висока (багатофакторна)" : "Середня (балансова)"}
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Точність алгоритму</div>
                        <div className="text-2xl font-black text-emerald-450 text-emerald-400 mt-0.5">
                          95%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Охоплення критеріїв</span>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full mt-1.5">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${Math.min(100, ((activeDecision.criteria || []).length + 2) * 15)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Задіяно {(activeDecision.criteria || []).length || 6} критеріїв аналізу.
                      </span>
                    </div>
                  </div>

                  {/* BENTO BLOCK 3: SWOT Analysis Matrix Widget (Span 12 cols or 7 cols) */}
                  <div className="md:col-span-7">
                    <SWOTAnalysis options={activeDecision.analysis?.optionsAnalysis || []} />
                  </div>

                  {/* BENTO BLOCK 4: Pros & Cons Tabbed List widget (Span 5 cols) */}
                  <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-md h-full">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Огляд Переваг & Недоліків
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-4 pb-3 border-b border-slate-800/80">
                        Концентрована база плюсів та мінусів по основним варіантам.
                      </p>

                      <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
                        {(activeDecision.analysis?.optionsAnalysis || []).map((opt, oIdx) => (
                          <div key={oIdx} className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-850">
                            <span className="text-xs font-black text-indigo-400 block mb-2">{opt?.optionName}</span>
                            
                            <div className="space-y-3">
                              {/* Pros */}
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                                  ✓ Переваги:
                                </span>
                                <ul className="space-y-1">
                                  {(opt?.pros || []).map((p, iIdx) => (
                                    <li key={iIdx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Cons */}
                              <div>
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                                  ✗ Недоліки:
                                </span>
                                <ul className="space-y-1">
                                  {(opt?.cons || []).map((c, iIdx) => (
                                    <li key={iIdx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-rose-500 mt-0.5 shrink-0">•</span>
                                      <span>{c}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BENTO BLOCK 5: Criteria Matrix assessment (Span 12 cols) */}
                  <div className="md:col-span-12">
                    <ComparisonTable 
                      tableData={activeDecision.analysis?.comparisonTable || []} 
                      optionsList={activeDecision.options || []} 
                    />
                  </div>

                  {/* BENTO BLOCK 6: Interactive Next Steps / Milestones list (Span 12 cols) */}
                  <div className="md:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                          Покроковий дорожній план втілення (Milestones)
                        </h3>
                        <p className="font-sans text-[11px] text-slate-500 mt-0.5">
                          Практичні кроки, які потрібно зробити після прийняття та обрання цього вектора дій.
                        </p>
                      </div>

                      <div className="text-[10px] bg-slate-950 border border-slate-800 py-1 px-3.5 rounded-full font-bold text-slate-400">
                        {Object.values(checkedSteps).filter(Boolean).length} з {(activeDecision.analysis?.nextSteps || []).length} завершено
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {(activeDecision.analysis?.nextSteps || []).map((step, idx) => {
                        const isChecked = !!checkedSteps[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => setCheckedSteps({ ...checkedSteps, [idx]: !isChecked })}
                            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isChecked 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-slate-300" 
                                : "bg-slate-950 hover:bg-slate-950/80 border-slate-800/80 text-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              className="p-0.5 rounded text-slate-400 hover:text-white transition cursor-pointer mt-0.5 shrink-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-600" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Крок 0{idx + 1}</span>
                              <p className={`text-xs font-sans leading-relaxed ${isChecked ? "line-through text-slate-500" : ""}`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
                {/* THE 12-COLUMN BENTO GRID ENDS HERE */}

              </div>
            )}

          </div>

        </div>
      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-mono">
            &copy; 2026 Аналізатор рішень — Інтелектуальна система підтримки рішень.
          </p>
          <p>
            Побудовано із використанням Gemini 3.5 Flash моделі. Дані зберігаються виключно локально у вашому браузері.
          </p>
        </div>
      </footer>

    </div>
  );
}

// Small standalone circle placeholder component
function CirclePlaceholder() {
  return (
    <span className="h-3.5 w-3.5 rounded-full border border-slate-700 block shrink-0" />
  );
}
