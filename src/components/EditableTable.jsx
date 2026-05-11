import NumericInput from './NumericInput.jsx';

export default function EditableTable({ columns, rows, getRowClassName, onChange, onRemove }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {onRemove ? <th>Remove</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={getRowClassName ? getRowClassName(row) : ''}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : column.type === 'number' ? (
                    <NumericInput
                      min={column.min}
                      step={column.step}
                      value={row[column.key] ?? 0}
                      onCommit={(value) => onChange(row.id, column.key, value)}
                    />
                  ) : (
                    <input
                      value={row[column.key] ?? ''}
                      onChange={(event) => onChange(row.id, column.key, event.target.value)}
                    />
                  )}
                </td>
              ))}
              {onRemove ? (
                <td>
                  <button className="icon-text danger" type="button" onClick={() => onRemove(row.id)}>
                    Remove
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
