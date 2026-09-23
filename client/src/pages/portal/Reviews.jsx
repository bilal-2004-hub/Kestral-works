import { useState } from 'react';
import { Star } from 'lucide-react';
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
  const reviews = useFetch(() => reviewApi.list({ limit: 20 }), []);
  const completed = useFetch(() => projectApi.list({ status: 'completed', limit: 50 }), []);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const { execute, pending, fieldErrors } = useAction(reviewApi.create);
  const toast = useToast();

  const reviewable = (completed.data || []).filter(
    (project) => !(reviews.data || []).some((r) => r.project?._id === project._id)
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await execute({ project: form.get('project'), rating, title: form.get('title'), body: form.get('body') });
      setOpen(false);
      toast.success('Thanks — your review goes live once we approve it');
      reviews.refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reviews you have written. Once approved, they appear on our website."
        action={reviewable.length > 0 && <Button icon={Star} onClick={() => setOpen(true)}>Write a review</Button>}
      />

      {reviews.loading && <Card><SkeletonRows count={4} /></Card>}
      {reviews.error && !reviews.loading && <ErrorState message={reviews.error} onRetry={reviews.refetch} />}

      {!reviews.loading && !reviews.error && reviews.data?.length === 0 && (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description={reviewable.length
            ? 'You have a completed project you can review.'
            : 'You can write a review once one of your projects is marked completed.'}
          action={reviewable.length > 0 && <Button className="mt-2" onClick={() => setOpen(true)}>Write a review</Button>}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.data?.map((review) => (
          <Card key={review._id}>
            <div className="flex items-start justify-between gap-3">
              <StarRating value={review.rating} />
              <StatusBadge status={review.status} />
            </div>
            {review.title && <h3 className="mt-3 font-medium text-marine-900">{review.title}</h3>}
            <p className="mt-1 text-sm text-mist-600">{review.body}</p>
            <p className="mt-3 text-xs text-mist-400">{review.project?.name} · {formatDate(review.createdAt)}</p>
            {review.status === 'pending' && (
              <p className="mt-2 text-xs text-mist-600">Waiting for approval before it is published.</p>
            )}
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Write a review">
        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            name="project" label="Which project?" required error={fieldErrors.project}
            options={reviewable.map((p) => ({ value: p._id, label: p.name }))}
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-marine-900">Rating</span>
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <Input name="title" label="Headline" placeholder="One line that sums it up" error={fieldErrors.title} />
          <TextArea name="body" label="Your review" rows={5} required error={fieldErrors.body}
            placeholder="What was it like working with us? What would you tell someone considering it?" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={pending}>Submit review</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
