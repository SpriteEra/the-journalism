import Select from "../components/ui/Select";

/** Legacy API: options = array of labels, selectedOption = index, handleOptionClick(index). */
const Dropdown = ({ selectedOption, options = [], handleOptionClick }) => (
  <div className="w-36 md:w-56">
    <Select value={selectedOption} onChange={(e) => handleOptionClick(Number(e.target.value))} aria-label="Select option" options={options.map((label, value) => ({ value, label }))} />
  </div>
);

export default Dropdown;
