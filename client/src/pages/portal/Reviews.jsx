import { useState } from 'react';
import {
  Star, Plus, Sparkles, FolderKanban, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { reviewApi, projectApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, TextArea, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function PortalReviews() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);

  const reviews = useFetch(() => reviewApi.list({ limit: 30 }), []);
  const allProjects = useFetch(() => projectApi.list({ limit: 50 }), []);

  const { execute: submitReview, pending: submitting, fieldErrors } = useAction(reviewApi.create);

  // Determine which projects this client can review (exclude already reviewed projects)
  const existingReviewProjectIds = (reviews.data || []).map((r) =>
    typeof r.project === 'object' ? (r.project?._id || r.project?.id) : r.project
  );

  const reviewableProjects = (allProjects.data || []).filter(
    (p) => !existingReviewProjectIds.includes(p._id || p.id)
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const projectId = form.get('project');
    const title = form.get('title');
    const body = form.get('body');

    try {
      await submitReview({
        project: projectId || undefined,
        rating,
        title,
        body,
      });
      setModalOpen(false);
      toast.success('Thank you! Your review has been submitted.');
      reviews.refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews & Testimonials"
        description="Share your experience working with Kestral Works. Approved testimonials are featured on our public case studies."
        action={
          reviewableProjects.length > 0 && (
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Write a Review
            </Button>
          )
        }
      />

      {/* Loading State */}
      {reviews.loading && (
        <Card>
          <SkeletonRows count={4} />
        </Card>
      )}

      {/* Error State */}
      {reviews.error && !reviews.loading && (
        <ErrorState message={reviews.error} onRetry={reviews.refetch} />
      )}

      {/* Empty State */}
      {!reviews.loading && !reviews.error && reviews.data?.length === 0 && (
        <EmptyState
          icon={Star}
          title="No reviews submitted yet"
          description={
            reviewableProjects.length > 0
              ? 'You have active or completed projects eligible for a review. We would love to hear your thoughts!'
              : (allProjects.data?.length === 0
                ? 'When a project is assigned to your account, you will be able to share your feedback and review here.'
                : 'You have submitted reviews for all your current projects! Thank you for your partnership.')
          }
          action={
            reviewableProjects.length > 0 && (
              <Button icon={Plus} onClick={() => setModalOpen(true)}>
                Write First Review
              </Button>
            )
          }
        />
      )}

      {/* Reviews Grid */}
      {!reviews.loading && !reviews.error && reviews.data?.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {reviews.data.map((review) => {
            const isApproved = review.status === 'approved';
            return (
              <Card key={review._id || review.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <StarRating value={review.rating} size={18} />
                    <StatusBadge status={review.status} />
                  </div>

                  {review.title && (
                    <h3 className="mt-3 font-display text-base font-bold text-white">
                      "{review.title}"
                    </h3>
                  )}

                  <p className="mt-2 whitespace-pre-wrap text-xs text-marine-100/80 leading-relaxed">
                    {review.body}
                  </p>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between text-xs font-mono text-marine-100/50">
                  <span className="flex items-center gap-1.5 text-signal-400 truncate max-w-[200px]">
                    <FolderKanban size={13} /> {review.project?.name || 'Kestral Works Studio'}
                  </span>
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Write a Client Review"
        footer={null}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            name="project"
            label="Select Project"
            required
            error={fieldErrors?.project}
            options={[
              { value: '', label: 'Select a project...' },
              ...reviewableProjects.map((p) => ({
                value: p._id || p.id,
                label: p.name,
              })),
            ]}
          />

          <div>
            <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-marine-100/80">
              Your Rating
            </label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size={26} />
              <span className="text-xs font-mono text-signal-400 font-bold">{rating} / 5 Stars</span>
            </div>
          </div>

          <Input
            name="title"
            label="Headline / Summary"
            placeholder="e.g. Exceptional speed and outstanding architecture"
            error={fieldErrors?.title}
          />

          <TextArea
            name="body"
            label="Review Text"
            rows={5}
            required
            placeholder="What was your experience working with Kestral Works? What impact did the project have on your business?"
            error={fieldErrors?.body}
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
