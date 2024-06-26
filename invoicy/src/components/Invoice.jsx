import React from 'react';
import Split from 'react-split';

function Invoice() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-6xl mx-auto">
          <div className="text-red-500 text-3xl font-bold">Xangars</div>
          <div className="flex items-center space-x-6">
            <a href="/" className="font-bold hover:text-gray-500">Home</a>
            <a href="#" className="font-bold hover:text-gray-500">Services</a>
            <a href="#" className="font-bold hover:text-gray-500">Pricing</a>
            <a href="#" className="hover:text-gray-500">Docs</a>
            <a href="#" className="font-bold hover:text-gray-500">Contact Sales</a>
          </div>
        </nav>
        {/* <header className="w-full py-4 bg-white shadow">
        <nav className="flex justify-between items-center w-full max-w-screen-xl mx-auto">
          <div className="text-red-500 text-3xl font-bold">Xangars</div>
          <div className="flex items-center space-x-6">
            <a href="/" className=" hover:text-gray-500">Home</a>
            <a href="#" className="font-bold hover:text-gray-500">Services</a>
            <a href="#" className="font-bold hover:text-gray-500">Pricing</a>
            <a href="#" className="font-bold hover:text-gray-500" onClick={() => navigate('/invoice')}>Docs</a>
            <a href="#" className="font-bold hover:text-gray-500">Contact Sales</a>
          </div>
        </nav>
      </header> */}
      </header>
      <div className="flex flex-grow w-full h-full py-4 rounded-md">
        <Split
          className="flex flex-grow"
          sizes={[50, 50]}
          minSize={100}
          expandToMin={false}
          gutterSize={8}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="ew-resize"
        >
          <div className="flex flex-col items-start max-w-full p-4 bg-white shadow-md rounded-md">
            <div className="flex justify-between w-full mb-8">
              <h1 className="text-3xl font-bold">Invoice #12345</h1>
              <div className="flex space-x-4">
                <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-300 flex items-center">
                  UI
                </button>
                <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-300 flex items-center">
                  JSON
                </button>
              </div>
            </div>
            <div className="w-full mb-8">
              <h2 className="text-xl font-semibold">Details</h2>
              <form className="flex flex-col space-y-4 mt-4">
                <input type="text" placeholder="Date" className="p-2 border border-gray-300 rounded-md" />
                <input type="text" placeholder="Due Date" className="p-2 border border-gray-300 rounded-md" />
                <input type="text" placeholder="Status" className="p-2 border border-gray-300 rounded-md" />
                <input type="text" placeholder="Sent to" className="p-2 border border-gray-300 rounded-md" />
                <input type="text" placeholder="Paid" className="p-2 border border-gray-300 rounded-md" />
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
                  <tr>
                    <td className="p-2 border border-gray-300">Design</td>
                    <td className="p-2 border border-gray-300">1</td>
                    <td className="p-2 border border-gray-300">$300.00</td>
                    <td className="p-2 border border-gray-300">$300.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Copywriting</td>
                    <td className="p-2 border border-gray-300">2</td>
                    <td className="p-2 border border-gray-300">$200.00</td>
                    <td className="p-2 border border-gray-300">$400.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Web Development</td>
                    <td className="p-2 border border-gray-300">1</td>
                    <td className="p-2 border border-gray-300">$500.00</td>
                    <td className="p-2 border border-gray-300">$500.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Illustration</td>
                    <td className="p-2 border border-gray-300">3</td>
                    <td className="p-2 border border-gray-300">$100.00</td>
                    <td className="p-2 border border-gray-300">$300.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-300">Motion Graphics</td>
                    <td className="p-2 border border-gray-300">1</td>
                    <td className="p-2 border border-gray-300">$400.00</td>
                    <td className="p-2 border border-gray-300">$400.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="w-full mb-8">
              <h2 className="text-xl font-semibold">Invoice Summary</h2>
              <div className="flex flex-col space-y-2 mt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>$2,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-$200.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>$120.00</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>$1,920.00</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">Export to CSV</button>
              <button className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">Send Invoice</button>
            </div>
          </div>
          <div className='flex flex-col items-center justify-center flex-grow w-full p-4 bg-white shadow-md rounded-md font-bold text-2xl'>
            <p>Image Preview</p>
          </div>
        </Split>
      </div>
    </div>
  );
}

export default Invoice;
