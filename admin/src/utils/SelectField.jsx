import Field from "../components/ui/Field";
import Select from "../components/ui/Select";

/** Legacy API wrapper over <Field> + <Select>. options=[{value,label}] */
const SelectField = ({ required = false, LabelTitle, selectVal, handleSelectChange, options = [], placeholder = "Select an option", name, readOnly = false }) => (
  <Field label={LabelTitle} required={required} className="mb-5">
    <Select name={name} value={selectVal ?? ""} onChange={handleSelectChange} disabled={readOnly} options={options} placeholder={placeholder} required={required} />
  </Field>
);

export default SelectField;
