// JSONOutput.jsx
import React from 'react';

function JSONOutput({ structuredData }) {
  console.log(structuredData);

  // Fixed exchange rate (1 USD to INR) - update this as needed
  const usdToInrRate = 83.0;

  const calculateCost = (promptTokens, completionTokens) => {
    const inputCostPerToken = 0.50 / 1_000_000;  // $0.50 per 1 million tokens
    const outputCostPerToken = 1.50 / 1_000_000;  // $1.50 per 1 million tokens
    const totalCost = (promptTokens * inputCostPerToken) + (completionTokens * outputCostPerToken);
    return totalCost;
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md w-full">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
      {structuredData.length > 0 ? (
        structuredData.map((data, index) => {
          const costUSD = data.token_usage?.prompt_tokens && data.token_usage?.completion_tokens
            ? calculateCost(data.token_usage.prompt_tokens, data.token_usage.completion_tokens)
            : null;
          const costINR = costUSD ? costUSD * usdToInrRate : null;

          return (
            <div key={index} className="mb-4">
              <div className="p-4 bg-gray-100 rounded-md mb-2">
                <p><strong>Prompt Tokens:</strong> {data.token_usage?.prompt_tokens || 'N/A'}</p>
                <p><strong>Completion Tokens:</strong> {data.token_usage?.completion_tokens || 'N/A'}</p>
                <p><strong>Total Cost (USD):</strong> ${costUSD ? costUSD.toFixed(6) : 'N/A'}</p>
                <p><strong>Total Cost (INR):</strong> ₹{costINR ? costINR.toFixed(2) : 'N/A'}</p>
              </div>
              <pre className="whitespace-pre-wrap break-words p-4 bg-gray-100 rounded-md">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          );
        })
      ) : (
        <p>No invoice data available</p>
      )}
    </div>
  );
}

export default JSONOutput;