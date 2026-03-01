# TradeSource - Phase 4-10 Development Prompts

**Goal:** Complete all phases through Phase 10 for full MVP.

---

## PHASE 4: MESSAGING (Already Mostly Done)

### Prompt 4.1: Job-Scoped Messaging
```
Already implemented:
- Messages tied to job_id
- Chat appears in Messages page
- Real-time updates via load

Testing needed:
- Confirm messages load correctly
- Confirm send works
```

### Prompt 4.2: Message Notifications
```
Check and fix:
- Notifications table exists
- When message sent, notification created
- User sees notification count in header
- Clicking notification opens chat
```

---

## PHASE 5: REVIEWS & REPUTATION

### Prompt 5.1: Review Table Setup
```
Create reviews table:
- id (UUID, primary key)
- job_id (UUID, FK to jobs)
- reviewer_id (UUID, FK to users)
- reviewee_id (UUID, FK to users)
- rating (1-5 integer)
- comment (text)
- created_at (timestamptz)

Add RLS policies for reviews.
```

### Prompt 5.2: Leave Review Button
```
On job detail page (when job status is COMPLETED):
- Add "Leave Review" button for both parties
- Show star rating (1-5 clickable)
- Comment text area (required for 1-3 stars)
- Submit saves to reviews table
- Update reviewee's avg_rating and review_count
```

### Prompt 5.3: Display Reviews on Profile
```
On public contractor profile (/contractor/:id):
- Show reviews section
- Display star rating average
- Show review count
- List individual reviews with comment, date, reviewer name
- Only show reviews from COMPLETED jobs
```

### Prompt 5.4: External Review Links
```
Already implemented:
- External review links field in profile
- Display on public profile

Verify: External links clickable and open in new tab
```

---

## PHASE 6: COMMUNITY/FORUM

### Prompt 6.1: Forum Database Setup
```
Create community_posts table:
- id (UUID)
- user_id (UUID, FK)
- category (text: business, estimating, tools, hiring, general)
- title (text)
- content (text)
- created_at (timestamptz)

Create community_replies table:
- id (UUID)
- post_id (UUID, FK)
- user_id (UUID, FK)
- content (text)
- created_at (timestamptz)

Add RLS: Only verified contractors can post/reply
```

### Prompt 6.2: Forum Page
```
Create /community page:
- Header: "TradeSource Community"
- Category tabs: Business, Estimating, Tools, Hiring, General
- List posts with title, author, date, reply count
- "New Post" button (only for verified contractors)
- Click post → view full content + replies
- Reply form (only verified contractors)
- Access denied message for unverified
```

### Prompt 6.3: Create Post Flow
```
"New Post" button opens modal:
- Category dropdown
- Title input
- Content textarea (markdown support optional)
- Submit creates post
- Redirects to post detail
```

---

## PHASE 7: SUBSCRIPTION SYSTEM

### Prompt 7.1: Subscription Tables
```
Add to users table:
- subscription_tier (BASIC, PRO, PREMIUM) - already exists
- subscription_status (ACTIVE, PAST_DUE, SUSPENDED, CANCELLED) - already exists
- subscription_start_date (date)
- subscription_end_date (date)

Create subscription_plans table (optional - can be hardcoded in UI)
```

### Prompt 7.2: Pricing Page
```
Create /pricing page:
- Basic: $19.99/mo - 4 active posts, 12 interested/month, community
- Pro: $29.99/mo - 12 active posts, unlimited interested, saved searches
- Premium: $39.99/mo - unlimited, featured profile
- "Current Plan" show for logged in users
- "Upgrade" buttons
```

### Prompt 7.3: Subscription Enforcement
```
In job posting:
- Check user's subscription_tier
- BASIC: max 4 active jobs (show error if exceeded)
- PRO: max 12 active jobs
- PREMIUM: unlimited

In interest expression:
- BASIC: max 12 interested/month (track in user record)
- PRO/PREMIUM: unlimited
```

### Prompt 7.4: Founding Members
```
Add flag for founding members:
- founding_member: boolean (true for first ~300)
- founding_member_since: date

Founding members: free until 6 months from signup
Display "Founding Member" badge on profile
```

