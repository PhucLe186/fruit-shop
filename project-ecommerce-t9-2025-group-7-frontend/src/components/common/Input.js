import './Input.css';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled
}) => {
  return (
    <div className="input-group">
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'error' : ''}`}
        required={required}
        disabled={disabled}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;

