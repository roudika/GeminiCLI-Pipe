Mission: Build a Video-to-Social Automation Pipeline for KloudiHub.

Goal: Create a system that transcribes a YouTube video and generates a specialized content kit (Ghost, LinkedIn, IG, Twitter).

Technical Stack:

Next.js (Frontend/Trigger): A simple Vercel-hosted dashboard to input a URL and hit "Generate."

Node.js/Express (Backend/Worker): An API listener to run on my Linux VPS.

Gemini CLI (The Engine): Use the pre-authenticated CLI on my VPS.

Execution Logic:

Phase 1: Use gemini-2.5-flash-lite to extract a verbatim English transcript from the YouTube URL.

Phase 2: Feed that transcript to gemini-3-flash to generate 4 parts:

Ghost Post: Strictly formatted as Lexical JSON for the Ghost Admin API.

LinkedIn/IG/Twitter: Professional, technical posts focused on LLM hosting/APIs.

Phase 3: Create a Bash script that splits these outputs and saves them into a date-stamped folder structure: ./content/[date]/[platform]/file.txt.

Phase 4: Automatically push the Lexical JSON to the Ghost API as a draft.

Requirements:

All content must be in English.

The style must be professional for my brand, KloudiHub.

Ensure the Node.js worker is secure (use a secret token for the webhook).

If images are handled, use the sharp library to convert to WebP (80% quality).