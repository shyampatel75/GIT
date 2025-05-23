import React, { useState, useEffect } from "react";

const BalanceSheettwo = () => {
  const [invoices, setInvoices] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [otherTransactions, setOtherTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const [invoicesRes, buyersRes, othersRes] = await Promise.all([
          fetch("http://localhost:8000/api/invoices/", { headers }),
          fetch("http://localhost:8000/api/banking/buyer/", { headers }),
          fetch("http://localhost:8000/api/banking/other/", { headers }),
        ]);

        if (!invoicesRes.ok || !buyersRes.ok || !othersRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const invoicesData = await invoicesRes.json();
        const buyersData = await buyersRes.json();
        const othersData = await othersRes.json();

        setInvoices(invoicesData);
        setBuyerTransactions(buyersData);
        setOtherTransactions(othersData);
      } catch (err) {
        console.error(err);
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const buyerDeposits = {};
  buyerTransactions.forEach((t) => {
    const name = t.buyer_name;
    buyerDeposits[name] = (buyerDeposits[name] || 0) + Number(t.deposit_amount || 0);
  });

  const invoiceTotals = {};
  const latestInvoiceDates = {};
  invoices.forEach((inv) => {
    const name = inv.buyer_name;
    const date = new Date(inv.invoice_date);
    invoiceTotals[name] = (invoiceTotals[name] || 0) + Number(inv.total_with_gst || 0);

    // Track latest invoice date
    if (!latestInvoiceDates[name] || date > new Date(latestInvoiceDates[name])) {
      latestInvoiceDates[name] = inv.invoice_date;
    }
  });

  const balances = {};
  const allBuyers = new Set([...Object.keys(buyerDeposits), ...Object.keys(invoiceTotals)]);
  allBuyers.forEach((buyer) => {
    const invoiceAmt = invoiceTotals[buyer] || 0;
    const depositAmt = buyerDeposits[buyer] || 0;
    const bal = invoiceAmt - depositAmt;
    balances[buyer] = Math.round(bal * 100) / 100;
  });

  const buyersOweYou = Object.entries(balances).filter(([_, bal]) => bal > 0);
  const buyersYouOwe = Object.entries(balances).filter(([_, bal]) => bal < 0);

  const otherCredits = otherTransactions.filter((t) => t.transaction_type === "credit");
  const otherDebits = otherTransactions.filter((t) => t.transaction_type === "debit");

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 md:pl-24" style={{ paddingLeft: "100px" }}>
      <h1 className="text-2xl font-bold mb-6">Balance Sheet</h1>

      <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded">
        <h2 className="text-lg font-semibold">Total Deposits:</h2>
        <p className="text-xl font-mono">
          ₹ {Object.values(buyerDeposits).reduce((a, b) => a + b, 0).toFixed(2)}
        </p>
      </div>

      <div className="d-flex flex-row mb-6" style={{ display: "flex" }}>
        {/* Credit (You owe them) */}
        <div className="w-50 pr-4" style={{ flex: 1, marginRight: "20px" }}>
          <h2 className="text-lg font-semibold mb-2">Advance / Credit (You owe them)</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {buyersYouOwe.map(([name, bal]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{name}</td>
                  <td className="py-3 px-4 border-b">—</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-green-700 font-semibold">
                    ₹ {Math.abs(bal).toFixed(2)}
                  </td>
                </tr>
              ))}
              {otherCredits.map((entry, index) => (
                <tr key={`credit-${index}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{entry.other_type}</td>
                  <td className="py-3 px-4 border-b">{formatDate(entry.other_date || entry.created_at)}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-green-700 font-semibold">
                    ₹ {Math.abs(Number(entry.other_amount)).toFixed(2)}
                  </td>
                </tr>
              ))}
              {buyersYouOwe.length === 0 && otherCredits.length === 0 && (
                <tr>
                  <td className="py-3 px-4 border-b" colSpan={3}>No advance/credit balances</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Debit (They owe you) */}
        <div className="w-50 pl-4" style={{ flex: 1 }}>
          <h2 className="text-lg font-semibold mb-2">Outstanding Balance (They owe you)</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {buyersOweYou.map(([name, bal]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{name}</td>
                  <td className="py-3 px-4 border-b">{formatDate(latestInvoiceDates[name])}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Math.abs(bal).toFixed(2)}
                  </td>
                </tr>
              ))}
              {otherDebits.map((entry, index) => (
                <tr key={`debit-${index}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{entry.other_type}</td>
                  <td className="py-3 px-4 border-b">{formatDate(entry.other_date || entry.created_at)}</td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Math.abs(Number(entry.other_amount)).toFixed(2)}
                  </td>
                </tr>
              ))}
              {buyersOweYou.length === 0 && otherDebits.length === 0 && (
                <tr>
                  <td className="py-3 px-4 border-b" colSpan={3}>No outstanding balances</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheettwo;