---

## PHASE 8: ADMIN DASHBOARD (Mostly Done)

### Prompt 8.1: User Management
```
Add to admin page:
- View all users list
- Filter by: role, verification status, subscription
- Search by email/name
- View user details
- Deactivate user account
```

### Prompt 8.2: Job Moderation
```
Add to admin page:
- View all jobs
- Filter: by status, county, date
- Delete inappropriate jobs
- Archive spam jobs
```

### Prompt 8.3: Analytics Dashboard
```
Add to admin page:
- Total users (contractors vs homeowners)
- Total jobs posted
- Jobs completed
- Average time to fill job
- Verification queue count
- Signups over time chart (simple)
```

---

## PHASE 9: NOTIFICATIONS

### Prompt 9.1: Notification Types
```
Add notification types:
- new_interest: Contractor expressed interest on your job
- job_awarded: Your interest was accepted
- new_message: New message in your chat
- job_completed: Job marked complete (review prompt)
- verification_approved: You're verified!
- verification_rejected: Application rejected
```

### Prompt 9.2: In-App Notifications
```
Add notification bell in header:
- Show unread count
- Dropdown list of notifications
- Mark as read on click
- "Mark all as read" button
- Link to relevant page (job, messages, profile)
```

### Prompt 9.3: Email Notifications (Optional)
```
Setup Resend for transactional emails:
- New interest notification (to homeowner)
- Interest accepted (to contractor)
- New message notification

Note: Skip for MVP, can add in Phase 2
```

### Prompt 9.4: Weekly Digest (Optional)
```
Skip for MVP - add in Phase 2
```

---

## PHASE 10: POLISH & MOBILE

### Prompt 10.1: Loading States
```
Add loading spinners/skeletons to:
- Job feed (while loading jobs)
- Job detail (while loading)
- Profile page (while loading)
- Messages (while loading)
- Any data-fetching component
```

### Prompt 10.2: Error States
```
Add error handling UI:
- "Something went wrong" messages
- "No jobs found" empty states
- "No internet connection" detection
- Retry buttons
```

### Prompt 10.3: Empty States
```
Design empty states for:
- No jobs in feed
- No interests on your job
- No messages
- No reviews
- No posts in forum category
```

### Prompt 10.4: Mobile Responsive
```
Fix responsive issues:
- Hamburger menu on mobile
- Stack columns on mobile
- Touch-friendly button sizes (min 44px)
- Proper padding on mobile
- Feed cards readable on mobile
```

### Prompt 10.5: Onboarding Flow
```
Create /onboarding page (for new signups):
- Step 1: Welcome + what to expect
- Step 2: Complete profile (contractors)
- Step 3: Submit verification (contractors)
- Step 4: Browse feed / post job

Show onboarding for users who haven't completed profile.
```

### Prompt 10.6: Accessibility
```
Add basic accessibility:
- Alt text on images
- Proper heading hierarchy
- Keyboard navigation
- Focus indicators
- ARIA labels on icons
```

---

## COMPLETE VERIFICATION CHECKLIST

### Phase 4 - Sign-off:
- [ ] Messages send/receive
- [ ] Notifications work

### Phase 5 - Sign-off:
- [ ] Can leave review after job complete
- [ ] Reviews display on profile
- [ ] Star ratings calculate correctly

### Phase 6 - Sign-off:
- [ ] Forum page loads
- [ ] Verified users can post
- [ ] Unverified blocked from forum

### Phase 7 - Sign-off:
- [ ] Pricing page shows plans
- [ ] Post limits enforced by tier
- [ ] Founding member badge works

### Phase 8 - Sign-off:
- [ ] Admin can manage users
- [ ] Admin can moderate jobs
- [ ] Analytics show key metrics

### Phase 9 - Sign-off:
- [ ] In-app notifications work
- [ ] Notification bell shows count

### Phase 10 - Sign-off:
- [ ] Loading states on all pages
- [ ] Error states handled
- [ ] Mobile responsive
- [ ] Onboarding flow works
