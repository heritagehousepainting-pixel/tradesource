# TradeSource — PRD for Painting MVP (v2.0)
Product Requirements Document
Version: 2.0 — January 2026 Launch
Geography: Montgomery County, PA · Bucks County, PA · Philadelphia · Delaware County, PA

Login: Email + Password

MVP Scope: Painting (Interior & Exterior) + General Contractors / Remodelers (posting for painting subs)

B2C at Launch (Secondary Channel): Homeowners can post projects for free to supplement job volume

Founding Members Offer: First ~300 verified contractor users get 6 months free, then standard pricing forever

---

## Overview

This document is a scoped-down version of the full functional PRD (v7.0), focused exclusively on the Painting MVP with B2C homeowner integration. It prioritizes core functionality for a 90-day build, emphasizing reliability, professionalism, and launch readiness.

## Goals

- Launch a professional, reliable painting-only platform in ~90 days
- Enable overflow job exchange between contractors and verified painting subs
- Prevent spam and bidding behavior through gated access + job-scoped communication
- Create durable trust through vetting + reviews + permanent job history
- Increase job volume using free homeowner project posts as a secondary channel

## Non-Goals (Not in MVP)

- Payments/escrow between users
- Additional trades beyond painting
- National expansion
- Advanced reputation algorithms
- AI matching/recommendations

---

## Section 1 — Platform Purpose & Operating Philosophy

### 1.1 Product Purpose

TradeSource is primarily a trade-to-trade professional job exchange for construction trades, launching with painting, and including a secondary free homeowner posting channel to supplement job volume.

It solves three core problems in the painting trade:

1. Contractors with too much work (overflow jobs)
2. Subcontractors who need more work
3. Ambitious young tradespeople (mid-20s to early-30s) who can sell work but need reliable execution partners without building full crews immediately

Contractors and subs can switch roles depending on workload and season. Homeowners can post projects (e.g., "Full exterior repaint in Horsham, PA within 2 months" with optional photos). Verified pros can express interest; homeowners can review profiles, ratings, and portfolios before contacting.

### 1.2 What TradeSource Is Not

- Primarily a homeowner marketplace (B2C is secondary and free)
- A consumer lead-gen platform
- A bidding website
- A gig-economy platform (TaskRabbit-style)
- A social media app

TradeSource is a private professional tool for tradespeople, enhanced by consumer-generated job opportunities.

### 1.3 Core Behavioral Rules (Non-Negotiable)

- Homeowners have separate free access (B2C only)
- Homeowners can sign up free and post/view B2C projects only
- No access to B2B overflow jobs, professional community, or contractor networking features
- No job browsing without an account
- Job feed, job details, and profiles require login
- Contractors require approval/invite
- Homeowners have direct free signup
- Contractors pay to access
- Contractors pay monthly (including unvetted users)
- No ongoing free contractor tier beyond the marketing website
- Homeowners remain free

---

## Section 2 — Users, Access Control & Vetting Logic

### 2.1 User Types

**Contractor/Sub User (Paid)**
A single contractor account can behave as:
- GC/Remodeler posting overflow painting work
- Painting subcontractor looking for work
- Both (depending on month/season)
- Young entrepreneur posting execution partner needs

Contractor functionality is controlled by:
- subscription status
- vetting status
- account status

**Homeowner User (Free)**
Homeowners are non-paying users who can:
- post B2C projects
- view interested verified pros (profiles/reviews/photos)
- contact a chosen pro directly

Homeowners cannot:
- access B2B features
- use community
- use contractor networking
- message outside their own posted projects

### 2.2 Access Levels & Permissions

**Public (Not Logged In)**
- Can: view marketing homepage, submit "Request Access" (contractors), complete homeowner signup
- Cannot: view job feed or details, view profiles

**Unvetted Contractor Member (Paid, Not Verified)**
- Requirements: approved request + account created + plan selected and paid
- Can: log in, browse job feed and job details (B2B + B2C), view profiles and reviews
- Cannot: post jobs, apply to B2B jobs, message, access community

**Fully Verified Contractor Member**
- Requirements: vetting completed + admin approval
- Can: post B2B jobs, express interest in B2B jobs, express interest in B2C projects, award jobs (B2B), message (job-scoped), participate in community, give/receive reviews

**Homeowner (Free)**
- Can: sign up free and log in, post B2C projects, view interested verified pros, contact pros directly
- Cannot: view B2B jobs, use community, use contractor networking

### 2.5 Subscription Logic (Contractors Only)

Contractors pay monthly. Homeowners are free.

