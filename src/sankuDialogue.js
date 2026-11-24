export const sankuDialogue = {
  home: ['wave', "Hiiii! 👋 I'm Sanku, your portfolio guide. Want to see an automation in action? Pick a workflow in the lab."],
  arrival: ['thinking', "WHOA! 😵‍💫 Where am I?! Ohhh, a visitor! Hiiii! I'm Sanku, your little tour guide! 👋"],
  about: ['explaining', "That's my boss! 😎 He builds AI agents and automates business workflows. I might know where he hid his portrait."],
  skills: ['thinking', "Pick a technology and I'll show you what it does, with a real example when I have one. 🔎"],
  experience: ['explaining', "Here's where my boss puts automation to work as a Copilot Trainee. Copilot Studio, Power Automate, and APIs do a lot of the heavy lifting."],
  projects: ['explaining', "Ooo, the project lab! 🚀 This is where my boss turns ideas into working solutions. Want the inside story? I've got you!"],
  certifications: ['celebration', "Tadaaaa! 🎉 Two milestones! One for automation, one for Generative AI. Looks like my boss has been busy learning again! 😎"],
  contact: ['wave', "Got an automation idea? Email or LinkedIn is the best way to reach my boss. 👋"],
  classified: ['shhh', "SHHHHH! 🤫 TOP SECRET! My boss is building something special. I tried peeking... even I don't know everything yet! 👀"],
  hint: ['explaining', "Pssst... want to see the hidden portrait? I know where to look. 👀"],
  secretMission: ['shhh', "Psst... 🤫 My boss is hiding something right here! Wanna uncover it? Swipe across this photo. Don't tell him I helped! 👀"],
  started: ['shhh', "There you go! 👀 Keep swiping until the face comes into view."],
  completed: ['celebration', "AHHH! 😂 You found him! Okay, my boss doesn't need to know I helped. This stays between us! 🤫"],
  again: ['wave', "Back for more? 👀 The automation lab and project demos are worth a look."],
  idle: ['wave', "Need a starting point? The Skills section has quick explanations of each tool."],
  timesheet: "This one's a big deal! 👀 My boss built an end-to-end timesheet system — from collecting employee activities through an AI agent to tracking submissions, automating reminders, and generating workforce reports. Let me show you how it works!",
  lex: "This Amazon Lex demo takes a car request from the first message through confirmation. Want to see how the conversation works? 🚗",
  classifiedHint: "Nice try 😄 My boss put me on a strict no-spoilers diet.",
};

export function sankuReadingTime(text) {
  return Math.min(8000, Math.max(4500, 1600 + text.length * 37));
}

export const sankuProjectReactions = {
  'hr-onboarding': ['explaining', "This onboarding design starts with an employee event, checks readiness, and brings global and regional sessions into one agenda. 👋"],
  timesheet: ['explaining', "This isn't just a reminder bot! 👀 It's a complete timesheet and workforce automation system — collecting activities, retrieving records, monitoring compliance, and generating reports."],
  lex: ['explaining', "My boss built this chatbot to demonstrate conversational car ordering with Amazon Lex. Fancy choosing a car through a conversation? 🚗"],
  mascot: ['shhh', "Shhhhh! 🤫 Classified project ahead! My boss is building something special, and I'm not supposed to spill the secrets!"],
};