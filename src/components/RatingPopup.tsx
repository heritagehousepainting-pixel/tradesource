'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface RatingPopupProps {
  job: any
  currentUserId: string
  otherUserId: string
  otherUserName: string
  onComplete: () => void
  onCancel: () => void
  jobStatus?: string
}

export default function RatingPopup({ job, currentUserId, otherUserId, otherUserName, onComplete, onCancel }: RatingPopupProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isIssue, setIsIssue] = useState(false)
  const [issueType, setIssueType] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const issueTypes = [
    { value: 'no_show', label: 'No Show - Did not show up' },
    { value: 'poor_work', label: 'Poor Work - Work was unsatisfactory' },
    { value: 'unfinished', label: 'Unfinished - Left job incomplete' },
    { value: 'unprofessional', label: 'Unprofessional - Rude or dishonest' },
    { value: 'unpaid', label: 'Unpaid - Never paid for work' },
    { value: 'changed_mind', label: 'Changed Mind - Canceled last minute' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    
    setSubmitting(true)
    
    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', job.id)
      .eq('reviewer_id', currentUserId)
      .single()
    
    if (existing) {
      alert('You have already reviewed this job!')
      setSubmitting(false)
      return
    }
    
    // Submit review
    const { error } = await supabase.from('reviews').insert({
      job_id: job.id,
      reviewer_id: currentUserId,
      reviewed_id: otherUserId,
      rating,
      feedback: feedback.trim() || null,
      is_issue: isIssue,
      issue_type: isIssue ? issueType : null,
    })

    if (error) {
      alert('Error submitting review: ' + error.message)
      setSubmitting(false)
      return
    }

    // Update user's avg_rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', otherUserId)
    
    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await supabase
        .from('users')
        .update({ 
          avg_rating: Math.round(avgRating * 10) / 10,
          review_count: reviews.length
        })
        .eq('id', otherUserId)
    }
    
    // Mark job as completed only if not already completed
    if (job.status !== 'COMPLETED') {
      await supabase
        .from('jobs')
        .update({ status: 'COMPLETED' })
        .eq('id', job.id)
        
      // Log completion
      await supabase.from('job_history').insert({
        user_id: currentUserId,
        job_id: job.id,
        action: 'COMPLETED'
      })
    }

    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-2">Rate Your Experience</h2>
        <p className="text-gray-600 mb-6">
          How was your experience with <strong>{otherUserName}</strong> on this job?
        </p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hoverRating || rating) ? '\u2B50' : '\u2606'}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mb-6">
          {rating === 1 ? '⭐ Very Bad' : 
           rating === 2 ? '⭐⭐ Bad' : 
           rating === 3 ? '⭐⭐⭐ Okay' : 
           rating === 4 ? '⭐⭐⭐⭐ Good' : 
           rating === 5 ? '⭐⭐⭐⭐⭐ Excellent' : 
           'Click to rate'}
        </p>

        {/* Issue Reporting */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isIssue}
              onChange={(e) => setIsIssue(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium text-red-600">Report a problem</span>
          </label>
          <p className="text-xs text-gray-500 ml-6">Check this if there was a serious issue</p>
        </div>

        {/* Issue Type Selection */}
        {isIssue && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <label className="block text-sm font-medium mb-2">What went wrong?</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select an issue...</option>
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Feedback Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {isIssue ? 'Describe the problem (optional)' : 'Leave a review (optional)'}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={isIssue ? 'Tell us what happened...' : 'Share your experience...'}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border py-2 rounded-lg font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
