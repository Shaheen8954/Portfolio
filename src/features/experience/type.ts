export type ExperienceData = {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string; // ISO or human-readable
  endDate?: string | null;
  summary?: string;
  highlights?: string[];
  tags?: string[];
  logo?: any; // resolved from logoPath in JSON (ImageMetadata at runtime)
};
