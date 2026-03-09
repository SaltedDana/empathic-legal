

# Legal Empathy Bridge - Implementation Plan

## Overview
A two-party agreement tool where people privately share their fears and interests about a contract. The AI translates these into empathic language and suggests relevant legal protections, helping both sides understand each other's concerns without direct confrontation.

---

## Core User Flow

### 1. **Starting a Session (Party A)**
- Party A lands on home page
- Clicks "Start New Agreement"
- Fills out free-text context: "What kind of agreement is this? Describe the situation."
- System creates a unique session and generates a short shareable link
- Party A fills out their fears/interests form (private, not shown to Party B)
- Gets a link to share with Party B

### 2. **Joining a Session (Party B)**
- Party B receives link from Party A
- Opens link, sees the context Party A provided
- Fills out their own fears/interests form (private, not shown to Party A)
- Submits their response

### 3. **AI Analysis & Results**
- Once both parties submit, AI processes both perspectives
- Generates:
  - **Empathic Summary**: Respectful language that acknowledges both parties' concerns without directly quoting their private submissions
  - **Key Legal Concepts**: Suggested clauses/protections (e.g., "non-compete", "termination rights", "confidentiality")
  - **Bridge Suggestions**: Ways each party can address the other's concerns while protecting their own interests

### 4. **Viewing Results**
- Both parties can view the empathic analysis
- Results page clearly states: "This summary represents both perspectives in neutral language. Your specific words remain private."

---

## Key Features

### Authentication & Access
- **Guest Access**: Can start/join sessions, fill forms, auto-saved locally
- **Sign Up Options**: 
  - Google OAuth (one-click)
  - SMS OTP (phone number verification)
- **Why Sign Up?**: Access full session history, saved forms across devices
- **Required for**: Viewing results (both parties must verify identity before seeing analysis)

### Auto-Save System
- **Local Auto-Save**: Every keystroke saved to localStorage
- **Recovery**: If user navigates away and returns, form data is recovered
- **Upload Pre-filled Form**: Users can upload a JSON file to populate the form (useful for multiple similar agreements)
- **Download Form**: Save current form state as file for later use
- **Cloud Sync**: Once signed in, auto-save to database

### Voice Input
- **Speech-to-Text**: Microphone button on each text field
- Users can speak their responses instead of typing
- Transcription appears in real-time in the text box
- Works for both context and fears/interests forms

### Short Links
- Format: `empathy.app/s/ABC123` (6-character code)
- Each session gets a unique code
- Links work for both parties to access the same session

---

## Technical Setup

### Backend: External Supabase
You'll need to:
1. Connect your Supabase project (we'll guide you through this)
2. Set up authentication providers (Google OAuth, Phone OTP)
3. Enable Lovable Cloud for AI features

### Database Structure
**Tables:**
- `sessions`: Agreement sessions (context, short code, status)
- `party_responses`: Each party's private fears/interests (encrypted or RLS-protected)
- `ai_analyses`: Generated empathic summaries and legal suggestions
- `profiles`: User accounts (optional, for history)

**Security:**
- Row Level Security ensures Party A can't see Party B's raw input
- Only the AI analysis is visible to both
- Session creator can see participation status but not content

### AI Integration
- **Lovable AI** (google/gemini-3-flash-preview) for:
  - Understanding both parties' concerns
  - Generating empathic, neutral language
  - Suggesting relevant legal concepts
  - Identifying potential compromise areas

---

## User Interface

### Home Page
- Clean, trustworthy design
- "Start New Agreement" button (primary action)
- "Join with Link" button
- Brief explanation of how it works
- Trust signals: "Your words stay private. Only empathic summaries are shared."

### Context Form
- Single large text area
- Prompt: "Describe this agreement. What are you trying to accomplish together?"
- Auto-save indicator
- Voice input button
- Save/Load file options

### Fears & Interests Form
- **Section 1: Your Concerns**
  - "What are you worried might go wrong?"
  - "What do you want to protect yourself from?"
- **Section 2: Your Priorities**
  - "What matters most to you in this agreement?"
  - "What outcomes are you hoping for?"
- Each section: large text areas with voice input
- Clear messaging: "These answers are private and will not be shared directly with the other party"

### Waiting Screen (Between Submissions)
- Shows that you've submitted
- "Waiting for [other party] to complete their part"
- Option to edit your responses before other party submits
- Shows session link for sharing

### Results Page
- **Empathic Summary Section**
  - Written in respectful, neutral tone
  - Acknowledges both perspectives
  - No direct quotes from either party
- **Relevant Legal Concepts**
  - List of suggested clauses with brief explanations
  - E.g., "Consider a non-compete clause to address concerns about competitive activity"
- **Bridge Building Suggestions**
  - Specific ideas for how both parties can meet each other's needs
- **Next Steps**
  - Download summary as PDF
  - Start new agreement
  - Access session history (if signed in)

---

## Privacy & Trust

### Transparency
- Clear messaging throughout that individual submissions stay private
- Results page shows "empathic translation" not raw text
- Users control when they want to sign up (can use as guest initially)

### Data Handling
- Auto-save stored locally first (browser localStorage)
- Cloud sync only after sign-in
- Sessions expire after 30 days of inactivity
- Users can delete their data anytime

---

## Phase 1 Deliverables (This MVP)

✅ Authentication (Google + SMS OTP)  
✅ Session creation with short links  
✅ Two-party form submission flow  
✅ Auto-save (local + cloud)  
✅ Speech-to-text input  
✅ AI empathic analysis using Lovable AI  
✅ Results viewing (empathic summary + legal concepts)  
✅ Basic session history for signed-in users  

**Not in this phase:**
- Contract upload/analysis (Phase 2)
- Advanced legal concept explanations
- Real-time collaboration
- Payment/subscription features

---

## Next Steps to Start Building

1. I'll help you connect your Supabase project
2. Set up authentication providers in Supabase
3. Enable Lovable Cloud for AI features
4. Design the database schema with RLS policies
5. Build the core user interface
6. Implement the AI analysis flow
7. Add auto-save and voice features

Ready to proceed?

