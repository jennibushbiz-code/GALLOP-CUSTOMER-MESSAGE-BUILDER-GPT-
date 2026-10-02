# GALLOP Customer & Message Builder

A Vercel-ready Next.js app powered by the OpenAI Responses API with hosted web search.

## What the member sees

They enter:
1. what they sell
2. where/how customers can buy or use it
3. optional extra business context

They click **Build My Customer & Message Profile** and receive a researched, formatted profile plus sources.

## What happens behind the scenes

The server:
- keeps your OpenAI API key private
- sends the member's business facts plus the GALLOP methodology to OpenAI
- requires web research
- limits total built-in tool calls to control cost/latency
- renders the answer as rich text
- supports rich-text clipboard copying where the browser allows it

## OpenAI setup

Create an OpenAI API key in your OpenAI API account.

Important: ChatGPT subscription billing and OpenAI API billing are separate.

## Local setup (optional)

Install Node.js, then in this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Put your real API key in `.env.local`:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-terra
```

Then visit:

http://localhost:3000

## Put it on GitHub

1. Create a new PRIVATE GitHub repository.
2. Upload all files in this folder.
3. Do not upload `.env.local` or any API key.

## Deploy with Vercel

1. Sign in to Vercel.
2. Click **Add New → Project**.
3. Import the GitHub repository.
4. Add Environment Variables:
   - `OPENAI_API_KEY` = your real API key
   - `OPENAI_MODEL` = `gpt-5.6-terra`
5. Deploy.

Vercel gives you a URL such as:

`https://gallop-customer-builder.vercel.app`

## Embed in GoHighLevel

Use a Custom HTML/embed block:

```html
<iframe
  src="https://YOUR-VERCEL-URL.vercel.app"
  width="100%"
  height="1400"
  style="border:0;border-radius:12px;"
  loading="lazy"
  allow="clipboard-write"
></iframe>
```

You can adjust the height later.

## Cost/latency controls already included

The API route currently uses:
- GPT-5.6 Terra by default
- web search with low search context
- maximum 4 built-in tool calls
- maximum 7,000 output/reasoning tokens

For cheaper testing, set:

`OPENAI_MODEL=gpt-5.6-luna`

For stronger strategy, keep:

`OPENAI_MODEL=gpt-5.6-terra`

## Important before opening to lots of members

This starter version does not yet enforce a hard per-member request allowance.

Before broad release, add at least one access/cost control, such as:
- a signed member token from GoHighLevel
- Vercel Firewall/rate limiting
- Upstash Redis rate limiting
- a per-member daily/monthly request allowance

Do not put your OpenAI API key in browser code.

## Main files

- `lib/prompt.ts` — GALLOP Customer & Message methodology
- `app/page.tsx` — form/results interface
- `app/globals.css` — branding and design
- `app/api/profile/route.ts` — OpenAI request, web search and cost limits

## Recommended first tests

Test the deployed tool with minimal facts:
- "I sell riding tights online in the UK."
- "Equine physio covering Colchester + 25 miles."
- "Equine nutrition consultant in Suffolk."
- "Equestrian photographer in Suffolk."

Check particularly that the tool:
- does not invent business-specific facts
- distinguishes research from hypotheses
- checks marketing constraints where relevant
- provides identifiable sources
- does not promote recurring revenue as if it proves demand
- keeps UNKNOWN facts unknown
