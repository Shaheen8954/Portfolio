export interface Technology {
  id: string;
  name: string;
}

export interface SkillCategory {
  id: string;
  iconName: string;
  technologies: Technology[];
}

export interface SkillsData {
  skills: SkillCategory[];
}
