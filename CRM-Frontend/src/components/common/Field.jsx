function Field({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  ...rest
}) {
  return (
    <label className="inputGroup">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...rest}
      />
    </label>
  )
}

export default Field
