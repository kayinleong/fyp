import { FirestoreTimestamp } from "./base";

/**
 * Priority Level
 */
export enum PriorityLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

/**
 * Job Category with sub-categories
 */
export interface CategoryConfig {
  id: string;
  name: string;
  keywords: string[];
  subCategories?: SubCategoryConfig[];
}

export interface SubCategoryConfig {
  id: string;
  name: string;
  keywords: string[];
}

/**
 * Main Category Priorities (High, Medium, Low)
 */
export interface MainCategoryPriorities {
  IT_SOFTWARE?: PriorityLevel;
  BUSINESS_MANAGEMENT?: PriorityLevel;
  FINANCE_ACCOUNTING?: PriorityLevel;
  CREATIVE_MULTIMEDIA?: PriorityLevel;
  ENGINEERING?: PriorityLevel;
  HEALTHCARE?: PriorityLevel;
  EDUCATION?: PriorityLevel;
  HOSPITALITY_SERVICE?: PriorityLevel;
  INTERNSHIP?: PriorityLevel;
  [key: string]: PriorityLevel | undefined;
}

/**
 * Specific Job Title Priorities (High, Medium, Low)
 */
export interface JobTitlePriorities {
  [jobTitle: string]: PriorityLevel | undefined;
}

/**
 * Swipe AI Settings - Simple and focused
 */
export interface SwipeAISettings {
  id: string;
  user_id: string;
  
  // Main Category Prioritization
  mainCategoryPriorities: MainCategoryPriorities;
  
  // Specific Job Title Prioritization (optional, for fine-tuning)
  jobTitlePriorities: JobTitlePriorities;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Firestore version with Firestore timestamps
 */
export interface FirestoreSwipeAISettings extends Omit<SwipeAISettings, 'created_at' | 'updated_at'> {
  created_at?: FirestoreTimestamp;
  updated_at?: FirestoreTimestamp;
}

/**
 * Default Swipe AI Settings
 */
export const DEFAULT_SWIPE_SETTINGS: Omit<SwipeAISettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  // Default main category priorities (all at MEDIUM - balanced)
  mainCategoryPriorities: {
    IT_SOFTWARE: PriorityLevel.MEDIUM,
    BUSINESS_MANAGEMENT: PriorityLevel.MEDIUM,
    FINANCE_ACCOUNTING: PriorityLevel.MEDIUM,
    CREATIVE_MULTIMEDIA: PriorityLevel.MEDIUM,
    ENGINEERING: PriorityLevel.MEDIUM,
    HEALTHCARE: PriorityLevel.MEDIUM,
    EDUCATION: PriorityLevel.MEDIUM,
    HOSPITALITY_SERVICE: PriorityLevel.MEDIUM,
    INTERNSHIP: PriorityLevel.MEDIUM,
  },
  // Default job title priorities (empty - use main category by default)
  jobTitlePriorities: {},
};

/**
 * Category Configuration with keywords and sub-categories
 */
