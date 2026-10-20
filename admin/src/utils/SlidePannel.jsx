import { Drawer } from "../components/ui/Modal";

/** Legacy API over <Drawer>. `width` accepts "500px" – converted to a max-width. */
const SlidePanel = ({ isOpen, onClose, title, children, width = "400px" }) => (
  <Drawer open={isOpen} onClose={onClose} title={title} width="" >
    <div style={{ maxWidth: width }} className="w-full">{children}</div>
  </Drawer>
);

export default SlidePanel;
