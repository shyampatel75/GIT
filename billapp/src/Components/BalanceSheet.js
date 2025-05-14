import React, { useState, useEffect } from "react";

const BalanceSheet = () => {
  const [invoices, setInvoices] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesRes, depositsRes, buyersRes] = await Promise.all([
          fetch("http://localhost:8000/api/invoices/"),
          fetch("http://localhost:8000/api/add-deposit/"),
          fetch("http://localhost:8000/api/banking/buyer/"),
        ]);

        if (!invoicesRes.ok || !depositsRes.ok || !buyersRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const invoicesData = await invoicesRes.json();
        const depositsData = await depositsRes.json();
        const buyersData = await buyersRes.json();

        setInvoices(invoicesData);
        setDeposits(depositsData);
        setBuyerTransactions(buyersData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalInvoiceAmount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_with_gst) || 0,
    0
  );

  const totalDepositAmount = deposits.reduce(
    (sum, deposit) => sum + Number(deposit.amount) || 0,
    0
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 md:pl-24" style={{ paddingLeft: "100px" }}>
      <h1 className="text-2xl font-bold mb-6">Balance Sheet</h1>

      {/* Total Deposits */}
      <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded">
        <h2 className="text-lg font-semibold">Total Deposits:</h2>
        <p className="text-xl font-mono">₹ {totalDepositAmount.toFixed(2)}</p>
      </div>

      {/* Flex Layout for Buyers and Invoices */}
      <div className="d-flex flex-row mb-6">
        {/* Buyer Transactions (Left) */}
        <div className="w-50 pr-4">
          {buyerTransactions.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Buyer Deposits</h2>
              <table className="w-100 bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 border-b text-left">Buyer Name</th>
                    <th className="py-3 px-4 border-b text-left">Transaction Date</th>
                    <th className="py-3 px-4 border-b text-right">Deposit Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {buyerTransactions.map((buyer) => (
                    <tr key={buyer.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{buyer.buyer_name}</td>
                      <td className="py-3 px-4 border-b">
                        {buyer.transaction_date
                          ? new Date(buyer.transaction_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 border-b text-right font-mono">
                        ₹ {Number(buyer.deposit_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              No buyer transactions available.
            </div>
          )}
        </div>

        {/* Invoices (Right) */}
        {/* Invoices (Right) */}
        <div className="w-50 pl-4">
          {invoices.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Buyer Invoices</h2>
              <table className="w-100 bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left">Invoice Date</th>
                    <th className="py-3 px-4 border-b text-left">Buyer Name</th>
                    <th className="py-3 px-4 border-b text-right">Remaining (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const invoiceAmount = Number(invoice.total_with_gst || 0);
                    const buyerDepositTotal = buyerTransactions
                      .filter((t) => t.buyer_name === invoice.buyer_name)
                      .reduce((sum, t) => sum + Number(t.deposit_amount || 0), 0);
                    const remaining = invoiceAmount - buyerDepositTotal;

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">
                          {invoice.invoice_date
                            ? new Date(invoice.invoice_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 border-b">{invoice.buyer_name || "N/A"}</td>

                        <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                          ₹ {remaining.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              No invoices found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BalanceSheet;
