import { useState, Fragment } from "react";
import { CriterionComparison } from "../types";
import { BarChart3, ChevronDown, ChevronUp, Star } from "lucide-react";

interface ComparisonTableProps {
  tableData: CriterionComparison[];
  optionsList: string[];
}

export default function ComparisonTable({ tableData, optionsList }: ComparisonTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!tableData || tableData.length === 0) return null;

  // Helper to color-code scores
  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500 text-emerald-400 border-emerald-500/20";
    if (score >= 5) return "bg-amber-500 text-amber-400 border-amber-500/20";
    return "bg-rose-500 text-rose-400 border-rose-500/20";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 8) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (score >= 5) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 5) return "text-amber-400";
    return "text-rose-400";
  };

  // Calculate averages per option
  const optionAverages = (optionsList || []).reduce((acc, optionName) => {
    let sum = 0;
    let count = 0;

    if (Array.isArray(tableData)) {
      tableData.forEach((row) => {
        if (row && Array.isArray(row.optionScores)) {
          const match = row.optionScores.find((s) => s && s.optionName && String(s.optionName).trim() === String(optionName).trim());
          if (match) {
            sum += typeof match.score === "number" ? match.score : Number(match.score) || 0;
            count++;
          }
        }
      });
    }

    acc[optionName] = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div id="comparison-table-wrapper" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-5">
        <div>
          <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            Порівняльна матриця оцінок
          </h3>
          <p className="font-sans text-xs text-slate-500 mt-0.5">
            Кількісне зіставлення за шкалою 1-10. Торкніться рядка для деталей.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>8-10 (Чудово)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>5-7 (Прийнятно)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>1-4 (Слабо)</span>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="pb-3.5 pt-1 font-sans text-xs font-bold text-slate-500 tracking-wider w-1/3">
                КРИТЕРІЙ
              </th>
              {(optionsList || []).map((opt, idx) => (
                <th key={idx} className="pb-3.5 pt-1 px-4 font-sans text-xs font-bold text-slate-300 tracking-wider text-center">
                  <div className="line-clamp-2 max-w-[150px] mx-auto">{opt}</div>
                  <div className="text-[10px] text-indigo-400 mt-1 font-normal">
                    Сер. бал: {optionAverages[opt] || 0}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {(tableData || []).map((row, rIdx) => {
              if (!row) return null;
              const isExpanded = expandedRow === row.criterionName;
              return (
                <Fragment key={rIdx}>
                  <tr
                    className={`group hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer ${
                      isExpanded ? "bg-slate-800/20" : ""
                    }`}
                    onClick={() => setExpandedRow(isExpanded ? null : row.criterionName)}
                  >
                    <td className="py-4 pr-4 font-sans text-xs font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{row.criterionName}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </td>

                    {/* Scores for each option */}
                    {(optionsList || []).map((opt, oIdx) => {
                      const scores = Array.isArray(row.optionScores) ? row.optionScores : [];
                      const scoreObj = scores.find(
                        (s) => s && s.optionName && String(s.optionName).trim() === String(opt).trim()
                      ) || { score: 1, comment: "-" };

                      const scoreVal = typeof scoreObj.score === "number" ? scoreObj.score : Number(scoreObj.score) || 1;

                      return (
                        <td key={oIdx} className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Score badge with visual indicator */}
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBgClass(
                                scoreVal
                              )}`}
                            >
                              {scoreVal} / 10
                            </span>

                            {/* Tiny progress bar */}
                            <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getScoreColor(scoreVal).split(" ")[0]}`}
                                style={{ width: `${scoreVal * 10}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Expanded detail box explaining scores */}
                  {isExpanded && (
                    <tr className="bg-slate-950/40">
                      <td colSpan={(optionsList || []).length + 1} className="py-3 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 pt-1">
                          {(Array.isArray(row.optionScores) ? row.optionScores : []).map((scoreObj, sIdx) => {
                            if (!scoreObj) return null;
                            const scoreVal = typeof scoreObj.score === "number" ? scoreObj.score : Number(scoreObj.score) || 1;
                            return (
                              <div
                                key={sIdx}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-slate-400 truncate max-w-[140px]">
                                    {scoreObj.optionName}
                                  </span>
                                  <span
                                    className={`text-[11px] font-mono font-black ${getScoreTextColor(
                                      scoreVal
                                    )}`}
                                  >
                                    {scoreVal} б.
                                  </span>
                                </div>
                                <p className="font-sans text-xs text-slate-300 leading-relaxed mt-1">
                                  {scoreObj.comment || ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* Total / Winner Row */}
            <tr className="bg-indigo-600/5">
              <td className="py-4 pr-4 font-sans text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                Висновки (Середня оцінка):
              </td>
              {(optionsList || []).map((opt, idx) => {
                const averages = optionAverages || {};
                const values = Object.values(averages);
                const isWinner =
                  values.length > 0 &&
                  Math.max(...values) === averages[opt] &&
                  values.length > 1;

                return (
                  <td key={idx} className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-sans text-sm font-bold text-white">
                        {averages[opt] || 0} / 10
                      </span>
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          Переможець
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-medium">Варіант</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
