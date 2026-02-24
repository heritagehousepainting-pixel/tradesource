# TradeSource MVP - Product Requirements Document (PRD)
**Version:** 1.0
**Date:** February 2026
**Status:** For Internal Development (Dexter)
**Focus:** In-house build, Montgomery County PA launch

---

## Executive Summary

**TradeSource** is a subscription-based, vetted professional networking and job-exchange platform for the construction trades.

**MVP Definition:** A functional marketplace connecting homeowners posting painting projects with verified contractors — plus GC sub-contracting capabilities.

**Launch Target:** Montgomery County, Bucks County, Delaware County, PA

---

## 1. Core Value Proposition

| User Type | Value |
|---|---|
| **Homeowner** | Find vetted, verified contractors for painting projects — free to post |
| **Contractor** | Steady flow of leads/jobs, subscription access, build reputation |
| **GC** | Access to verified specialty subs for painting projects |

**Not in MVP:**
- Escrow/payments (Phase 2)
- Finance options (Phase 3)
- Full contractor categories (start with painters only)

---

## 2. User Roles

### 2.1 Homeowner
- Post painting projects (interior/exterior)
- Browse contractor profiles
- Request quotes / hire contractors
- Leave reviews

### 2.2 Contractor
- Create profile with verification
- Browse job feed
- Express interest in jobs (NOT bidding)
- Get hired → Complete job
- Receive reviews/ratings

### 2.3 General Contractor (GC)
- Post sub-contracting needs (painting)
- Review contractor interest
- Hire subcontractors
- Leave reviews

---

## 3. MVP Features (Must-Have)

### 3.1 Authentication & Profiles
| Feature | Description |
|---|---|
| Email sign-up/login | Basic auth |
| OAuth | Google, Apple (optional v1) |
| Role selection | Homeowner, Contractor, GC |
| Profile creation | Name, photo, bio, service area, specialties |
| Contractor verification | License upload, insurance upload, ID check |

### 3.2 Job Posting (Homeowner)
| Field | Type | Required |
|---|---|---|
| Title | Text | Yes |
| Description | Textarea | Yes |
| Type | Dropdown (Interior/Exterior/Both) | Yes |
| Property Type | Dropdown (Residential/Commercial) | Yes |
| Address | Text | Yes |
| City | Dropdown | Yes |
| ZIP | Text | Yes |
| Square footage | Number | Optional |
| Timeline | Dropdown (ASAP/This month/This week) | Yes |
| Budget range | Dropdown | Optional |
| Photos | Image upload (max 5) | Optional |

### 3.3 Job Posting (GC)
| Field | Type | Required |
|---|---|---|
| Project title | Text | Yes |
| Description | Textarea | Yes |
| Scope | Text (sub-trade work needed) | Yes |
| Timeline | Dropdown | Yes |
| Location | Address | Yes |
| Budget | Text | Optional |

### 3.4 Job Feed
- List of all open jobs (filtered by location/service)
- Filter by: Job type, Budget, Timeline, Distance
- Sort by: Newest, Relevance
- Pull-to-refresh (mobile)

### 3.5 Contractor Discovery (Homeowner)
- Browse contractors in area
- Filter by: Specialty, Rating, Verified status
- View profiles with reviews, portfolio photos, stats

### 3.6 Interest System (NOT Bidding)

**How it works:**
1. Contractor sees job → clicks "I'm Interested"
2. Homeowner sees list of interested contractors
3. Homeowner reviews profiles/reviews
4. Homeowner selects contractor → Chat opens
5. They negotiate/agree outside app

**No prices displayed publicly** — this is NOT a bidding platform.

### 3.7 Messaging
- In-app chat between homeowner and contractor
- Job-scoped (messages tied to specific job)
- Text + photo sharing
- Notification on new message

### 3.8 Reviews & Ratings
- 5-star rating system
- Written review (required if 1-3 stars)
- Reviewable after job marked "complete"
- Aggregate rating on profile

### 3.9 Verification Badges
| Badge | Criteria |
|---|---|
| Verified | License + ID uploaded |
| Insured | Insurance certificate uploaded |
| Background Check | Clear background check |

---

## 4. Technical Architecture

### 4.1 Tech Stack (Recommended)
| Layer | Technology |
|---|---|
| Frontend | React Native (mobile) + React (web) |
| Backend | Node.js + Express OR Python/FastAPI |
| Database | PostgreSQL (primary) + Redis (cache) |
| Auth | Clerk, Auth0, or custom JWT |
| Storage | AWS S3 (images) |
| Hosting | Vercel (frontend) + Railway/Render (backend) |
| SMS | Twilio |
| Email | Resend or SendGrid |

### 4.2 Data Models

```
Users
├── id (UUID)
├── email
├── password_hash
├── role (homeowner | contractor | gc)
├── first_name
├── last_name
├── phone
├── avatar_url
├── created_at
└── updated_at

ContractorProfiles
├── user_id (FK)
├── business_name
├── bio
├── service_areas (JSON array)
├── specialties (JSON array: interior, exterior, commercial)
├── license_number
├── license_state
├── license_verified (boolean)
├── insurance_verified (boolean)
├── background_check (boolean)
├── years_experience
├── portfolio_photos (array)
├── created_at
└── updated_at

Jobs
├── id (UUID)
├── poster_id (FK → User)
├── poster_type (homeowner | gc)
├── title
├── description
├── job_type (interior | exterior | both)
├── property_type (residential | commercial)
├── address
├── city
├── state
├── zip
├── square_footage
├── timeline
├── budget_min
├── budget_max
├── status (open | in_progress | completed | cancelled)
├── hired_contractor_id (FK → User)
├── created_at
└── updated_at

JobPhotos
├── job_id (FK)
├── photo_url
└── created_at

JobInterest
├── id (UUID)
├── job_id (FK)
├── contractor_id (FK → User)
├── message (optional)
├── status (interested | hired | passed)
├── created_at
└── updated_at

Reviews
├── id (UUID)
├── job_id (FK)
├── reviewer_id (FK → User)
├── reviewee_id (FK → User)
├── rating (1-5)
├── comment
├── created_at
└── updated_at

Messages
├── id (UUID)
├── job_id (FK)
├── sender_id (FK → User)
├── receiver_id (FK → User)
├── content
├── read (boolean)
├── created_at
└── updated_at
```

