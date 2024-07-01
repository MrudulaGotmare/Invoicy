import React, { useState } from 'react';
import axios from 'axios'; // Import Axios

function UIOutput({ invoiceData = {} }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoiceData, setEditedInvoiceData] = useState({});
  const [gstValidationStatus, setGstValidationStatus] = useState(null);
  const [registrationDate, setRegistrationDate] = useState('');
  const [panValidationStatus, setPanValidationStatus] = useState(null);


  const verifyGST = async (gstNumber) => {
    if (!gstNumber || gstNumber.length !== 15) {
      console.log("GST number is invalid or not provided");
      setGstValidationStatus(null);
      setRegistrationDate('');
      return;
    }

    try {
      const response = await axios.post('https://api.invincibleocean.com/invincible/gstinSearch', {
        gstin: gstNumber
      }, {
        headers: {
          'Content-Type': 'application/json',
          'clientId': '14c56e745f06f0bae9e9945f0f2b9256:cb04fb1d52fa2341c0e3f79a00febea1',
          'secretKey': 'l7RLs6B99J2HIcwnLqxhUx9OAVxHTtnXfjZ8iPJ9Fm1sKR03QnntPeQ3aHT9CKPGv'
        }
      });

      console.log('API Response:', response.data); // Debugging log

      setGstValidationStatus(response.data.code === 200 ? 'valid' : 'invalid');
      setRegistrationDate(response.data.result?.result?.gstnDetailed?.registrationDate || ''); 
    } catch (error) {
      console.error('Error verifying GST:', error);
      setGstValidationStatus('error');
      setRegistrationDate('');
    }
  };

  const verifyPAN = async (panNumber) => {
    if (!panNumber || panNumber.length !== 10) {
      console.log("PAN number is invalid or not provided");
      setPanValidationStatus(null);
      return;
    }

    try {
      const response = await axios.post('https://api.invincibleocean.com/invincible/panPlusV3', {
        panNumber: panNumber
      }, {
        headers: {
          'Content-Type': 'application/json',
          'clientId': '14c56e745f06f0bae9e9945f0f2b9256:cb04fb1d52fa2341c0e3f79a00febea1',
          'secretKey': 'l7RLs6B99J2HIcwnLqxhUx9OAVxHTtnXfjZ8iPJ9Fm1sKR03QnntPeQ3aHT9CKPGv'
        }
      });

      console.log('API Response:', response.data); // Debugging log

      setPanValidationStatus(response.data.code === 200 ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Error verifying PAN:', error);
      setPanValidationStatus('error');
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedInvoiceData(invoiceData[0] || {});
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditedInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'gst') {
      verifyGST(value);
    }
    if (name === 'pan') {
      verifyPAN(value);
    }
  };

  const {
    buyerName = '',
    documentType = '',
    paymentTerms = '',
    invoiceDate = '',
    invoiceNumber = '',
    irnNumber = '',
    poNumber = '',
    sellerName = '',
    shippingAddress = '',
    shippingGstin = '',
    shippingToLegalName = '',
    cgst = 0,
    igst = 0,
    invoiceTotalAmount = 0,
    totalAmountPreTax = 0,
    paymentDueDate = '',
    preTaxTotal = 0,
    roundOff = 0,
    sgst = 0,
    ugst = 0,
    tcs = 0,
    totalTax = 0,
    discount = 0,
    currency = '',
    items = [],
    hsnOrSacCodesWithItemNames = [],
    billPeriod = '',
    accountNumber = '',
    ifscCode = '',
    bank = '',
    swiftCode = '',
    branch = ''
  } = invoiceData[0] || {};

  const saveChanges = () => {
    // Here you would typically update the backend or parent component state
    console.log('Saving changes:', editedInvoiceData);
    // For this example, we'll just update our local state
    invoiceData[0] = { ...invoiceData[0], ...editedInvoiceData };
    setIsEditing(false);
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getValue = (key) => {
    return isEditing ? editedInvoiceData[key] : invoiceData[0]?.[key];
  };

  return (
    <div className="h-screen overflow-y-auto p-4"> {/* Added this wrapper */}
      <div className="max-w-6xl mx-auto"> {/* Added this container for better readability */}
        <div className="flex justify-between w-full mb-8">
          <h1 className="text-3xl font-bold">{invoiceData[0]?.invoiceNumber || 'Invoice Number not provided'}</h1>
        </div>
        <div className="w-full mb-8">
          <h2 className="text-xl font-semibold">Details</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block mb-1 font-medium">Buyer Name</label>
              <input
                type='text'
                className="p-2 border border-gray-300 rounded-md w-full"
                name="buyerName"
                value={getValue('buyerName') || 'Information not provided'}
                readOnly={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Document Type</label>
              <input
                type="text"
                className="p-2 border border-gray-300 rounded-md w-full"
                name="documentType"
                value={getValue('documentType') || 'Information not provided'}
                readOnly={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Payment Terms</label>
              <input
                type="text"
                className="p-2 border border-gray-300 rounded-md w-full"
                name="paymentTerms"
                value={getValue('paymentTerms') || 'Information not provided'}
                readOnly={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Invoice Number</label>
              <input
                type="text"
                className="p-2 border border-gray-300 rounded-md w-full"
                name="invoiceNumber"
                value={getValue('invoiceNumber') || 'Information not provided'}
                readOnly={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">GST Number</label>
              <div className="relative">
                <input
                  type="text"
                  className={`p-2 border rounded-md w-full ${
                    gstValidationStatus === 'valid' ? 'border-green-500' :
                    gstValidationStatus === 'invalid' ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                  name="gst"
                  value={getValue('gst') || ''}
                  readOnly={!isEditing}
                  onClick={() => verifyGST(getValue('gst'))} // Ensure verifyGST is called only once
                />
                {gstValidationStatus === 'valid' && (
                  <svg className="w-6 h-6 text-green-500 absolute right-2 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              {registrationDate && (
                <div className="mt-2 text-sm text-gray-700">
                  reg.dt : {registrationDate}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">PAN Number</label>
              <div className="relative">
                <input
                  type="text"
                  className={`p-2 border rounded-md w-full ${
                    panValidationStatus === 'valid' ? 'border-green-500' :
                    panValidationStatus === 'invalid' ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                  name="pan"
                  value={getValue('pan') || ''}
                  readOnly={!isEditing}
                  onClick={() => verifyPAN(getValue('pan'))} // Ensure verifyPAN is called only once
                />
                {panValidationStatus === 'valid' && (
                  <svg className="w-6 h-6 text-green-500 absolute right-2 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
          <div>
            <label className="block mb-1 font-medium">Invoice Date</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="invoiceDate"
              value={getValue('invoiceDate') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Payment Due Date</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="paymentDueDate"
              value={getValue('paymentDueDate') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">PO Number</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="poNumber"
              value={getValue('poNumber') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Seller Name</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="sellerName"
              value={getValue('sellerName') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping Address</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="shippingAddress"
              value={getValue('shippingAddress') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping GSTIN</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="shippingGstin"
              value={getValue('shippingGstin') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Shipping To Legal Name</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="shippingToLegalName"
              value={getValue('shippingToLegalName') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">CGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="cgst"
              value={getValue('cgst') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">IGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="igst"
              value={getValue('igst') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Invoice Total Amount</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="invoiceTotalAmount"
              value={getValue('invoiceTotalAmount') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Total Amount Pre Tax</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="totalAmountPreTax"
              value={getValue('totalAmountPreTax') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Pre Tax Total</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="preTaxTotal"
              value={getValue('preTaxTotal') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Round Off</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="roundOff"
              value={getValue('roundOff') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">SGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="sgst"
              value={getValue('sgst') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">UGST</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="ugst"
              value={getValue('ugst') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">TCS</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="tcs"
              value={getValue('tcs') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Total Tax</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="totalTax"
              value={getValue('totalTax') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Discount</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="discount"
              value={getValue('discount') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Currency</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="currency"
              value={getValue('currency') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Bill Period</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="billPeriod"
              value={getValue('billPeriod') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Account Number</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="accountNumber"
              value={getValue('accountNumber') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">IFSC Code</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="ifscCode"
              value={getValue('ifscCode') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Bank</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="bank"
              value={getValue('bank') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">SWIFT Code</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="swiftCode"
              value={getValue('swiftCode') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Branch</label>
            <input
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              name="branch"
              value={getValue('branch') || 'Information not provided'}
              readOnly={!isEditing}
              onChange={handleChange}
            />
          </div>
        </form>
      </div>
      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold">Items</h2>
        <table className="min-w-full mt-4 border border-gray-300">
          <thead>
            <tr>
              <th className="p-2 border border-gray-300">Item Name</th>
              <th className="p-2 border border-gray-300">HSN/SAC Code</th>
              <th className="p-2 border border-gray-300">Quantity</th>
              <th className="p-2 border border-gray-300">Unit Price</th>
              <th className="p-2 border border-gray-300">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="p-2 border border-gray-300">{item.description || 'Information not provided'}</td>
                <td className="p-2 border border-gray-300">{item.hsnOrSacCode || 'Information not provided'}</td>
                <td className="p-2 border border-gray-300">{item.quantity || 'Information not provided'}</td>
                <td className="p-2 border border-gray-300">{formatCurrency(item.pricePerUnit) || 'Information not provided'}</td>
                <td className="p-2 border border-gray-300">{formatCurrency(item.amount) || 'Information not provided'}</td>
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
            <span>-${formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tax</span>
            <span>${formatCurrency(totalTax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount Pre Tax</span>
            <span>${formatCurrency(totalAmountPreTax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Invoice Total Amount</span>
            <span>${formatCurrency(invoiceTotalAmount)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end w-full mt-8">
        {isEditing ? (
          <>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md mr-2"
              onClick={saveChanges}
            >
              Save
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md"
              onClick={toggleEditMode}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={toggleEditMode}
          >
            Edit
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

export default UIOutput;