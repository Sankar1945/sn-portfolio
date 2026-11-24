export const onboardingFrameCount = 6;
export const onboardingFrameDuration = 180;

export const onboardingAnimations = [
  { url: '/animations/onboarding-frames/employee-id.png', width: 1.93, center: 0.55, bottom: 0.93 },
  { url: '/animations/onboarding-frames/account-laptop.png', width: 1.96, center: 0.52, bottom: 0.83 },
  { url: '/animations/onboarding-frames/access-shield.png', width: 1.91, center: 0.49, bottom: 0.86 },
  { url: '/animations/onboarding-frames/welcome-envelope.png', width: 1.9, center: 0.50, bottom: 0.83 },
];

export const workflows = [
  {
    name: "Intelligent Invoice Processing",
    animations: [
      { url: '/animations/workflow-frames/invoice-receive.png', width: 1.90, center: 0.51, bottom: 0.85, posterFrame: 5 },
      { url: '/animations/workflow-frames/invoice-extract.png', width: 1.88, center: 0.50, bottom: 0.92 },
      { url: '/animations/workflow-frames/invoice-validate.png', width: 1.84, center: 0.55, bottom: 0.92 },
      { url: '/animations/workflow-frames/finance-update.png', width: 2.00, center: 0.53, bottom: 0.87 },
    ],
    nodes: [
      ["Receive Invoice", "A supplier invoice arrives automatically through email.", "invoice", "Supplier email arrives"],
      ["AI Data Extraction", "AI extracts invoice numbers, amounts, dates, and supplier information.", "scanner", "Reads key invoice fields"],
      ["Validate Information", "The system checks required fields and flags exceptions.", "checklist", "Flags missing details"],
      ["Update Finance System", "Validated invoice details are recorded for further processing.", "database", "Records validated data"],
    ],
  },
  {
    name: "Employee Onboarding Automation",
    animations: onboardingAnimations,
    nodes: [
      ["New Joiner", "HR submits a new employee's onboarding information.", "badge", "HR submits joiner details", "/models/employee-id.glb"],
      ["Create Account", "The automation creates the employee's digital account.", "account", "Sets up a digital account"],
      ["Assign Access", "Role-based access and permissions are assigned.", "shield", "Grants role-based access"],
      ["Welcome Employee", "The employee receives their onboarding information.", "welcome", "Sends onboarding details"],
    ],
  },
  {
    name: "AI Customer Support & Ticket Routing",
    animations: [
      { url: '/animations/workflow-frames/support-request.png', width: 1.70, center: 0.47, bottom: 0.93 },
      { url: '/animations/workflow-frames/support-classify.png', width: 1.82, center: 0.49, bottom: 0.80 },
      { url: '/animations/workflow-frames/support-route.png', width: 1.98, center: 0.49, bottom: 0.84, frameDuration: 160 },
      { url: '/animations/workflow-frames/support-notify.png', width: 1.98, center: 0.51, bottom: 0.81, frameDuration: 160 },
    ],
    nodes: [
      ["Receive Request", "A customer submits a support request.", "ticket", "Customer sends a ticket"],
      ["AI Classification", "AI identifies the request's topic, intent, and urgency.", "processor", "Detects topic and urgency"],
      ["Resolve or Route", "Common questions receive automated responses; complex issues are routed to the right team.", "decision", "Answers or routes to a team"],
      ["Notify Customer", "The customer receives a response or ticket status update.", "notification", "Sends a response or update"],
    ],
  },
];
