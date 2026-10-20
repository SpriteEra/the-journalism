import Field from "../components/ui/Field";
import Input from "../components/ui/Input";

/**
 * Legacy API (LabelTitle / inputVal / handleInputValue) kept so the 50+ existing forms keep working –
 * it now renders the new <Field> + <Input> components. New code should use those directly.
 */
const InputFields = ({ required = false, LabelTitle, inputVal, handleInputValue, placeholder, type = "text", name, readOnly = false, icon, min }) => (
  <Field label={LabelTitle} required={required} className="mb-5">
    <Input required={required} type={type} readOnly={readOnly} name={name} value={inputVal ?? ""} onChange={handleInputValue} placeholder={placeholder} icon={icon} {...(min ? { min } : {})} />
  </Field>
);

export default InputFields;
