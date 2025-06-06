import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const OtherTypeTransactions = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tableRef = useRef();

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      setError("Unauthorized. Please login.");
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/banking/other/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch transactions.");
        const data = await res.json();

        const filtered = data.filter((txn) => txn.other_type === type);
        setTransactions(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [type, token]);

  const handleGeneratePDF = async () => {
    const element = tableRef.current;
    element.style.backgroundColor = "#fff";

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const pdfWidth = pageWidth - margin * 2;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      pdfWidth,
      pdfHeight
    );

    pdf.save(`Other-Transactions-${type}.pdf`);
  };

  const totalAmount = transactions.reduce(
    (sum, txn) => sum + Number(txn.other_amount || 0),
    0
  );

  if (loading) return <p className="text-center p-4">Loading...</p>;
  if (error)
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold mb-2 text-red-600">{error}</h2>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Login
        </button>
      </div>
    );

  return (
    <div className="mx-auto bg-white p-6 rounded shadow-md" style={{ paddingLeft: "100px", minHeight: "100vh" }}>
      <div ref={tableRef}>
        <h2 className="text-2xl font-bold text-center mb-6">Other Transactions Statement</h2>
        <div className="mb-4">
          <p><strong>Transaction Type:</strong> {type}</p>
        </div>

        <h4 className="w-full text-center py-2" style={{ backgroundColor: "#51add9" }}>Account Activity</h4>
        <table className="w-100 text-sm border mt-2">
          <thead>
            <tr>
              <th className="p-2 border">No.</th>
              <th className="p-2 border">Transaction Type</th>
              <th className="p-2 border">Other Type</th>
              <th className="p-2 border">Amount (₹)</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => (
              <tr key={txn.id}>
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border text-center">{txn.transaction_type}</td>
                <td className="p-2 border text-center">{txn.other_type}</td>
                <td className="p-2 border text-right">{Number(txn.other_amount).toFixed(2)}</td>
                <td className="p-2 border text-center">
                  {new Date(txn.other_date).toLocaleDateString("en-GB")}
                </td>
                <td className="p-2 border">{txn.other_notice || "-"}</td>
              </tr>
            ))}
            <tr className="bg-gray-200 font-bold">
              <td colSpan={3} className="text-right p-2 border">Total Amount:</td>
              <td className="text-right p-2 border">{totalAmount.toFixed(2)}</td>
              <td colSpan={2} className="p-2 border"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-4 d-flex justify-content-around">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          ← Go Back
        </button>
        <button
          onClick={handleGeneratePDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📄 Generate PDF
        </button>
      </div>
    </div>
  );
};

export default OtherTypeTransactions;
