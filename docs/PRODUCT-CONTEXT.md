# Product Context — Empathic Legal Bridge

## Core Philosophy

A legal tech app that helps bridge emotional gaps elegantly and with empathy, instead of "fighting" on legal rewrites.

### The Assumption

Some people sign agreements with people they 100% don't trust and hope the contract will save them. **This app is not for them.**

The majority of people already scan the other person before the contract moment arrives, and they already have a sense of trust. But they don't fully trust their instincts and also want to make sure their interests will remain safe for the long run when circumstances change. They want the contract to protect them — but each person cares about different things.

### The Insight

It is like exposing the closed-door discussion between the other side and their lawyer: the lawyer asks "what do you want the contract to protect you from?" and there is a list of things. The lawyer also knows the different scenarios they need to protect their client from, and brings these into the contract.

The point: **a contract represents the fears of the other party.** If those fears are exposed and made transparent, perhaps the counterparty can be empathetic to them — more flexible, even able to offer a way to protect the other side's interests while also protecting their own, finding a better solution for both.

---

## Core Use Cases

1. **Mutual emotional disclosure** — Two sides share their interests and fears privately, and the app drafts those feelings in a mutual, clear, and respectful way that helps each side feel heard and seen by the other. Then suggests relevant legal phrases (e.g. non-compete, IP assignment, kill fee).

2. **Decode a received contract** — A user uploads a draft contract from the other side and learns about the other side's interests and fears from what's in that draft.

3. **Audit your own contract** — A user uploads their own draft contract to make sure their own interests and fears are actually represented in it.

4. **Two-draft reconciliation** — Both sides upload their own versions of a draft and get suggestions for how to merge/edit them to address both sets of needs.

---

## Phase 1 (Build Now): Mutual Emotional Disclosure

A simple app where two parties share their fears and interests discretely. The app then:
- Represents those feelings in a mutual, clear, empathic voice that helps the other side understand without feeling attacked
- Suggests relevant legal phrases and clauses

### Flow
1. Party A gives full context about the agreement
2. Party A privately shares their fears and interests
3. Party A gets a shareable link (short) to send to Party B
4. Party B privately shares their own fears and interests (seeing only the agreement context, not Party A's words)
5. Both parties see the empathic mutual summary + legal clause suggestions

---

## Phase 2 (Next): Contract Upload & Decode

A user uploads a contract (file or pasted text) and the app:
- Exposes the feelings and fears of the counterparty implied by the contract clauses
- Asks for context first
- Provides pre-made questions about the other party's likely intentions
- Allows open questions about the contract

---

## Key Product Requirements

### Auth
- Sign up / sign in required (to save session history)
- Google Sign-In
- OTC via SMS (one-time code)

### Form Experience
- Save form state from the **first character the user types** — auto-persist to history even if the user never explicitly saves
- Allow users to **download their answers as a file** (so they can reload later)
- Allow users to **upload a previously saved file** to pre-fill the form — for cases where:
  - User started filling out and stopped
  - Something went wrong after completing
  - One person is signing contracts with multiple parties and doesn't want to retype everything each time
- Allow users to **speak to text** (voice input) to fill out the form

### Privacy
- Users must know their raw words are **never shared** with the other party
- The empathic summary should imply and reflect both perspectives, but never expose exact wording
- This should be clearly communicated at the point of filling out the form

### Sharing
- Share links must be **short** (short code, not encoded long URLs)

---

## Tone & Voice

- Warm, human, non-judgmental
- Never legal jargon in UI copy
- Empathy-first — this is a product for people who already trust each other somewhat and want that trust formalized safely
- "Find common ground" not "protect yourself"
