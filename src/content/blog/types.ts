export interface BlogSection {
  heading: string;
  paragraphs: string[];
  code?: string;
  language?: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  category:
    | "AI & Autonomous Agents"
    | "DevSecOps & Security"
    | "Local-First Architecture"
    | "Windows Engineering & Automation"
    | "Developer Tools & Workflows"
    | "API & Backend Systems"
    | "Web Performance & Next.js"
    | "Databases & Storage";
  tags: string[];
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  tools: string[];
  sections: BlogSection[];
  faqs?: BlogFaq[];
}
