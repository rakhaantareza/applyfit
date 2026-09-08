CREATE TABLE public.career_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT career_fields_slug_not_blank CHECK (BTRIM(slug) <> ''),
  CONSTRAINT career_fields_name_not_blank CHECK (BTRIM(name) <> ''),
  CONSTRAINT career_fields_normalized_name_not_blank CHECK (BTRIM(normalized_name) <> '')
);

CREATE TABLE public.career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT career_roles_slug_not_blank CHECK (BTRIM(slug) <> ''),
  CONSTRAINT career_roles_name_not_blank CHECK (BTRIM(name) <> ''),
  CONSTRAINT career_roles_normalized_name_not_blank CHECK (BTRIM(normalized_name) <> '')
);

CREATE TABLE public.career_role_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT career_role_aliases_alias_not_blank CHECK (BTRIM(alias) <> ''),
  CONSTRAINT career_role_aliases_normalized_alias_not_blank CHECK (BTRIM(normalized_alias) <> '')
);

CREATE TABLE public.catalog_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_skills_slug_not_blank CHECK (BTRIM(slug) <> ''),
  CONSTRAINT catalog_skills_name_not_blank CHECK (BTRIM(name) <> ''),
  CONSTRAINT catalog_skills_normalized_name_not_blank CHECK (BTRIM(normalized_name) <> '')
);

CREATE TABLE public.catalog_skill_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.catalog_skills(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT catalog_skill_aliases_alias_not_blank CHECK (BTRIM(alias) <> ''),
  CONSTRAINT catalog_skill_aliases_normalized_alias_not_blank CHECK (BTRIM(normalized_alias) <> '')
);

