// JSONOutput.jsx
import React from 'react';

function JSONOutput({ structuredData }) {
  

  console.log(structuredData);

  return (
    <div className="p-4 bg-white shadow-md rounded-md w-full">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
      {structuredData.length > 0 ? (
        structuredData.map((data, index) => (
          <pre key={index} className="whitespace-pre-wrap break-words mb-4 p-4 bg-gray-100 rounded-md">
            {JSON.stringify(data, null, 2)}
          </pre>
        ))
      ) : (
        <p>No invoice data available</p>
      )}
    </div>
  );
}

export default JSONOutput;