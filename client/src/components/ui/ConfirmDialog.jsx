import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Are you sure?',
  description, confirmLabel = 'Confirm', tone = 'danger', pending = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-mist-600">{description}</p>
    </Modal>
  );
}
