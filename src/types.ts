export interface Recommendation {
  recommendedOptionName: string;
  score: number; // 0-100
  justification: string;
}

export interface Swot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface OptionAnalysis {
  optionName: string;
  pros: string[];
  cons: string[];
  swot: Swot;
}

export interface OptionScore {
  optionName: string;
  score: number; // 1-10
  comment: string;
}

export interface CriterionComparison {
  criterionName: string;
  optionScores: OptionScore[];
}

export interface AnalysisResult {
  recommendation: Recommendation;
  optionsAnalysis: OptionAnalysis[];
  comparisonTable: CriterionComparison[];
  nextSteps: string[];
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  options: string[];
  criteria: string[];
  createdAt: string;
  resolved: boolean;
  finalChoice?: string;
  analysis: AnalysisResult | null;
  rating?: number | null;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  context: string;
  options: string[];
  criteria: string[];
}
