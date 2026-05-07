export type ShaderSample = {
  name: string;
  label: string;
};

export type AnalysisResult = {
  explanation_markdown: string;
  optimization_markdown: string;
  model_used: string;
  elapsed_ms: number;
};

export type AnalyzeRequest = {
  shader_source: string;
  shader_name?: string;
};

export type ApiErrorResponse = {
  error: string;
  detail?: string;
};

export type SamplesResponse = {
  samples: ShaderSample[];
};

export type SampleContentResponse = {
  name: string;
  source: string;
};
