# TradeSource — Product Requirements Document (PRD)
Version: 8.0 — January 2026
Launch Geography: Montgomery County · Bucks County · Philadelphia · Delaware County

MVP Trade: Painting (Interior & Exterior) + General Contractors / Remodelers (posting painting subs)

B2C at Launch (Secondary Channel): Homeowners can post projects for free to supplement job volume

Login: Email + Password

Founding Members Offer: First ~300 verified contractors get 6 months free, then standard pricing forever

---

## Executive Summary

TradeSource is a trade-to-trade professional job exchange and networking platform for construction trades, launching with Painting and GC/Remodeler posting. A secondary free homeowner posting channel (B2C) supplements the job pool.

Core platform principles:
- no bidding
- job-scoped messaging only
- vetting + reviews trust engine

## Goals
- Ship a reliable, professional MVP in ~90 days
- Enable real overflow work exchange between vetted pros
- Build durable trust via verified identity, job history, and reviews
- Reduce spam and abuse via job-scoped messaging and access control
- Supplement job volume via free homeowner B2C postings (secondary channel)

## Non-Goals (Explicitly Not in MVP)
- Escrow or payments between users
- MEP trades (Electrical/Plumbing/HVAC)
- National rollout
- Advanced reputation algorithms
- AI matching / recommendation engines

---

## Section 1 — Platform Purpose & Operating Philosophy

### 1.1 What TradeSource Is
TradeSource is primarily a trade-to-trade professional networking and job exchange platform for construction trades. A secondary B2C channel allows homeowners to post projects for free to supplement the job pool.

TradeSource solves three problems:
1. Contractors with too much work (overflow)
2. Subs who need more work (slow months)
3. Young entrepreneurs who can sell but need execution partners

### 1.2 Who It Serves

**Phase 1 — MVP Launch (Painting + GCs + Homeowners)**
- Painting (Interior & Exterior)
- General Contractors / Remodelers (fully included; post overflow + can apply when slow)
- Homeowners (free; post B2C projects only; no B2B features)

**Launch Geography:**
- Montgomery County, PA
- Bucks County, PA
- Philadelphia
- Delaware County

---

## Section 2 — Users, Access Control & Vetting Logic

### 2.1 User Types
- **Contractor/Sub User (Paid):** access controlled by subscription, vetting, and account status
- **Homeowner User (Free):** B2C posting + view interested verified pros + contact; no B2B or community

### 2.2 Access States
- Public (not logged in)
- Homeowner (logged in, free, B2C-only)
- Unvetted Contractor Member (paid, not verified)
- Fully Verified Contractor Member (paid, verified)

### 2.3 Permissions by Access State

**Public:**
- Can: view marketing site, request access (contractors), homeowner signup
- Cannot: view feed/details/profiles

**Homeowner:**
- Can: post B2C projects, view interested verified pros, view profiles/reviews/photos, contact pros
- Cannot: view B2B, community, message outside their project context

**Unvetted Contractor Member:**
- Can: browse B2B + B2C feed, view details and profiles
- Cannot: post jobs, apply to B2B, message, community

**Fully Verified Contractor Member:**
- Can: post jobs, express interest, award, message (job-scoped), community, reviews

---

## Section 3 — Job System (Posting, Feed, Interest, Lifecycle)

### 3.1 Job Types
- Full Job (B2B)
- Piece Work (B2B)
- B2C Homeowner Project (secondary channel)

### 3.2 Posting Permissions
- Contractors: subscription ACTIVE + VERIFIED + account ACTIVE
- Homeowners: free posting allowed (B2C only)

### 3.4 Posting UX

**Contractor Quick Post (<45 seconds):**
- Full or Piece
- Photo(s)
- Price (fixed/hourly)
- Post
- Edit details later

**Homeowner B2C Posting (Simplified):**
- Title + description + optional photos
- Location + timeline
- Post free
- No price field; pros express interest

### 3.6 Feed & Filters
- Newest first
- Filters: radius, county, job type, category, budget, timeline, media-only, rating minimum, availability
- MVP trade fixed to Painting
- Tag B2C jobs ("Homeowner Project")

### 3.7 Interest System (No Bidding)
- Button: Interested
- Optional note
- No pricing input from interested party
- No negotiation fields in platform

---

## Section 4 — Messaging System & Communication Rules

### 4.1 Core Rule
No general DMs. All messages are tied to a job_id.

### 4.2 Unlock Conditions
- B2B: chat opens only after AWARDED
- B2C: chat opens only after homeowner initiates contact

---

## Section 5 — Reviews, Reputation & Job History (Trust Engine)

### 5.1 Trust Rules
- Reviews only from completed jobs
- Permanent job history (no deletion)
- Internal reviews + external review links displayed prominently

### 5.2 Two-Way Reviews
- B2B: contractor ↔ pro
- B2C: homeowner ↔ pro

---

## Section 7 — Community / Forum System

### 7.1 Purpose
Verified-only professional forum focused on business, estimating, tools, hiring, mentorship.

### 7.2 Access Rules
Requires subscription ACTIVE + vetting VERIFIED.

### 7.3 Categories
- Business & Marketing
- Estimating & Pricing
- Tools & Equipment
- Hiring & Subcontracting
- General Trade
- Starting Your Business

---

## Section 8 — Subscription System, Pricing & Monetization

### 8.1 Plans (Launch)
- Basic: $19.99
- Pro: $29.99
- Premium: $39.99
- Homeowners free

### 8.3 Tier Feature Summary
- Basic: 4 active posts; 12 Interested/month; 3 saved searches; community access
- Pro: 12 active posts; unlimited Interested; 10 saved searches; higher applicant visibility; priority support
- Premium: unlimited; featured profile 30 days/year; early access

---

## Section 11 — MVP Scope, Build Phases & Expansion

### 11.1 MVP Must Include
- Accounts, request/invite, homeowner signup, subscriptions, vetting, jobs (B2B+B2C), feed/filters, interest/no-bidding, award/status flow, messaging, reviews/history, profiles/availability, community, weekly digest, admin seed tool, referrals.

### 11.2 Build Phases
- **Month 1:** auth/types, request/invite, Stripe, vetting, admin seed tool, basic profiles
- **Month 2:** job system, feed/filters, interest/award, lifecycle, chat, notifications
- **Month 3:** reviews/history, community, weekly digest, polish, closed beta
