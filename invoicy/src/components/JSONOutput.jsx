//JSONOutput.jsx
import React from 'react';

function JSONOutput({ invoiceData }) {
  return (
    <div>
      <h1>Invoice Details</h1>
      {invoiceData ? (
        <pre>{JSON.stringify(invoiceData, null, 2)}</pre>
      ) : (
        <p>No invoice data available</p>
      )}
    </div>
  );
}

export default JSONOutput;