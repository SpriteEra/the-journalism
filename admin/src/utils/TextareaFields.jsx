import Field from "../components/ui/Field";
import Textarea from "../components/ui/Textarea";

/** Legacy API wrapper over <Field> + <Textarea>. */
const TextareaFields = ({ required = false, LabelTitle, inputVal, handleInputValue, placeholder, name, readOnly = false, rows = 4 }) => (
  <Field label={LabelTitle} required={required} className="mb-5">
    <Textarea required={required} readOnly={readOnly} name={name} value={inputVal ?? ""} onChange={handleInputValue} placeholder={placeholder} rows={rows} />
  </Field>
);

export default TextareaFields;
