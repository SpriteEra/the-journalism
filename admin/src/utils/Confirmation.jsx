import { ConfirmDialog } from "../components/ui/Modal";

/** Legacy API over <ConfirmDialog>. */
const Confirmation = ({ isOpen, onClose, btnDanger = false, onConfirm = null, description = "", btnTitle = "Delete", title = "" }) => (
  <ConfirmDialog open={isOpen} onClose={onClose} onConfirm={onConfirm || onClose} title={title} message={description} confirmLabel={btnTitle} tone={btnDanger ? "danger" : "primary"} />
);

export default Confirmation;
