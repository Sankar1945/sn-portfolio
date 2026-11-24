import { BrainCircuit, Code2, PlugZap, Workflow } from 'lucide-react';

const timesheet = 'Intelligent Timesheet Management';
const technology = (name, description, application, project) => ({ name, description, application, project });

export const skills = [
  {
    icon: Workflow, name: 'Automation', items: [
      technology('Microsoft Power Automate', 'Connects apps and automates routine tasks.', 'Runs the steps behind the timesheet conversation and sends reminders when a submission is missing.', timesheet),
      technology('Cloud Flow Development', 'Builds workflows that run in the cloud from a trigger and a sequence of actions.', 'The timesheet project uses Power Automate to check submissions and coordinate follow-ups.', timesheet),
      technology('Workflow Orchestration', 'Coordinates steps and dependencies across systems.', 'Connects the timesheet conversation, SharePoint records, reminders, and manager escalation.', timesheet),
      technology('Scheduled & Event-Driven Automation', 'Runs workflows on a timetable or in response to a specific event.', 'A scheduled flow can check for overdue submissions. An event-driven flow can react when a record is created.'),
      technology('Business Process Automation', 'Automates repeatable business procedures and their decision rules.', 'The timesheet project applies this to submission checks, reminders, and manager escalation.', timesheet),
    ],
  },
  {
    icon: BrainCircuit, name: 'AI & Agents', items: [
      technology('Microsoft Copilot Studio', 'Builds conversational agents that can call tools and workflows.', 'Handles the timesheet conversation and hands work to Power Automate.', timesheet),
      technology('Conversational AI Agents', 'Guide people through tasks in plain language and can use connected tools.', 'The timesheet agent guides employees through department-specific questions and hands work to an automation flow.', timesheet),
      technology('Generative AI', 'Produces content such as text from instructions and context.', 'An assistant can draft a first response for human review.'),
      technology('Prompt Engineering', 'Uses instructions, context, and examples to guide model responses.', 'Specifying an output structure and providing examples can make responses easier to check and use.'),
      technology('Microsoft Foundry', 'An Azure platform for building and managing AI models and agents.', 'Teams can compare models, connect agents to tools, and evaluate how they respond to representative tasks.'),
    ],
  },
  {
    icon: Code2, name: 'Development', items: [
      technology('C#', 'A programming language commonly used with .NET.', 'Applications can use typed models and methods to represent data and enforce business rules.'),
      technology('.NET', 'Provides the runtime and libraries for building applications.', 'Supports web APIs, desktop applications, and reusable libraries.'),
      technology('Python', 'A general-purpose programming language used for scripting, data processing, and application development.', 'A script can read structured files, transform records, or call an API.'),
      technology('Application Development', 'Turns requirements into software people can use.', 'Connects interface design, application logic, and testing to deliver an end-to-end feature.'),
    ],
  },
  {
    icon: PlugZap, name: 'Integrations & Platforms', items: [
      technology('REST APIs', 'Connects systems through HTTP requests and responses to resource endpoints.', 'An integration can read a record with GET, create one with POST, and handle the returned status code.'),
      technology('OAuth 2.0', 'OAuth 2.0 grants scoped access to resources through access tokens. OpenID Connect adds user authentication when sign-in is required.', 'An application can obtain a scoped access token and present it to a protected API without handling the user’s password.'),
      technology('HTTP Integrations', 'Exchanges data between services through HTTP requests.', 'A workflow can send a JSON payload to an endpoint, then use the response status and body to decide what happens next.'),
      technology('Microsoft Entra ID', 'Defines an application identity in the Microsoft identity platform.', 'An app registration configures an application ID, supported account types, and any required redirect URIs or API permissions.'),
      technology('SharePoint', 'Connects workflows and applications to SharePoint lists and document libraries.', 'SharePoint stores timesheet activity records so the workflow can retrieve them during submission checks.', timesheet),
      technology('Microsoft Power Apps', 'A low-code platform for building business applications.', 'A canvas app can present a custom form, connect to a data source, and hand off work to a Power Automate flow.'),
      technology('Microsoft Business Central APIs', 'Expose supported Business Central business records through API endpoints.', 'Authorized applications can read or update supported records, such as customers and sales documents.'),
    ],
  },
];
