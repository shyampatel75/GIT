import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BuyerInvoices = () => {
  const { buyerName } = useParams();
  const [buyerInvoices, setBuyerInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/invoices/by-buyer/?name=${buyerName}`
        );
        const data = await res.json();
        setBuyerInvoices(data);
      } catch (err) {
        console.error("Error fetching buyer invoices:", err);
      }
    };
    fetchInvoices();
  }, [buyerName]);

  return (
    <div style={{ padding: "20px" }}>
      <h3>Invoices for: {buyerName}</h3>
      <table className="table table-bordered text-center">
        <thead>
          <tr>
            <th>No.</th>
            <th>Invoice Number</th>
            <th>Date</th>
            <th>Country</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {buyerInvoices.map((invoice, index) => (
            <tr key={invoice.id}>
              <td>{index + 1}</td>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.invoice_date}</td>
              <td>{invoice.country}</td>
              <td>
                <button
                  className="btn btn-success"
                  onClick={() =>
                    alert(`Downloading: ${invoice.invoice_number}`)
                  }
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BuyerInvoices;