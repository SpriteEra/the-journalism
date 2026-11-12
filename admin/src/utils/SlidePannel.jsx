
import { Drawer } from "../components/ui/Modal";

const SlidePanel = ({
  isOpen,
  onClose,
  title,
  children,
  width = "400px",
}) => (
  <Drawer
    open={isOpen}
    onClose={onClose}
    title={title}
    width={width}
  >
    {children}
  </Drawer>
);

export default SlidePanel;
