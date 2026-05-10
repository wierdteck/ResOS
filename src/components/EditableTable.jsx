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
                  {column.render ? column.render(row) : (
                    <input
                      type={column.type || 'text'}
                      min={column.min}
                      step={column.step}
                      value={row[column.key] ?? ''}
                      onChange={(event) => onChange(row.id, column.key, column.type === 'number' ? Number(event.target.value) : event.target.value)}
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
