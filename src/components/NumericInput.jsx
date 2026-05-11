import { useEffect, useState } from 'react';

export default function NumericInput({ value, onCommit, min, max, step = '1', disabled = false, className = '' }) {
  const [draft, setDraft] = useState(String(value ?? 0));

  useEffect(() => {
    setDraft(String(value ?? 0));
  }, [value]);

  function commit(nextDraft = draft) {
    let parsed = Number(nextDraft);
    if (nextDraft === '' || Number.isNaN(parsed)) parsed = 0;
    if (min !== undefined) parsed = Math.max(Number(min), parsed);
    if (max !== undefined) parsed = Math.min(Number(max), parsed);
    onCommit(parsed);
    setDraft(String(parsed));
  }

  return (
    <input
      className={className}
      disabled={disabled}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onFocus={(event) => {
        if (Number(value) === 0) event.target.select();
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commit()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}
