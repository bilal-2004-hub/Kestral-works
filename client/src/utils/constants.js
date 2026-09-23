export const PROJECT_STATUS = ['planning', 'in_progress', 'client_review', 'revision', 'completed', 'on_hold'];
export const TASK_STATUS = ['pending', 'in_progress', 'review', 'revision', 'completed'];
export const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'];
export const FEEDBACK_STATUS = ['open', 'in_review', 'resolved'];

export const SERVICES = [
  { key: 'web', name: 'Web development', icon: 'Globe', blurb: 'Marketing sites and web apps built to load fast and stay maintainable.' },
  { key: 'mobile', name: 'Mobile apps', icon: 'Smartphone', blurb: 'iOS and Android from one codebase, shipped to both stores.' },
  { key: 'design', name: 'UI/UX design', icon: 'PenTool', blurb: 'Research, flows and interface systems your engineers can build from.' },
  { key: 'software', name: 'Custom software', icon: 'Boxes', blurb: 'Internal tools and platforms that replace the spreadsheet holding it together.' },
  { key: 'ecommerce', name: 'E-commerce', icon: 'ShoppingBag', blurb: 'Storefronts, checkout and the integrations behind fulfilment.' },
  { key: 'seo', name: 'SEO', icon: 'Search', blurb: 'Technical audits and content structure that earn durable rankings.' },
  { key: 'marketing', name: 'Digital marketing', icon: 'Megaphone', blurb: 'Campaigns measured against revenue, not impressions.' },
  { key: 'support', name: 'Maintenance', icon: 'LifeBuoy', blurb: 'Monitoring, updates and a named engineer who knows your codebase.' },
];

export const PROCESS = [
  { step: 'Consultation', detail: 'A call to understand the business problem before anyone mentions a framework.' },
  { step: 'Requirements', detail: 'We write down what is in scope, what is not, and what success looks like.' },
  { step: 'Planning', detail: 'Milestones, budget and the sequence of releases, agreed in writing.' },
  { step: 'Design', detail: 'Flows and interfaces reviewed with you before code starts.' },
  { step: 'Development', detail: 'Two-week cycles, each ending in something you can click.' },
  { step: 'Testing', detail: 'Automated checks plus a manual pass across devices and edge cases.' },
  { step: 'Your review', detail: 'You leave feedback in the portal; we turn it into tasks you can watch.' },
  { step: 'Launch', detail: 'Deployment, monitoring and handover documentation.' },
  { step: 'Maintenance', detail: 'Ongoing support with response times we commit to.' },
];

export const COMPANY = {
  name: 'Kestrel Works',
  tagline: 'Software studio and client workspace',
  email: 'hello@kestrelworks.dev',
  phone: '+92 61 000 0000',
  address: 'Gulgasht Colony, Multan, Pakistan',
};