Founding Members: first ~300 verified contractor users get 6 months free, then normal pricing

Pricing (Year 1):
- Basic: $19.99/month
- Pro: $29.99/month
- Premium: $39.99/month

### 2.6 Vetting Requirements (Contractors Only)

Required for painters and GCs/remodelers:
- Proof of insurance (COI)
- W-9
- Business legal name
- External review links (Google, Yelp, etc.)

Homeowners: no vetting required.

---

## Section 3 — Job System (Posting, Piece Work, Feed, Lifecycle)

### 3.1 Job Types

- Full Job (B2B): complete painting scope (e.g., entire interior repaint)
- Piece Work (B2B): partial scope (e.g., "2 bedrooms only")
- Homeowner Project (B2C): homeowner-posted residential painting request (supplemental channel)

### 3.2 Job Posting Permissions

Contractors can post only if:
- account_status = ACTIVE
- subscription = ACTIVE
- vetting_status = VERIFIED

Unvetted contractors can browse only. Homeowners can post B2C projects free, no vetting required.

### 3.4 Job Posting UI Flows

**Contractor Quick Post (<45 seconds, mobile)**
- Select Full or Piece
- Snap photo(s)
- Set price (Fixed or Hourly)
- Post
- Edit details later

**Contractor Full Posting Flow**
- Job Type: Full or Piece
- If Piece: "Which section?" (ex: "Basement only")
- Basics: title, property type (Residential/Commercial/Mixed), category (Interior/Exterior)
- Location: address and service area tag
- Scope: room count/sq ft (optional), description, materials responsibility (Contractor/Sub), tools/experience notes
- Payment: fixed or hourly, amount, confirm "price is fixed; no negotiation in platform"
- Media: photos + optional video
- Vetting requirement: verified pros only (default)

**Homeowner B2C Posting (Simplified)**
- One-tap "Post Project"
- Title (ex: "Full exterior repaint")
- Description + optional photos
- Location + timeline
- Post free
- No price setting (pros express interest)

### 3.6 Job Feed & Filters

Sorting: newest first

Filters (MVP):
- radius / county
- job type (Full / Piece / B2C)
- work category (Interior / Exterior)
- budget range (B2B only)
- timeline
- jobs with media
- contractor rating minimum
- "Available Now" pros

### 3.8 Interest System (No Bidding)

- Pro clicks "Interested"
- Optional short message allowed
- No pricing submission
- No negotiation fields
- B2C: Homeowners see an interested list, view profiles, then contact directly.

---

## Section 4 — Messaging System & Communication Rules

### 4.1 Rule: Job-Scoped Messaging Only
No general DMs. All messages belong to a specific job context.

### 4.2 When Messaging Unlocks
- B2B: only after job is AWARDED
- B2C: only after homeowner initiates contact

---

## Section 5 — Reviews, Reputation & Job History

### 5.1 Rules
- Reviews only from completed jobs
- Two-way reviews (B2B and B2C)
- Ratings + external links displayed prominently
- Permanent job history (no deletions)

---

## Section 6 — Profile System, Identity & "Rolodex"

### 6.1 Profile Sections (Contractors)
- Overview
- Job history
- Reviews
- Portfolio
- Credentials / Vetting
- Network ("Rolodex")

### 6.2 Header Requirements
- logo + company name
- trade (Painting / GC)
- service areas
- vetting badge
- rating + review count
- "Available Now" badge (contractors only)

---

## Section 7 — Community / Forum System (Contractors Only)

Verified-only forum (no homeowners). Categories:
- Business & Marketing
- Estimating & Pricing
- Tools & Equipment
- Hiring & Subcontracting
- General Trade Discussion
- Starting Your Business

Supports posts, comments, media, moderation, reporting.

---

## Section 11 — MVP Scope & Build Phases

### 11.2 Non-Negotiable MVP Features
- contractor accounts + homeowner accounts
- contractor request/invite workflow
- homeowner free signup
- subscriptions + payments (contractors)
- vetting workflow (contractors)
- job posting (Full/Piece + Quick Post; homeowner simplified)
- feed + filters + B2C tagging
- interest system (no bidding)
- awarding + lifecycle + expiry
- job-scoped messaging
- reviews + job history
- profiles + availability badge
- verified-only community
- weekly digest
- admin seed tool
- referral tracking

### 11.3 Build Phases
- **Month 1:** Foundation (auth, access flow, Stripe, vetting, admin seed tool, profiles)
- **Month 2:** Job system (posting, feed, filters, interest, award, lifecycle, B2C)
- **Month 3:** Trust/community (reviews, history, community, digest, polish, beta)
