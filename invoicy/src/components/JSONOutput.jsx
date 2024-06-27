// JSONOutput.jsx
import React from 'react';

function JSONOutput({ invoiceData }) {
  // Extract and parse the structured data, token usage, and avg confidence from each invoice
  const structuredData = invoiceData.map(data => {
    let parsedData = {};
    if (data.structured_data && data.structured_data.response_content) {
      try {
        parsedData = JSON.parse(data.structured_data.response_content);
      } catch (error) {
        console.error('Error parsing structured data:', error);
      }
    }
    return {
      ...parsedData,
      token_usage: data.structured_data?.token_usage || {},
      avg_confidence: data.avg_confidence || 0
    };
  });

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