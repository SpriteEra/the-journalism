import Modal from "../components/ui/Modal";

/** Legacy API over <Modal>. */
const PopUp = ({ isOpen, onClose, children, heading = "PopUp", classes = "", size = "lg" }) => (
  <Modal open={isOpen} onClose={onClose} title={heading} size={size} className={classes}>{children}</Modal>
);

export default PopUp;
