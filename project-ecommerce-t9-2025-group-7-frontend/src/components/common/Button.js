import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  isLoading = false,
  className = ''
}) => {
  const buttonClass = `btn btn-${variant} ${className} ${isLoading ? 'loading' : ''}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="btn-spinner"></span>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

