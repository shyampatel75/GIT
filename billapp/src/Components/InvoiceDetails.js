import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [buyerDeposits, setBuyerDeposits] = useState([]);
  const tableRef = useRef();

  useEffect(() => {
    fetch(`http://localhost:8000/api/invoices/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then((invoiceData) => {
        setInvoice(invoiceData);
      })
      .catch((err) => {
        console.error(err);
        setInvoice(null);
      });
  }, [id]);

  useEffect(() => {
    if (!invoice) return;

    fetch(`http://localhost:8000/api/banking/buyer/`)
      .then((res) => res.json())
      .then((allDeposits) => {
        const filtered = allDeposits.filter(
          (entry) => entry.invoice_id === invoice.invoice_number
        );
        setBuyerDeposits(filtered);
      })
      .catch((err) => {
        console.error("Error fetching deposits", err);
        setBuyerDeposits([]);
      });
  }, [invoice]);

  const totalDeposited = Number(
    buyerDeposits.reduce((sum, d) => sum + Number(d.deposit_amount || 0), 0)
  );
  

  const remainingBalance = invoice
    ? invoice.total_with_gst - totalDeposited
    : 0;

  const handleGeneratePDF = async () => {
    const element = tableRef.current;
    element.style.backgroundColor = "#ffffff";

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${invoice.buyer_name}.pdf`);
  };

  if (!invoice) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold mb-2">No invoice data found.</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto bg-white rounded shadow-md mt-6 p-6 border" style={{ paddingLeft: "100px", height: "100vh" }}>
      <h2 className="text-2xl font-bold text-center mb-4">
        Invoice - {invoice.buyer_name}
      </h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Invoice Summary & Transactions</h3>
        <table className="w-100 border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th>Date</th>
              <th>Deposit Date</th>
              <th>Deposit Amount</th>
              <th>Amount</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-100 font-semibold">
              <td>{invoice.invoice_date}</td>
              <td>-</td>
              <td>-</td>
              <td>{invoice.currency}{invoice.total_with_gst}</td>
              <td>-</td>
            </tr>

            {buyerDeposits.map((entry, index) => (
              <tr key={index}>
                <td>-</td>
                <td>{entry.selected_date}</td>
                <td>{invoice.currency}{entry.deposit_amount}</td>
                <td>-</td>
                <td>-</td>
              </tr>
            ))}

            <tr className="bg-yellow-100 font-bold">
              <td colSpan={4} className="text-right">Remaining Balance</td>
              <td>{invoice.currency}{remainingBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable hidden area */}
      <div
        ref={tableRef}
        className="printable-area"
        style={{
          display: "block",
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          backgroundColor: "white",
          width: "800px",
          padding: "30px",
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">Statement of Account</h2>

        <div className="mb-4">
          <p><strong>Buyer Name:</strong> {invoice.buyer_name}</p>
          <p><strong>Invoice Date:</strong> {invoice.invoice_date}</p>
          <p><strong>Total Invoice Amount (Debit):</strong> {invoice.currency}{invoice.total_with_gst}</p>
        </div>

        <h4 className="w-100 text-center" style={{ backgroundColor: "#51add9" }}>Account Activity</h4>
        <table className="w-100 text-sm">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left">Description</th>
              <th className="text-right">Credit (Deposit)</th>
              <th className="text-right">Debit (Invoice)</th>
              <th className="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-red-50 font-semibold">
              <td>{invoice.invoice_date}</td>
              <td>{invoice.buyer_name}</td>
              <td className="text-right">-</td>
              <td className="text-right">{invoice.currency}{invoice.total_with_gst}</td>
              <td className="text-right">{invoice.currency}{invoice.total_with_gst}</td>
            </tr>

            {(() => {
              let runningBalance = invoice.total_with_gst;
              return buyerDeposits.map((entry, index) => {
                const depositAmt = entry.deposit_amount;
                runningBalance -= depositAmt;
                return (
                  <tr key={`deposit-${index}`} className="bg-green-50">
                    <td>{entry.selected_date}</td>
                    <td>{entry.notice || "Deposit"}</td>
                    <td className="text-right">{invoice.currency}{depositAmt}</td>
                    <td className="text-right">-</td>
                    <td className="text-right">{invoice.currency}{runningBalance.toFixed(2)}</td>
                  </tr>
                );
              });
            })()}

            <tr className="bg-gray-100 font-bold">
              <td colSpan="2">Final Totals</td>
              <td className="text-right">{invoice.currency}{totalDeposited.toFixed(2)}</td>
              <td className="text-right">{invoice.currency}{invoice.total_with_gst.toFixed(2)}</td>
              <td className="text-right">{invoice.currency}{remainingBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={handleGeneratePDF}
          className="m-4 text-white px-6 py-2 rounded btn btn-success"
        >
          📄 Generate PDF
        </button>
        <button
          onClick={() => navigate(-1)}
          className="text-white px-6 py-2 rounded btn-primary"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetails;
