import React, { useState, useEffect } from 'react';

function UIOutput({ invoiceData = {} }) {
  const [isEditing, setIsEditing] = useState(false); // State to track edit mode
  const [editedData, setEditedData] = useState({}); // State to store edited data
  const [currentInvoiceData, setCurrentInvoiceData] = useState({}); // State to hold current invoice data

  useEffect(() => {
    // Set current invoice data when invoiceData prop changes
    setCurrentInvoiceData(invoiceData[0] || {});
  }, [invoiceData]);

  // Function to handle input changes and update editedData
  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditedData({
      ...editedData,
      [name]: value
    });
  };

  // Function to toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Function to save changes
  const saveChanges = () => {
    // Merge editedData into currentInvoiceData
    const updatedInvoiceData = {
      ...currentInvoiceData,
      ...editedData
    };

    // Perform logic to save updatedInvoiceData (e.g., API call, state update)
    console.log('Saving changes:', updatedInvoiceData);
    // Example: Update invoiceData state or perform API call to save changes
    // updateInvoiceData(updatedInvoiceData);
    setCurrentInvoiceData(updatedInvoiceData); // Update currentInvoiceData state
    setIsEditing(false); // Exit edit mode after saving
  };

  return (
    <>
      <div className="flex justify-between w-full mb-8">
        <h1 className="text-3xl font-bold">{currentInvoiceData.invoiceNumber}</h1>
      </div>
      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold">Details</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block mb-1 font-medium">Buyer Name</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="buyerName"
              value={isEditing ? (editedData.buyerName || currentInvoiceData.buyerName) : currentInvoiceData.buyerName}
              readOnly={!isEditing} // Toggle readOnly based on isEditing state
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Document Type</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={documentType}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Payment Terms</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={paymentTerms}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Invoice Date</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={invoiceDate}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Payment Due Date</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={paymentDueDate}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">PO Number</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={poNumber}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Seller Name</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={sellerName}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping Address</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={shippingAddress}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping GSTIN</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={shippingGstin}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping To Legal Name</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={shippingToLegalName}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">CGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={cgst}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">IGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={igst}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Invoice Total Amount</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={invoiceTotalAmount}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Total Amount Pre Tax</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={totalAmountPreTax}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Pre Tax Total</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={preTaxTotal}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Round Off</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={roundOff}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">SGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={sgst}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">UGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={ugst}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">TCS</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={tcs}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Total Tax</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={totalTax}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Discount</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={discount}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Currency</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={currency}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Bill Period</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={billPeriod}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Account Number</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={accountNumber}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">IFSC Code</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={ifscCode}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Bank</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={bank}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">SWIFT Code</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={swiftCode}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Branch</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={branch}
              readOnly
            />
          </div>
        </form>
      </div>

      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold">Items</h2>
        <table className="w-full mt-4 border border-gray-300 rounded-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-300">Description</th>
              <th className="p-2 border border-gray-300">Qty</th>
              <th className="p-2 border border-gray-300">Price</th>
              <th className="p-2 border border-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="p-2 border border-gray-300">{item.description}</td>
                <td className="p-2 border border-gray-300">{item.quantity}</td>
                <td className="p-2 border border-gray-300">${item.pricePerUnit.toFixed(2)}</td>
                <td className="p-2 border border-gray-300">${(item.quantity * item.pricePerUnit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold">Invoice Summary</h2>
        <div className="flex flex-col space-y-2 mt-4">
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tax</span>
            <span>${totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount Pre Tax</span>
            <span>${totalAmountPreTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Invoice Total Amount</span>
            <span>${invoiceTotalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        {isEditing ? (
          <button
            className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
            onClick={saveChanges}
          >
            Save Changes
          </button>
        ) : (
          <button
            className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
            onClick={toggleEditMode}
          >
            Edit
          </button>
        )}
        <button className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700">
          Export to CSV
        </button>
        <button className="px-4 py-2 text-white bg-gray-800 rounded-md hover:bg-gray-700">
          Send Invoice
        </button>
      </div>
    </>
  );
}

export default UIOutput;