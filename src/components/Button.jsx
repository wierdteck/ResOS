import { Link } from 'react-router-dom';

export default function Button({ children, to, variant = 'primary', icon: Icon, type = 'button', ...props }) {
  const className = `button button-${variant}`;
  const content = (
    <>
      {Icon ? <Icon size={17} /> : null}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link className={className} to={to} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} type={type} {...props}>
      {content}
    </button>
  );
}
