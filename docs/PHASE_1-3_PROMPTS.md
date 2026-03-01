# TradeSource - Phase 1-3 Development Prompts

**Goal:** Complete Phases 1-3 to full completion before moving on.

---

## PHASE 1: AUTH & PROFILES

### Prompt 1.1: Verify Email Sign-up/Login
```
Check and fix the sign-in flow:
- Test email/password login works
- Test email/password signup for Contractor
- Test email/password signup for Homeowner
- Ensure session persists across page refreshes
- Fix any issues found
```

### Prompt 1.2: Verify Role Selection
```
- Contractor signup: /contractor/signup → user_type = CONTRACTOR
- Homeowner signup: /homeowner/signup → user_type = HOMEOWNER
- Confirm roles are saved correctly in database
- Add GC signup if missing (should be in contractor flow with trade_type)
```

### Prompt 1.3: Profile Creation & Editing
```
- Test profile page at /profile
- Verify editable fields: name, company, phone, bio, trade type, service counties
- Ensure changes save to database
- Test profile photo upload functionality
- Verify "Edit Profile" button works
```

### Prompt 1.4: OAuth Google Login (Optional - Skip for Now)
```
- Skip this for MVP
```

---

## PHASE 2: VERIFICATION SYSTEM

### Prompt 2.1: License Upload & Verification
```
- Verify contractor can enter driver's license number
- Verify contractor can enter PA HIC license number  
- Verify these save to database
- Check admin sees submitted license numbers in /admin
```

### Prompt 2.2: Insurance Upload
```
- Verify contractor can enter insurance provider name
- Verify insurance expiry date saves
- Verify COI upload button exists and works
- Verify admin sees insurance info in queue
```

### Prompt 2.3: W-9 Form Upload
```
- Verify W-9 upload section exists on profile
- Verify submission saves to database
- Verify admin sees W-9 status in verification queue
```

### Prompt 2.4: Unified Submit for Review
```
- Verify all 4 items (DL, HIC, Insurance, W-9) submit together
- Verify status changes to "PENDING" after submission
- Verify contractor cannot apply to jobs while PENDING
- Verify only APPROVED grants full access
```

### Prompt 2.5: Admin Verification Workflow
```
- Navigate to /admin (as admin user)
- Verify pending contractors appear in queue
- Verify all submitted documents are visible
- Test "Approve" button → sets status to APPROVED
- Test "Reject" button → sets status to REJECTED with feedback
- Verify rejected contractor sees feedback message
```

### Prompt 2.6: Badge Display
```
- Verify badges show on contractor's own profile
- Verify badges show on public contractor profile (/contractor/:id)
- Badges: Verified (blue), Insured (green), W-9 (orange), External Reviews (yellow)
- Unverified users should NOT see full prices on job feed
```

---

## PHASE 3: JOB SYSTEM

### Prompt 3.1: Contractor Job Posting
```
- Sign in as verified contractor
- Navigate to /jobs/post
- Fill out: Title, Description, County, Work Category, Job Type, Price Type, Price
- Add photos/videos (test upload)
- Submit job
- Verify job appears in feed
- Verify job shows on /feed with correct details
```

### Prompt 3.2: Homeowner B2C Posting
```
- Sign in as homeowner
- Navigate to /jobs/post
- Toggle "Homeowner project (free posting)"
- Fill out simplified form (no price)
- Submit
- Verify B2C badge shows on job
- Verify job is free
```

### Prompt 3.3: Photo/Video Upload
```
- Test uploading multiple photos
- Test uploading video
- Verify previews show before posting
- Verify remove button works
- Verify media saves with job
- Verify media displays on job detail page
```

### Prompt 3.4: Job Feed with Filters
```
- Navigate to /feed
- Verify jobs display (newest first)
- Test county filter dropdown
- Test job type filter (Full Job, Piece Work, Homeowner Project)
- Test search functionality
- Verify B2C jobs show "Homeowner Project" badge
```

### Prompt 3.5: Interest System (No Bidding)
```
- As contractor: View job detail → Click "I'm Interested"
- Add optional message
- Submit interest
- Verify interest appears in poster's Messages → Interests tab
- Verify NO price input field exists
```

### Prompt 3.6: Award/Accept Flow
```
- As job poster: Go to Messages → Interests tab
- View list of interested contractors
- Click contractor name to view profile
- Click "Accept" button
- Verify:
  - Job status changes to AWARDED
  - Interest status changes to SELECTED
  - Conversation appears in Accepted/Chats tab
  - Both parties can now chat
```

### Prompt 3.7: Job Status Lifecycle
```
Test complete flow:
1. Job created → status = OPEN
2. Contractor interested → interest status = INTERESTED
3. Poster accepts → job status = AWARDED, interest = SELECTED
4. Job completion → status = COMPLETED (need to add this)
5. Both parties can leave reviews after COMPLETED
```

### Prompt 3.8: Delete/Archive Jobs
```
- Add "Delete" button for job poster on job detail page
- Add "Archive" option for completed jobs
- Verify delete removes from feed
- Verify archived jobs accessible in history
```

---

## VERIFICATION CHECKLIST

### Phase 1 - Sign-off Required:
- [ ] Email login works
- [ ] Contractor signup works
- [ ] Homeowner signup works
- [ ] Profile editing saves
- [ ] Session persists

### Phase 2 - Sign-off Required:
- [ ] License numbers save
- [ ] Insurance info saves
- [ ] W-9 submission works
- [ ] All 4 docs submit together
- [ ] Admin sees all pending
- [ ] Approve/Reject works
- [ ] Badges display correctly
- [ ] Unverified can't see prices

### Phase 3 - Sign-off Required:
- [ ] Contractor can post job
- [ ] Homeowner can post B2C
- [ ] Photo/video upload works
- [ ] Feed shows all jobs
- [ ] Filters work
- [ ] Interest expression works
- [ ] Accept flow works
- [ ] Chat unlocks after award
- [ ] Job lifecycle complete

---

**Instructions:**
1. Run each prompt sequentially
2. Test thoroughly
3. Fix any issues found
4. Check off items as verified
5. Get Jack sign-off before Phase 2
6. Get Jack sign-off before Phase 3
