import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UploadInvoice from './components/UploadInvoice';
import Invoice from './components/Invoice';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadInvoice />} />
        <Route path="/invoice" element={<Invoice />} />
      </Routes>
    </Router>
  );
}

export default App;
