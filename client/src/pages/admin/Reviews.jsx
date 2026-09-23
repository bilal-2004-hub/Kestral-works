import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { reviewApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

const FILTERS = ['pending', 'approved', 'rejected', 'hidden'];

export default function AdminReviews() {
  const [status, setStatus] = useState('pending');
  const { data, loading, error, refetch } = useFetch(
    () => reviewApi.list({ limit: 30, status: status || undefined }), [status]
  );
  const moderate = useAction(reviewApi.moderate);
  const removeReview = useAction(reviewApi.remove);
  const [confirmId, setConfirmId] = useState(null);
  const toast = useToast();

  const onModerate = async (id, nextStatus) => {
    try {
      await moderate.execute(id, { status: nextStatus });
      toast.success(nextStatus === 'approved' ? 'Review published' : `Review ${nextStatus}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDelete = async () => {
    try {
      await removeReview.execute(confirmId);
      setConfirmId(null);
      toast.success('Review deleted');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Nothing reaches the website until you approve it here."
        action={
          <div className="w-44">
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}
              options={[{ value: '', label: 'All reviews' }, ...FILTERS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
          </div>
        }
      />

      {loading && <SkeletonCards count={3} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState icon={Star} title="Nothing to moderate" description="New client reviews appear here for approval before publication." />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((review) => (
          <Card key={review._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={review.client?.name} src={review.client?.avatar} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-marine-900">{review.client?.name}</p>
                  <p className="truncate text-xs text-mist-600">{review.client?.company} · {review.project?.name}</p>
                </div>
              </div>
              <StatusBadge status={review.status} />
            </div>

            <div className="mt-4"><StarRating value={review.rating} /></div>
            {review.title && <h3 className="mt-2 font-medium text-marine-900">{review.title}</h3>}
            <p className="mt-1 text-sm text-mist-600">{review.body}</p>
            <p className="mt-3 text-xs text-mist-400">Submitted {formatDate(review.createdAt)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {review.status !== 'approved' && (
                <Button size="sm" onClick={() => onModerate(review._id, 'approved')}>Publish</Button>
              )}
              {review.status !== 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => onModerate(review._id, 'rejected')}>Reject</Button>
              )}
              {review.status === 'approved' && (
                <Button size="sm" variant="ghost" onClick={() => onModerate(review._id, 'hidden')}>Hide</Button>
              )}
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmId(review._id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
        pending={removeReview.pending}
        title="Delete this review?"
        description="It is removed for good, including from the client's own list. Hiding it is usually enough."
        confirmLabel="Delete review"
      />
    </>
  );
}
