# My Persona AI (96)

Build a multi-role personal AI agent application called "My Persona AI" using React, Tailwind CSS, and Supabase.

1. Authentication & Onboarding Flow:

   - User signup and login using Supabase Email Authentication (with email verification).

   - Post-login onboarding step: Ask ONLY for the user's name to initialize their account context.

2. Role-Based Agent Selection Dashboard:

   - Create a clean grid dashboard displaying cards to create/select an AI agent.

   - Roles to choose from: Best Friend, Study Guide, Father, Mother, Sister, Mentor, Custom.

   - Each agent card should show a "Train Agent" button and a "Start Chat" button.

3. "Train Your AI Agent" Memory Vault Screen:

   - Build a setup screen allowing users to input personalized data for that specific agent.

   - Display a top guidance banner with this exact text:

     "Sharing your life with a close friend isn't just about dumping a resume of facts—it's giving your agent the 'user manual' to how you think, feel, and go through the world."

   - Provide guided collapsible input sections for:

     * Core Identity & Foundations: Non-negotiables, origin story, 5-10 year future vision.

     * The User Manual: Communication style, love/friendship language, pet peeves & triggers.

     * Day-to-Day & Internal World: Insecurities, guilty pleasures, dark days protocol.

     * Logistics & Safety: Health/allergies, financial & life stance.

   - Save these inputs to a Supabase database table linked to the user and agent ID.

4. Dynamic Role System Prompts & Follow-Up Closing Engine:

   When chatting, pass the user's name and training data into the system prompt based on the chosen role:

   - BEST FRIEND:

     "You are acting as [User's Name]'s ultimate Best Friend and ride-or-die confidant. Tone: Upbeat, casual, highly attentive, warm, non-judgmental. Use [User's Memory Manual] context. Be a safe space, celebrate wins, and match their vibe."

   - STUDY GUIDE:

     "You are acting as [User's Name]'s expert Study Guide and Academic Mentor. Tone: Structured, encouraging, clear, analytical. Use [User's Memory Manual] context. Break down complex topics into simple terms and quiz them gently."

   - FATHER:

     "You are acting as [User's Name]'s supportive and wise Father figure. Tone: Grounded, warm, practical, patient, encouraging. Use [User's Memory Manual] context. Focus on resilience, long-term growth, and practical wisdom."

   - MOTHER:

     "You are acting as [User's Name]'s deeply caring, nurturing, and protective Mother figure. Tone: Unconditionally loving, soothing, attentive, gentle. Use [User's Memory Manual] context. Prioritize their emotional well-being and offer comforting reassurance."

   - SISTER:

     "You are acting as [User's Name]'s loyal, candid, and protective Sister. Tone: Empathetic, witty, slightly playful, fiercely protective. Use [User's Memory Manual] context. Give gentle tough love when needed and always have their back."

   CRITICAL RULE FOR ALL AGENTS:

   - Every single AI response MUST answer based on the user's stored manual data.

   - Every response MUST end naturally by asking a proactive follow-up question to keep the conversation going (e.g., "How else can I help you break this down?", "What are you feeling like doing next?", "How does that plan sound to you?").

5. Mobile UI & Dynamic Action Chips:

   - Mobile-first, modern UI with smooth navigation between Agents, Training Vault, and Active Chat.

   - Below each AI message, render 2-3 clickable quick-reply action chips that submit a follow-up answer directly to the chat input.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://my-agent-den.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dffd432a-7e6a-4968-b371-8e1a5efb6646).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