### 4.3 API Endpoints

```
Auth
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me

Users
GET /users/:id
PUT /users/:id
GET /users/contractors (with filters)
GET /users/contractors/:id

Jobs
POST /jobs
GET /jobs (with filters)
GET /jobs/:id
PUT /jobs/:id
DELETE /jobs/:id

JobInterest
POST /jobs/:id/interest
GET /jobs/:id/interest
PUT /interest/:id/status

Reviews
POST /reviews
GET /reviews/:user_id

Messages
GET /messages/:job_id
POST /messages
PUT /messages/:id/read
```

---

## 5. User Flows

### 5.1 Homeowner: Post Job → Hire Contractor
```
1. Sign up / Log in
2. Click "Post a Job"
3. Fill out job details
4. Submit → Job goes live in feed
5. Contractors see job → Express interest
6. Homeowner sees list of interested contractors
7. Homeowner clicks contractor → Views profile + reviews
8. Homeowner clicks "Start Chat"
9. Chat opens → Negotiate details
10. Agree → Mark job "In Progress"
11. Job complete → Leave review
```

### 5.2 Contractor: Find Jobs → Get Hired
```
1. Sign up / Log in
2. Complete profile + upload verification docs
3. Admin verifies (manual in MVP) → Badge awarded
4. Browse job feed
5. Filter by: location, type, budget
6. See job → Click "I'm Interested"
7. Add optional message to homeowner
8. Homeowner sees your interest + profile
9. If selected → Chat opens
10. Agree on details → Job starts
11. Complete job → Request review
```

### 5.3 GC: Post Sub-Work → Hire Sub
```
1. Sign up / Log in as GC
2. Complete GC profile
3. Post sub-contracting job (painting scope)
4. Contractors in area express interest
5. Review contractors → Select
6. Chat → Agree → Execute
```

---

## 6. MVP UI/UX Requirements

### 6.1 Mobile App (Primary)
| Screen | Description |
|---|---|
| Splash | Logo, loading |
| Onboarding | 3 slides: What is TradeSource? |
| Auth | Login / Register |
| Home (Homeowner) | Job feed + Post button (FAB) |
| Home (Contractor) | Job feed + My Profile |
| Job Detail | Full job info + Interest button |
| Post Job | Multi-step form |
| Contractor Profile | Stats, reviews, portfolio |
| Chat | Messaging interface |
| My Jobs | List of user's jobs |
| Profile | Edit profile, settings, logout |

### 6.2 Web (Secondary)
- Same flows as mobile
- Responsive design
- Admin dashboard for verification queue

---

## 7. MVP Non-Functional Requirements

### 7.1 Performance
- Page load: < 2 seconds
- API response: < 500ms
- Image upload: < 5 seconds

### 7.2 Security
- Password hashing (bcrypt)
- JWT tokens
- HTTPS only
- Input sanitization
- Rate limiting

### 7.3 Scalability
- Design for 1,000 users to start
- Database can scale to 100K+

---

## 8. MVP Launch Metrics (KPIs)

| Metric | Target (Month 1) |
|---|---|
| Verified contractors | 50 |
| Jobs posted | 100 |
| Jobs filled | 30 |
| Homeowner signups | 50 |
| Fill rate | 30% |
| Avg time to fill job | 7 days |

---

## 9. Future Features (Post-MVP)

| Feature | Phase |
|---|---|
| Escrow payments | Phase 2 |
| Payment plans (finance) | Phase 2 |
| More trade categories (electrical, plumbing) | Phase 2 |
| Subscription tiers (free, Pro, Enterprise) | Phase 2 |
| In-app estimates/quotes | Phase 2 |
| Job scheduling tools | Phase 3 |
| Insurance verification API | Phase 3 |
| GC hiring dashboards | Phase 3 |

---

## 10. Development Priorities

### Priority 1 (MVP Core)
1. Auth + Profile creation
2. Job posting (homeowner)
3. Job feed (contractor)
4. Interest system
5. Chat
6. Reviews

### Priority 2 (MVP Polish)
1. Verification workflow
2. Filters + search
3. Notifications
4. Admin dashboard

### Priority 3 (Launch Ready)
1. Onboarding flows
2. Error states
3. Loading states
4. Testing + bug fixes

---

## 11. Dependencies

| Item | Purpose | Cost |
|---|---|---|
| PostgreSQL | Database | $0-20/mo (Neon/Supabase) |
| S3 / Cloudinary | Image storage | $0-10/mo |
| Twilio | SMS | ~$10/mo |
| Email (Resend) | Transactional email | Free up to 3K/mo |
| Vercel | Hosting | Free tier |
| Clerk/Auth0 | Auth | Free tier available |

**MVP Cost:** ~$50/month to start

---

## 12. Questions for Dexter

1. Preferred tech stack confirmation?
2. Timeline estimate for MVP?
3. Need clarification on any features?
4. Should we start with mobile-first or web-first?

---

*PRD prepared by Alfred for Dexter*
*Ready for development*