export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    id: "IT_SOFTWARE",
    name: "Information Technology / Software",
    keywords: ["software", "developer", "programmer", "coding", "programming", "frontend", "backend", "full stack", "react", "vue", "angular", "node", "javascript", "typescript", "python", "java", "c++", "sql", "database", "api", "web", "app", "application", "it", "tech", "technology", "computer", "system", "network", "cloud", "aws", "azure", "devops", "cyber", "security", "ui/ux", "designer", "qa", "tester", "data analyst", "data scientist", "machine learning", "ai", "engineer"],
    subCategories: [
      { id: "software_developer", name: "Software Developer", keywords: ["software developer", "developer", "programmer"] },
      { id: "frontend_developer", name: "Front-End Developer", keywords: ["frontend", "front-end", "front end", "react", "vue", "angular", "javascript"] },
      { id: "backend_developer", name: "Back-End Developer", keywords: ["backend", "back-end", "back end", "server", "api", "node"] },
      { id: "fullstack_developer", name: "Full Stack Developer", keywords: ["full stack", "fullstack", "full-stack"] },
      { id: "mobile_developer", name: "Mobile App Developer", keywords: ["mobile", "ios", "android", "app developer"] },
      { id: "web_developer", name: "Web Developer", keywords: ["web developer", "web development"] },
      { id: "uiux_designer", name: "UI/UX Designer", keywords: ["ui/ux", "ui designer", "ux designer", "user interface", "user experience"] },
      { id: "qa_tester", name: "QA Tester / Software Tester", keywords: ["qa", "quality assurance", "tester", "testing", "test engineer"] },
      { id: "devops_engineer", name: "DevOps Engineer", keywords: ["devops", "dev ops", "deployment", "ci/cd"] },
      { id: "data_analyst", name: "Data Analyst", keywords: ["data analyst", "data analysis"] },
      { id: "data_scientist", name: "Data Scientist", keywords: ["data scientist", "data science", "machine learning", "ml"] },
      { id: "cybersecurity", name: "Cybersecurity Analyst", keywords: ["cybersecurity", "cyber security", "security analyst", "information security"] },
      { id: "network_engineer", name: "Network Engineer", keywords: ["network engineer", "network administrator"] },
      { id: "cloud_engineer", name: "Cloud Engineer", keywords: ["cloud engineer", "aws", "azure", "gcp", "cloud computing"] },
      { id: "it_support", name: "IT Support Technician", keywords: ["it support", "technical support", "help desk"] },
      { id: "system_admin", name: "System Administrator", keywords: ["system administrator", "sysadmin", "system admin"] },
      { id: "ml_engineer", name: "Machine Learning Engineer", keywords: ["machine learning engineer", "ml engineer"] },
      { id: "ai_engineer", name: "AI Engineer", keywords: ["ai engineer", "artificial intelligence"] },
      { id: "dba", name: "Database Administrator", keywords: ["database administrator", "dba", "sql administrator"] },
      { id: "product_manager_tech", name: "Product Manager (Tech)", keywords: ["product manager", "tech product manager"] },
    ],
  },
  {
    id: "BUSINESS_MANAGEMENT",
    name: "Business / Management / Operations",
    keywords: ["business analyst", "operations", "executive", "project coordinator", "project manager", "administrative", "customer service", "hr", "human resources", "hr assistant", "hr executive", "recruiter", "talent acquisition", "sales", "sales executive", "account manager", "marketing", "marketer", "marketing executive", "procurement", "supply chain", "logistics"],
    subCategories: [
      { id: "business_analyst", name: "Business Analyst", keywords: ["business analyst", "ba"] },
      { id: "operations_executive", name: "Operations Executive", keywords: ["operations executive", "operations"] },
      { id: "project_coordinator", name: "Project Coordinator", keywords: ["project coordinator"] },
      { id: "project_manager", name: "Project Manager", keywords: ["project manager", "pm"] },
      { id: "admin_assistant", name: "Administrative Assistant", keywords: ["administrative assistant", "admin assistant", "admin"] },
      { id: "customer_service", name: "Customer Service Representative", keywords: ["customer service", "customer support", "csr"] },
      { id: "hr_assistant", name: "HR Assistant", keywords: ["hr assistant", "human resources assistant"] },
      { id: "hr_executive", name: "HR Executive", keywords: ["hr executive", "human resources executive"] },
      { id: "recruiter", name: "Recruiter / Talent Acquisition", keywords: ["recruiter", "talent acquisition", "hiring"] },
      { id: "sales_executive", name: "Sales Executive", keywords: ["sales executive", "sales rep", "sales representative"] },
      { id: "account_manager", name: "Account Manager", keywords: ["account manager", "client manager"] },
      { id: "marketing_executive", name: "Marketing Executive", keywords: ["marketing executive", "marketer"] },
      { id: "procurement", name: "Procurement Executive", keywords: ["procurement", "purchasing"] },
      { id: "supply_chain", name: "Supply Chain Coordinator", keywords: ["supply chain", "supply chain coordinator"] },
      { id: "logistics", name: "Logistics Executive", keywords: ["logistics", "logistics executive"] },
    ],
  },
  {
    id: "FINANCE_ACCOUNTING",
    name: "Finance / Accounting",
    keywords: ["finance", "financial", "accountant", "accounting", "audit", "bank", "banking", "investment", "trading", "trader", "analyst", "financial analyst", "bookkeeping", "tax", "payroll", "budget", "revenue", "profit", "loss", "account", "ledger", "cfo", "controller", "risk analyst", "compliance"],
    subCategories: [
      { id: "accountant", name: "Accountant", keywords: ["accountant", "accounting"] },
      { id: "finance_executive", name: "Finance Executive", keywords: ["finance executive", "financial executive"] },
      { id: "financial_analyst", name: "Financial Analyst", keywords: ["financial analyst", "finance analyst"] },
      { id: "audit_assistant", name: "Audit Assistant", keywords: ["audit assistant", "auditor"] },
      { id: "tax_assistant", name: "Tax Assistant", keywords: ["tax assistant", "tax"] },
      { id: "banking_associate", name: "Banking Associate", keywords: ["banking", "bank associate", "banker"] },
      { id: "risk_analyst", name: "Risk Analyst", keywords: ["risk analyst", "risk management"] },
      { id: "compliance", name: "Compliance Executive", keywords: ["compliance", "compliance executive"] },
      { id: "bookkeeper", name: "Bookkeeper", keywords: ["bookkeeper", "bookkeeping"] },
    ],
  },
  {
    id: "CREATIVE_MULTIMEDIA",
    name: "Creative / Multimedia",
    keywords: ["graphic designer", "multimedia", "motion graphics", "video editor", "photographer", "content creator", "social media", "copywriter", "digital marketing", "game designer", "creative", "design", "art", "artist", "visual", "layout", "typography", "branding", "advertising"],
    subCategories: [
      { id: "graphic_designer", name: "Graphic Designer", keywords: ["graphic designer", "graphic design"] },
      { id: "multimedia_designer", name: "Multimedia Designer", keywords: ["multimedia designer", "multimedia"] },
      { id: "motion_graphics", name: "Motion Graphics Designer", keywords: ["motion graphics", "motion designer"] },
      { id: "video_editor", name: "Video Editor", keywords: ["video editor", "video editing"] },
      { id: "photographer", name: "Photographer", keywords: ["photographer", "photography"] },
      { id: "content_creator", name: "Content Creator", keywords: ["content creator", "content creation"] },
      { id: "social_media", name: "Social Media Executive", keywords: ["social media", "social media executive", "smm"] },
      { id: "copywriter", name: "Copywriter", keywords: ["copywriter", "copywriting"] },
      { id: "digital_marketing", name: "Digital Marketing Specialist", keywords: ["digital marketing", "digital marketer"] },
      { id: "ui_designer", name: "UI Designer", keywords: ["ui designer", "user interface designer"] },
      { id: "game_designer", name: "Game Designer", keywords: ["game designer", "game design"] },
    ],
  },
  {
    id: "ENGINEERING",
    name: "Engineering",
    keywords: ["engineer", "engineering", "mechanical", "electrical", "electronic", "civil", "chemical", "industrial", "manufacturing", "quality assurance", "maintenance", "production"],
    subCategories: [
      { id: "mechanical_engineer", name: "Mechanical Engineer", keywords: ["mechanical engineer", "mechanical engineering"] },
      { id: "electrical_engineer", name: "Electrical Engineer", keywords: ["electrical engineer", "electrical engineering"] },
      { id: "electronic_engineer", name: "Electronic Engineer", keywords: ["electronic engineer", "electronics"] },
      { id: "civil_engineer", name: "Civil Engineer", keywords: ["civil engineer", "civil engineering"] },
      { id: "manufacturing_engineer", name: "Manufacturing Engineer", keywords: ["manufacturing engineer", "manufacturing"] },
      { id: "qa_engineer", name: "Quality Assurance Engineer", keywords: ["quality assurance engineer", "qa engineer"] },
      { id: "maintenance_engineer", name: "Maintenance Engineer", keywords: ["maintenance engineer", "maintenance"] },
      { id: "production_engineer", name: "Production Engineer", keywords: ["production engineer", "production"] },
    ],
  },
  {
    id: "HEALTHCARE",
    name: "Healthcare",
    keywords: ["nurse", "medical assistant", "pharmacy assistant", "laboratory technician", "care support", "healthcare", "health care", "medical", "doctor", "physician", "hospital", "clinic", "patient", "therapy", "therapist", "pharmacy", "pharmaceutical"],
    subCategories: [
      { id: "nurse", name: "Nurse", keywords: ["nurse", "nursing"] },
      { id: "medical_assistant", name: "Medical Assistant", keywords: ["medical assistant"] },
      { id: "pharmacy_assistant", name: "Pharmacy Assistant", keywords: ["pharmacy assistant", "pharmacist"] },
      { id: "lab_technician", name: "Laboratory Technician", keywords: ["laboratory technician", "lab technician"] },
      { id: "care_support", name: "Care Support Assistant", keywords: ["care support", "care assistant"] },
    ],
  },
  {
    id: "EDUCATION",
    name: "Education",
    keywords: ["tutor", "teaching assistant", "trainer", "instructor", "professor", "lecturer", "curriculum", "academic", "school", "university", "college", "student", "learning", "training", "education", "educator", "teacher", "teaching"],
    subCategories: [
      { id: "tutor", name: "Tutor", keywords: ["tutor", "tutoring"] },
      { id: "teaching_assistant", name: "Teaching Assistant", keywords: ["teaching assistant", "ta"] },
      { id: "trainer", name: "Trainer / Instructor", keywords: ["trainer", "instructor", "training"] },
    ],
  },
  {
    id: "HOSPITALITY_SERVICE",
    name: "Hospitality / Service",
    keywords: ["barista", "waiter", "waitress", "kitchen assistant", "hotel receptionist", "front desk", "event assistant", "retail assistant", "store supervisor", "hospitality", "service"],
    subCategories: [
      { id: "barista", name: "Barista", keywords: ["barista"] },
      { id: "waiter", name: "Waiter / Waitress", keywords: ["waiter", "waitress", "server"] },
      { id: "kitchen_assistant", name: "Kitchen Assistant", keywords: ["kitchen assistant", "kitchen"] },
      { id: "hotel_receptionist", name: "Hotel Receptionist", keywords: ["hotel receptionist", "receptionist"] },
      { id: "front_desk", name: "Front Desk Coordinator", keywords: ["front desk", "front desk coordinator"] },
      { id: "event_assistant", name: "Event Assistant", keywords: ["event assistant", "event"] },
      { id: "retail_assistant", name: "Retail Assistant", keywords: ["retail assistant", "retail"] },
      { id: "store_supervisor", name: "Store Supervisor", keywords: ["store supervisor", "supervisor"] },
    ],
  },
  {
    id: "INTERNSHIP",
    name: "Internship",
    keywords: ["intern", "internship", "trainee"],
    subCategories: [
      { id: "it_intern", name: "IT Intern", keywords: ["it intern", "it internship"] },
      { id: "software_intern", name: "Software Engineering Intern", keywords: ["software intern", "software engineering intern"] },
      { id: "marketing_intern", name: "Marketing Intern", keywords: ["marketing intern", "marketing internship"] },
      { id: "hr_intern", name: "HR Intern", keywords: ["hr intern", "hr internship"] },
      { id: "finance_intern", name: "Finance Intern", keywords: ["finance intern", "finance internship"] },
      { id: "accounting_intern", name: "Accounting Intern", keywords: ["accounting intern", "accounting internship"] },
      { id: "operations_intern", name: "Operations Intern", keywords: ["operations intern", "operations internship"] },
      { id: "data_analyst_intern", name: "Data Analyst Intern", keywords: ["data analyst intern"] },
      { id: "graphic_design_intern", name: "Graphic Design Intern", keywords: ["graphic design intern"] },
      { id: "multimedia_intern", name: "Multimedia Intern", keywords: ["multimedia intern"] },
      { id: "business_dev_intern", name: "Business Development Intern", keywords: ["business development intern", "bd intern"] },
      { id: "customer_support_intern", name: "Customer Support Intern", keywords: ["customer support intern"] },
    ],
  },
];
