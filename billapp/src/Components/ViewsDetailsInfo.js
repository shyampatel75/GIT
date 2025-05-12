// ViewsDetailsInfo.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ViewsDetailsInfo = () => {
  const { buyer_name } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/invoices/`);
        if (!response.ok) throw new Error("Failed to fetch invoices");
        const data = await response.json();
        const filtered = data.filter(
          (invoice) => invoice.buyer_name === buyer_name
        );
        setInvoices(filtered);
      } catch (error) {
        console.error(error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [buyer_name]);

  return (

    
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Invoice Details for {buyer_name}</h2>

      {loading ? (
        <p>Loading...</p>
      ) : invoices.length === 0 ? (
        <p>No invoices found for this buyer.</p>
      ) : (



        <table className="w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Invoice No</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Amount</th>
              <th className="border px-2 py-1">GST</th>
              <th className="border px-2 py-1">Country</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="border px-2 py-1">{inv.invoice_number}</td>
                <td className="border px-2 py-1">{inv.invoice_date}</td>
                <td className="border px-2 py-1">{inv.total_amount}</td>
                <td className="border px-2 py-1">{inv.buyer_gst}</td>
                <td className="border px-2 py-1">{inv.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
    </div>
  );
};

export default ViewsDetailsInfo;
