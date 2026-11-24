import { sankuDialogue } from './sankuDialogue';
export const projectDialogues = {
  'hr-onboarding': {
    greeting: 'Here’s the plan for a new joiner: validate the employee details, coordinate global sessions, then bring the relevant regional sessions into one agenda. 👋',
    topics: [
      ['What is HR Onboarding Flow?', "Hehe! 👋 My boss planned an event-driven onboarding workflow that connects employee validation, global onboarding sessions and region-specific agenda preparation. The goal is to make HR coordination more consistent and organized."],
      ['How does the automation start?', "It begins with relevant Microsoft Entra ID employee events! Webhook-driven processing can notify Power Automate when a user is created or updated. The workflow then checks employee details and readiness before coordinating onboarding activities."],
      ['How are duplicate webhook events handled?', "Here's the interesting part! 🔍 User creation and subsequent license or profile updates can generate multiple events. The architecture includes employee-ID-based tracking, license-readiness checks and SharePoint idempotency logic to avoid duplicate onboarding actions."],
      ['How are global onboarding sessions handled?', "🌍 Global onboarding sessions are centrally planned and created or coordinated through the workflow design. The employee's joining date and session rules determine which sessions should be scheduled."],
      ['How are regional sessions handled?', "📍 Regional sessions are selected according to the employee's region. Rather than automatically creating every regional session, the workflow includes the applicable existing sessions in the new joiner's agenda."],
      ['How is the onboarding agenda prepared?', "📅 The agenda combines applicable global sessions with region-specific sessions for the employee. Joining date, region, session availability and scheduling rules shape the personalized onboarding plan."],
      ['Which Microsoft technologies are involved?', "The architecture uses Microsoft Entra ID for employee events, webhooks for notifications, Power Automate for orchestration, SharePoint for tracking and configuration, and Microsoft 365 services for scheduling and communication."],
      ['What are the key technical challenges?', "⚙️ Duplicate webhook events, license readiness, concurrent flow runs, missing employee details, regional eligibility, session availability and scheduling changes are the main design considerations."],
    ],
  },
  timesheet: {
    greeting: sankuDialogue.timesheet,
    topics: [
      ['How do employees submit activities?', 'Employees use the Copilot Studio agent in Teams or Microsoft 365 Copilot Chat. Adaptive Cards guide them through activity-based questions tailored to six departments.'],
      ['How does the agent retrieve previous activities?', 'It retrieves up to three weeks of SharePoint timesheets, compares weekly activities, and identifies customer engagements in tables. Power Automate filters large customer lists as employees type. 🔎'],
      ['How does compliance automation work?', 'Scheduled reminders, employee-specific pending submission alerts, holiday-adjusted targets, and manager escalations handle follow-ups. HR gets consolidated compliance reports.'],
      ['How does HR get workforce insights?', 'The system generates and distributes monthly Excel reports by department. Employee-level breakdowns and percentage-based pie charts show how time was distributed. 📊'],
    ],
  },
  lex: {
    greeting: sankuDialogue.lex,
    topics: [
      ['How did the bot learn what to do?', 'Sankara created an Amazon Lex bot, set its language, then configured intents and sample utterances. The intents describe what the user wants. The utterances give Lex examples of how someone might ask.'],
      ['What details can it collect?', 'Built-in slots gather customer information. Custom slots let the bot recognize the demo catalog of about 20 car models and the available colour choices.'],
      ['How does picking a car work?', 'The bot prompts for the details it needs, presents car models and prices, and asks for a delivery date. If an answer doesn’t fit, it can ask again before moving on to confirmation.'],
      ['Can I change my mind?', 'Yep. The bot collects the choices and asks whether to confirm or cancel. Either outcome ends the simulated order flow.'],
      ['How do you test it?', 'Build the bot in Lex, then try a conversation in the test chat. Try giving it an unexpected answer, then run through both confirmation and cancellation to check the prompts.'],
    ],
  },
  mascot: {
    greeting: sankuDialogue.classified[1],
    topics: [
      ['Just one hint?', sankuDialogue.classifiedHint],
    ],
  },
};