CREATE TABLE public.career_field_roles (
  field_id UUID NOT NULL REFERENCES public.career_fields(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (field_id, role_id)
);

CREATE TABLE public.career_role_skills (
  role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.catalog_skills(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (role_id, skill_id)
);

CREATE INDEX career_role_aliases_role_id_idx
  ON public.career_role_aliases (role_id);

CREATE INDEX catalog_skill_aliases_skill_id_idx
  ON public.catalog_skill_aliases (skill_id);

CREATE INDEX career_field_roles_role_id_idx
  ON public.career_field_roles (role_id);

CREATE INDEX career_role_skills_skill_id_idx
  ON public.career_role_skills (skill_id);

ALTER TABLE public.profiles
  ADD COLUMN career_field_id UUID REFERENCES public.career_fields(id) ON DELETE SET NULL,
  ADD COLUMN target_role_id UUID REFERENCES public.career_roles(id) ON DELETE SET NULL;

ALTER TABLE public.skills
  ADD COLUMN catalog_skill_id UUID REFERENCES public.catalog_skills(id) ON DELETE SET NULL;

CREATE INDEX profiles_career_field_id_idx
  ON public.profiles (career_field_id);

CREATE INDEX profiles_target_role_id_idx
  ON public.profiles (target_role_id);

CREATE INDEX skills_catalog_skill_id_idx
  ON public.skills (catalog_skill_id);

ALTER TABLE public.career_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_role_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_field_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_role_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY career_fields_select_catalog
  ON public.career_fields FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY career_roles_select_catalog
  ON public.career_roles FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY career_role_aliases_select_catalog
  ON public.career_role_aliases FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY catalog_skills_select_catalog
  ON public.catalog_skills FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY catalog_skill_aliases_select_catalog
  ON public.catalog_skill_aliases FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY career_field_roles_select_catalog
  ON public.career_field_roles FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY career_role_skills_select_catalog
  ON public.career_role_skills FOR SELECT TO authenticated USING (TRUE);

REVOKE ALL ON public.career_fields FROM anon, authenticated;
REVOKE ALL ON public.career_roles FROM anon, authenticated;
REVOKE ALL ON public.career_role_aliases FROM anon, authenticated;
REVOKE ALL ON public.catalog_skills FROM anon, authenticated;
REVOKE ALL ON public.catalog_skill_aliases FROM anon, authenticated;
REVOKE ALL ON public.career_field_roles FROM anon, authenticated;
REVOKE ALL ON public.career_role_skills FROM anon, authenticated;

GRANT SELECT ON public.career_fields TO authenticated;
GRANT SELECT ON public.career_roles TO authenticated;
GRANT SELECT ON public.career_role_aliases TO authenticated;
GRANT SELECT ON public.catalog_skills TO authenticated;
GRANT SELECT ON public.catalog_skill_aliases TO authenticated;
GRANT SELECT ON public.career_field_roles TO authenticated;
GRANT SELECT ON public.career_role_skills TO authenticated;

GRANT INSERT (career_field_id, target_role_id)
  ON public.profiles TO authenticated;

GRANT UPDATE (career_field_id, target_role_id)
  ON public.profiles TO authenticated;

GRANT INSERT (catalog_skill_id)
  ON public.skills TO authenticated;

GRANT UPDATE (catalog_skill_id)
  ON public.skills TO authenticated;

INSERT INTO public.career_fields (slug, name, normalized_name, sort_order) VALUES
  ('software-it', 'Software & IT', 'software & it', 10),
  ('design-creative', 'Design & Creative', 'design & creative', 20),
  ('marketing', 'Marketing', 'marketing', 30),
  ('data-analytics', 'Data & Analytics', 'data & analytics', 40),
  ('product-business', 'Product & Business', 'product & business', 50),
  ('finance-accounting', 'Finance & Accounting', 'finance & accounting', 60),
  ('operations-supply-chain', 'Operations & Supply Chain', 'operations & supply chain', 70),
  ('people-communication', 'People & Communication', 'people & communication', 80);

INSERT INTO public.career_roles (slug, name, normalized_name) VALUES
  ('frontend-engineer', 'Frontend Engineer', 'frontend engineer'),
  ('backend-engineer', 'Backend Engineer', 'backend engineer'),
  ('full-stack-engineer', 'Full-stack Engineer', 'full-stack engineer'),
  ('qa-engineer', 'QA Engineer', 'qa engineer'),
  ('devops-engineer', 'DevOps Engineer', 'devops engineer'),
  ('mobile-engineer', 'Mobile Engineer', 'mobile engineer'),
  ('cybersecurity-analyst', 'Cybersecurity Analyst', 'cybersecurity analyst'),
  ('graphic-designer', 'Graphic Designer', 'graphic designer'),
  ('ui-designer', 'UI Designer', 'ui designer'),
  ('ux-designer', 'UX Designer', 'ux designer'),
  ('product-designer', 'Product Designer', 'product designer'),
  ('motion-designer', 'Motion Designer', 'motion designer'),
  ('digital-marketing-specialist', 'Digital Marketing Specialist', 'digital marketing specialist'),
  ('seo-specialist', 'SEO Specialist', 'seo specialist'),
  ('social-media-specialist', 'Social Media Specialist', 'social media specialist'),
  ('brand-marketing-specialist', 'Brand Marketing Specialist', 'brand marketing specialist'),
  ('content-marketing-specialist', 'Content Marketing Specialist', 'content marketing specialist'),
  ('data-analyst', 'Data Analyst', 'data analyst'),
  ('business-intelligence-analyst', 'Business Intelligence Analyst', 'business intelligence analyst'),
  ('data-scientist', 'Data Scientist', 'data scientist'),
  ('data-engineer', 'Data Engineer', 'data engineer'),
  ('machine-learning-engineer', 'Machine Learning Engineer', 'machine learning engineer'),
  ('product-manager', 'Product Manager', 'product manager'),
  ('business-analyst', 'Business Analyst', 'business analyst'),
  ('project-manager', 'Project Manager', 'project manager'),
  ('customer-success-specialist', 'Customer Success Specialist', 'customer success specialist'),
  ('financial-analyst', 'Financial Analyst', 'financial analyst'),
  ('accountant', 'Accountant', 'accountant'),
  ('auditor', 'Auditor', 'auditor'),
  ('operations-analyst', 'Operations Analyst', 'operations analyst'),
  ('supply-chain-analyst', 'Supply Chain Analyst', 'supply chain analyst'),
  ('procurement-specialist', 'Procurement Specialist', 'procurement specialist'),
  ('recruiter', 'Recruiter', 'recruiter'),
  ('hr-generalist', 'HR Generalist', 'hr generalist'),
  ('communications-specialist', 'Communications Specialist', 'communications specialist');

INSERT INTO public.career_role_aliases (role_id, alias, normalized_alias)
SELECT role.id, alias.alias, alias.normalized_alias
FROM (VALUES
  ('frontend-engineer', 'Frontend Developer', 'frontend developer'),
  ('backend-engineer', 'Backend Developer', 'backend developer'),
  ('full-stack-engineer', 'Fullstack Developer', 'fullstack developer'),
  ('full-stack-engineer', 'Full Stack Developer', 'full stack developer'),
  ('qa-engineer', 'Software Tester', 'software tester'),
  ('devops-engineer', 'DevOps', 'devops'),
  ('mobile-engineer', 'Mobile Developer', 'mobile developer'),
  ('ui-designer', 'User Interface Designer', 'user interface designer'),
  ('ux-designer', 'User Experience Designer', 'user experience designer'),
  ('digital-marketing-specialist', 'Digital Marketer', 'digital marketer'),
  ('social-media-specialist', 'Social Media Manager', 'social media manager'),
  ('business-intelligence-analyst', 'BI Analyst', 'bi analyst'),
  ('machine-learning-engineer', 'ML Engineer', 'ml engineer'),
  ('product-manager', 'Product Owner', 'product owner'),
  ('customer-success-specialist', 'Customer Success', 'customer success'),
  ('hr-generalist', 'Human Resources Generalist', 'human resources generalist')
) AS alias(role_slug, alias, normalized_alias)
JOIN public.career_roles AS role ON role.slug = alias.role_slug;

INSERT INTO public.catalog_skills (slug, name, normalized_name) VALUES
  ('javascript', 'JavaScript', 'javascript'),
  ('typescript', 'TypeScript', 'typescript'),
  ('react', 'React', 'react'),
  ('nextjs', 'Next.js', 'next.js'),
  ('vuejs', 'Vue.js', 'vue.js'),
  ('angular', 'Angular', 'angular'),
  ('html', 'HTML', 'html'),
  ('css', 'CSS', 'css'),
  ('nodejs', 'Node.js', 'node.js'),
  ('python', 'Python', 'python'),
  ('java', 'Java', 'java'),
  ('kotlin', 'Kotlin', 'kotlin'),
  ('swift', 'Swift', 'swift'),
  ('react-native', 'React Native', 'react native'),
  ('flutter', 'Flutter', 'flutter'),
  ('sql', 'SQL', 'sql'),
  ('postgresql', 'PostgreSQL', 'postgresql'),
  ('rest-api', 'REST API', 'rest api'),
  ('graphql', 'GraphQL', 'graphql'),
  ('git', 'Git', 'git'),
  ('docker', 'Docker', 'docker'),
  ('kubernetes', 'Kubernetes', 'kubernetes'),
  ('aws', 'AWS', 'aws'),
  ('ci-cd', 'CI/CD', 'ci/cd'),
  ('manual-testing', 'Manual Testing', 'manual testing'),
  ('automated-testing', 'Automated Testing', 'automated testing'),
  ('selenium', 'Selenium', 'selenium'),
  ('playwright', 'Playwright', 'playwright'),
  ('data-analysis', 'Data Analysis', 'data analysis'),
  ('data-visualization', 'Data Visualization', 'data visualization'),
  ('microsoft-excel', 'Microsoft Excel', 'microsoft excel'),
  ('tableau', 'Tableau', 'tableau'),
  ('power-bi', 'Power BI', 'power bi'),
  ('pandas', 'Pandas', 'pandas'),
  ('machine-learning', 'Machine Learning', 'machine learning'),
  ('tensorflow', 'TensorFlow', 'tensorflow'),
  ('figma', 'Figma', 'figma'),
  ('ui-design', 'UI Design', 'ui design'),
  ('ux-research', 'UX Research', 'ux research'),
  ('wireframing', 'Wireframing', 'wireframing'),
  ('prototyping', 'Prototyping', 'prototyping'),
  ('adobe-illustrator', 'Adobe Illustrator', 'adobe illustrator'),
  ('adobe-photoshop', 'Adobe Photoshop', 'adobe photoshop'),
  ('after-effects', 'After Effects', 'after effects'),
  ('seo', 'SEO', 'seo'),
  ('google-analytics', 'Google Analytics', 'google analytics'),
  ('content-strategy', 'Content Strategy', 'content strategy'),
  ('social-media-management', 'Social Media Management', 'social media management'),
  ('copywriting', 'Copywriting', 'copywriting'),
  ('brand-strategy', 'Brand Strategy', 'brand strategy'),
  ('financial-modeling', 'Financial Modeling', 'financial modeling'),
  ('accounting', 'Accounting', 'accounting'),
  ('auditing', 'Auditing', 'auditing'),
  ('project-management', 'Project Management', 'project management'),
  ('product-strategy', 'Product Strategy', 'product strategy'),
  ('user-research', 'User Research', 'user research'),
  ('stakeholder-management', 'Stakeholder Management', 'stakeholder management'),
  ('agile', 'Agile', 'agile'),
  ('supply-chain-management', 'Supply Chain Management', 'supply chain management'),
  ('procurement', 'Procurement', 'procurement'),
  ('recruitment', 'Recruitment', 'recruitment'),
  ('communication', 'Communication', 'communication');

INSERT INTO public.catalog_skill_aliases (skill_id, alias, normalized_alias)
SELECT skill.id, alias.alias, alias.normalized_alias
FROM (VALUES
  ('javascript', 'JS', 'js'),
  ('javascript', 'ECMAScript', 'ecmascript'),
  ('typescript', 'TS', 'ts'),
  ('react', 'ReactJS', 'reactjs'),
  ('react', 'React.js', 'react.js'),
  ('nextjs', 'NextJS', 'nextjs'),
  ('vuejs', 'VueJS', 'vuejs'),
  ('nodejs', 'NodeJS', 'nodejs'),
  ('nodejs', 'Node', 'node'),
  ('postgresql', 'Postgres', 'postgres'),
  ('rest-api', 'RESTful API', 'restful api'),
  ('ci-cd', 'Continuous Integration', 'continuous integration'),
  ('microsoft-excel', 'Excel', 'excel'),
  ('microsoft-excel', 'MS Excel', 'ms excel'),
  ('power-bi', 'PowerBI', 'powerbi'),
  ('google-analytics', 'GA4', 'ga4'),
  ('adobe-illustrator', 'Illustrator', 'illustrator'),
  ('adobe-photoshop', 'Photoshop', 'photoshop'),
  ('after-effects', 'Adobe After Effects', 'adobe after effects'),
  ('machine-learning', 'ML', 'ml')
) AS alias(skill_slug, alias, normalized_alias)
JOIN public.catalog_skills AS skill ON skill.slug = alias.skill_slug;

INSERT INTO public.career_field_roles (field_id, role_id, sort_order)
SELECT field.id, role.id, relation.sort_order
FROM (VALUES
  ('software-it', 'frontend-engineer', 10),
  ('software-it', 'backend-engineer', 20),
  ('software-it', 'full-stack-engineer', 30),
  ('software-it', 'qa-engineer', 40),
  ('software-it', 'devops-engineer', 50),
  ('software-it', 'mobile-engineer', 60),
  ('software-it', 'cybersecurity-analyst', 70),
  ('design-creative', 'graphic-designer', 10),
  ('design-creative', 'ui-designer', 20),
  ('design-creative', 'ux-designer', 30),
  ('design-creative', 'product-designer', 40),
  ('design-creative', 'motion-designer', 50),
  ('marketing', 'digital-marketing-specialist', 10),
  ('marketing', 'seo-specialist', 20),
  ('marketing', 'social-media-specialist', 30),
  ('marketing', 'brand-marketing-specialist', 40),
  ('marketing', 'content-marketing-specialist', 50),
  ('data-analytics', 'data-analyst', 10),
  ('data-analytics', 'business-intelligence-analyst', 20),
  ('data-analytics', 'data-scientist', 30),
  ('data-analytics', 'data-engineer', 40),
  ('data-analytics', 'machine-learning-engineer', 50),
  ('data-analytics', 'business-analyst', 60),
  ('product-business', 'product-manager', 10),
  ('product-business', 'product-designer', 20),
  ('product-business', 'business-analyst', 30),
  ('product-business', 'project-manager', 40),
  ('product-business', 'customer-success-specialist', 50),
  ('finance-accounting', 'financial-analyst', 10),
  ('finance-accounting', 'accountant', 20),
  ('finance-accounting', 'auditor', 30),
  ('operations-supply-chain', 'operations-analyst', 10),
  ('operations-supply-chain', 'supply-chain-analyst', 20),
  ('operations-supply-chain', 'procurement-specialist', 30),
  ('operations-supply-chain', 'project-manager', 40),
  ('people-communication', 'recruiter', 10),
  ('people-communication', 'hr-generalist', 20),
  ('people-communication', 'communications-specialist', 30),
  ('people-communication', 'customer-success-specialist', 40)
) AS relation(field_slug, role_slug, sort_order)
JOIN public.career_fields AS field ON field.slug = relation.field_slug
JOIN public.career_roles AS role ON role.slug = relation.role_slug;

INSERT INTO public.career_role_skills (role_id, skill_id, sort_order)
SELECT role.id, skill.id, relation.sort_order
FROM (VALUES
  ('frontend-engineer', 'html', 10), ('frontend-engineer', 'css', 20), ('frontend-engineer', 'javascript', 30), ('frontend-engineer', 'react', 40), ('frontend-engineer', 'typescript', 50),
  ('backend-engineer', 'nodejs', 10), ('backend-engineer', 'python', 20), ('backend-engineer', 'sql', 30), ('backend-engineer', 'postgresql', 40), ('backend-engineer', 'rest-api', 50),
  ('full-stack-engineer', 'javascript', 10), ('full-stack-engineer', 'typescript', 20), ('full-stack-engineer', 'react', 30), ('full-stack-engineer', 'nodejs', 40), ('full-stack-engineer', 'sql', 50),
  ('qa-engineer', 'manual-testing', 10), ('qa-engineer', 'automated-testing', 20), ('qa-engineer', 'selenium', 30), ('qa-engineer', 'playwright', 40),
  ('devops-engineer', 'docker', 10), ('devops-engineer', 'kubernetes', 20), ('devops-engineer', 'aws', 30), ('devops-engineer', 'ci-cd', 40),
  ('mobile-engineer', 'react-native', 10), ('mobile-engineer', 'flutter', 20), ('mobile-engineer', 'kotlin', 30), ('mobile-engineer', 'swift', 40),
  ('graphic-designer', 'adobe-illustrator', 10), ('graphic-designer', 'adobe-photoshop', 20), ('graphic-designer', 'figma', 30),
  ('ui-designer', 'ui-design', 10), ('ui-designer', 'figma', 20), ('ui-designer', 'wireframing', 30), ('ui-designer', 'prototyping', 40),
  ('ux-designer', 'ux-research', 10), ('ux-designer', 'user-research', 20), ('ux-designer', 'wireframing', 30), ('ux-designer', 'prototyping', 40),
  ('product-designer', 'figma', 10), ('product-designer', 'ui-design', 20), ('product-designer', 'ux-research', 30), ('product-designer', 'prototyping', 40),
  ('motion-designer', 'after-effects', 10), ('motion-designer', 'adobe-illustrator', 20), ('motion-designer', 'adobe-photoshop', 30),
  ('digital-marketing-specialist', 'google-analytics', 10), ('digital-marketing-specialist', 'seo', 20), ('digital-marketing-specialist', 'content-strategy', 30), ('digital-marketing-specialist', 'social-media-management', 40),
  ('seo-specialist', 'seo', 10), ('seo-specialist', 'google-analytics', 20), ('seo-specialist', 'content-strategy', 30),
  ('social-media-specialist', 'social-media-management', 10), ('social-media-specialist', 'content-strategy', 20), ('social-media-specialist', 'copywriting', 30),
  ('brand-marketing-specialist', 'brand-strategy', 10), ('brand-marketing-specialist', 'content-strategy', 20), ('brand-marketing-specialist', 'stakeholder-management', 30),
  ('data-analyst', 'data-analysis', 10), ('data-analyst', 'sql', 20), ('data-analyst', 'microsoft-excel', 30), ('data-analyst', 'data-visualization', 40),
  ('business-intelligence-analyst', 'sql', 10), ('business-intelligence-analyst', 'power-bi', 20), ('business-intelligence-analyst', 'tableau', 30), ('business-intelligence-analyst', 'data-visualization', 40),
  ('data-scientist', 'python', 10), ('data-scientist', 'pandas', 20), ('data-scientist', 'machine-learning', 30), ('data-scientist', 'sql', 40),
  ('data-engineer', 'python', 10), ('data-engineer', 'sql', 20), ('data-engineer', 'postgresql', 30), ('data-engineer', 'aws', 40),
  ('machine-learning-engineer', 'python', 10), ('machine-learning-engineer', 'machine-learning', 20), ('machine-learning-engineer', 'tensorflow', 30), ('machine-learning-engineer', 'docker', 40),
  ('product-manager', 'product-strategy', 10), ('product-manager', 'user-research', 20), ('product-manager', 'stakeholder-management', 30), ('product-manager', 'agile', 40),
  ('business-analyst', 'data-analysis', 10), ('business-analyst', 'microsoft-excel', 20), ('business-analyst', 'stakeholder-management', 30), ('business-analyst', 'sql', 40),
  ('project-manager', 'project-management', 10), ('project-manager', 'stakeholder-management', 20), ('project-manager', 'agile', 30), ('project-manager', 'communication', 40),
  ('financial-analyst', 'financial-modeling', 10), ('financial-analyst', 'microsoft-excel', 20), ('financial-analyst', 'data-analysis', 30),
  ('accountant', 'accounting', 10), ('accountant', 'microsoft-excel', 20), ('accountant', 'auditing', 30),
  ('auditor', 'auditing', 10), ('auditor', 'accounting', 20), ('auditor', 'microsoft-excel', 30),
  ('operations-analyst', 'data-analysis', 10), ('operations-analyst', 'microsoft-excel', 20), ('operations-analyst', 'project-management', 30),
  ('supply-chain-analyst', 'supply-chain-management', 10), ('supply-chain-analyst', 'data-analysis', 20), ('supply-chain-analyst', 'microsoft-excel', 30),
  ('procurement-specialist', 'procurement', 10), ('procurement-specialist', 'stakeholder-management', 20), ('procurement-specialist', 'communication', 30),
  ('recruiter', 'recruitment', 10), ('recruiter', 'communication', 20), ('recruiter', 'stakeholder-management', 30),
  ('hr-generalist', 'recruitment', 10), ('hr-generalist', 'communication', 20), ('hr-generalist', 'project-management', 30),
  ('communications-specialist', 'communication', 10), ('communications-specialist', 'copywriting', 20), ('communications-specialist', 'content-strategy', 30)
) AS relation(role_slug, skill_slug, sort_order)
JOIN public.career_roles AS role ON role.slug = relation.role_slug
JOIN public.catalog_skills AS skill ON skill.slug = relation.skill_slug;
