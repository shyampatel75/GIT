import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [sameBuyerInvoices, setSameBuyerInvoices] = useState([]);
  const tableRef = useRef();

  // Fetch all invoices, find current one, and filter by same name and GST
  useEffect(() => {
    fetch("http://localhost:8000/api/invoices/")
      .then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then((invoices) => {
        const current = invoices.find((inv) => String(inv.id) === String(id));
        if (!current) throw new Error("Invoice not found");

        const filtered = invoices.filter(
          (inv) =>
            inv.buyer_name === current.buyer_name &&
            inv.buyer_gst === current.buyer_gst &&
            inv.buyer_country === "India"
        );

        setInvoice(current);
        setSameBuyerInvoices(filtered);
      })
      .catch((err) => {
        console.error(err);
        setInvoice(null);
      });
  }, [id]);

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
    <div
      className="mx-auto bg-white rounded shadow-md mt-6 p-6 border"
      style={{ paddingLeft: "100px", height: "100vh" }}
    >
      <h2 className="text-2xl font-bold text-center mb-4">
        Invoice - {invoice.buyer_name}
      </h2>

      {sameBuyerInvoices.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-2">
            All Invoices for {invoice.buyer_name} (India)
          </h3>
          <table className="w-full border text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>GST</th>
                <th>Total with GST</th>
              </tr>
            </thead>
            <tbody>
              {sameBuyerInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.invoice_date}</td>
                  <td>{inv.buyer_gst}</td>
                  <td>
                    {inv.currency} {inv.total_with_gst}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
        <h2 className="text-2xl font-bold text-center mb-6">
          Statement of Account
        </h2>

        <div className="mb-4">
          <p>
            <strong>Buyer Name:</strong> {invoice.buyer_name}
          </p>
          <p>
            <strong>Invoice Date:</strong> {invoice.invoice_date}
          </p>
          <p>
            <strong>Total Invoice Amount (Debit):</strong> {invoice.currency}{" "}
            {invoice.total_with_gst}
          </p>
        </div>

        {/* Account Activity section removed */}
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
