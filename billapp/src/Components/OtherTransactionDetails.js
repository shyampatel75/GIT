import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const OtherTypeTransactions = () => {
  const { type } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Unauthorized. Please log in.");
        setLoading(false);
        return;
      }

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
  }, [type]);

  const totalAmount = transactions.reduce((sum, txn) => sum + Number(txn.other_amount || 0), 0);

  if (loading) return <p className="text-center p-4">Loading...</p>;
  if (error) return <p className="text-center p-4 text-danger">{error}</p>;

  return (
    <div className="container p-4">
      <h3 className="mb-4">Transactions for: <strong>{type}</strong></h3>

      {transactions.length === 0 ? (
        <p>No transactions found for this type.</p>
      ) : (
        <table className="table table-bordered table-hover text-center">
          <thead className="table-dark">
            <tr>
              <th>No.</th>
              <th>Transaction Type</th>
              <th>Other Type</th>
              <th>Amount (₹)</th>
              <th>Date</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => (
              <tr key={txn.id}>
                <td>{index + 1}</td>
                <td>{txn.transaction_type}</td>
                <td>{txn.other_type}</td>
                <td>{txn.other_amount}</td>
                <td>{new Date(txn.other_date).toLocaleDateString("en-GB")}</td>
                <td>{txn.other_notice || "-"}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="fw-bold">
              <td colSpan="3">Total</td>
              <td>{totalAmount.toFixed(2)}</td>
              <td colSpan="2"></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OtherTypeTransactions;