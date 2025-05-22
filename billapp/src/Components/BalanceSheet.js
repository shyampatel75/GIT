import React, { useState, useEffect } from "react";

const BalanceSheet = () => {
  const [invoices, setInvoices] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [otherTransactions, setOtherTransactions] = useState([]);
  const [companyTransactions, setCompanyTransactions] = useState([]);
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
        const [invoicesRes, depositsRes, buyersRes, othersRes, companyRes] = await Promise.all([
          fetch("http://localhost:8000/api/invoices/", { headers }),
          fetch("http://localhost:8000/api/add-deposit/", { headers }),
          fetch("http://localhost:8000/api/banking/buyer/", { headers }),
          fetch("http://localhost:8000/api/banking/other/", { headers }),
          fetch("http://localhost:8000/api/banking/company/", { headers }),
        ]);

        if (!invoicesRes.ok || !depositsRes.ok || !buyersRes.ok || !othersRes.ok || !companyRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const invoicesData = await invoicesRes.json();
        const depositsData = await depositsRes.json();
        const buyersData = await buyersRes.json();
        const othersData = await othersRes.json();
        const companyData = await companyRes.json();

        setInvoices(invoicesData);
        setDeposits(depositsData);
        setBuyerTransactions(buyersData);
        setOtherTransactions(othersData);
        setCompanyTransactions(companyData);
      } catch (err) {
        console.error(err);
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalDepositAmount = deposits.reduce(
    (sum, deposit) => sum + (Number(deposit.amount) || 0),
    0
  );

  const buyerTotals = {};
  buyerTransactions.forEach((t) => {
    const name = t.buyer_name;
    buyerTotals[name] = (buyerTotals[name] || 0) + Number(t.deposit_amount || 0);
  });

  const invoiceTotals = {};
  invoices.forEach((invoice) => {
    const name = invoice.buyer_name;
    invoiceTotals[name] = (invoiceTotals[name] || 0) + Number(invoice.total_with_gst || 0);
  });

  const remainingBalances = {};
  const allBuyerNames = new Set([...Object.keys(buyerTotals), ...Object.keys(invoiceTotals)]);
  allBuyerNames.forEach((buyerName) => {
    const invoiceAmount = invoiceTotals[buyerName] || 0;
    const depositAmount = buyerTotals[buyerName] || 0;
    const remaining = invoiceAmount - depositAmount;
    remainingBalances[buyerName] = remaining;
  });

  const creditOthers = otherTransactions.filter(t => t.transaction_type === "credit");
  const debitOthers = otherTransactions.filter(t => t.transaction_type === "debit");
  const creditCompanies = companyTransactions.filter(t => t.transaction_type === "credit");
  const debitCompanies = companyTransactions.filter(t => t.transaction_type === "debit");

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

      <div className="d-flex flex-row mb-6">
        {/* Left Side: Buyer Deposits + Other + Company Credits */}
        <div className="w-50 pr-4">
          <h2 className="text-lg font-semibold mb-2">Deposits / Credits</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Buyer Deposits */}
              {buyerTransactions
                .filter(b => remainingBalances[b.buyer_name] !== 0)
                .map(buyer => (
                  <tr key={`buyer-${buyer.id}`} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{buyer.buyer_name}</td>
                    <td className="py-3 px-4 border-b">
                      {buyer.transaction_date
                        ? new Date(buyer.transaction_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 border-b text-right font-mono">
                      ₹ {Math.abs(Number(buyer.deposit_amount || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}

              {/* Other Credit Transactions */}
              {creditOthers.map((item) => (
                <tr key={`other-credit-${item.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{item.other_type}</td>
                  <td className="py-3 px-4 border-b">
                    {item.other_date
                      ? new Date(item.other_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 border-b text-right font-mono">
                    ₹ {Number(item.other_amount).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Company Credit Transactions */}
              {creditCompanies.map((item) => (
                <tr key={`company-credit-${item.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{item.company_name}</td>
                  <td className="py-3 px-4 border-b">
                    {item.transaction_date
                      ? new Date(item.transaction_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 border-b text-right font-mono">
                    ₹ {Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Side: Invoices + Other + Company Debits */}
        <div className="w-50 pl-4">
          <h2 className="text-lg font-semibold mb-2">Invoices / Debits</h2>
          <table className="w-100 bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Date</th>
                <th className="py-3 px-4 border-b text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoices
                .filter(i => remainingBalances[i.buyer_name] > 0)
                .map(invoice => (
                  <tr key={`invoice-${invoice.id}`} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">{invoice.buyer_name}</td>
                    <td className="py-3 px-4 border-b">
                      {invoice.invoice_date
                        ? new Date(invoice.invoice_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                      ₹ {remainingBalances[invoice.buyer_name].toFixed(2)}
                    </td>
                  </tr>
                ))}

              {/* Other Debit Transactions */}
              {debitOthers.map((item) => (
                <tr key={`other-debit-${item.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{item.other_type}</td>
                  <td className="py-3 px-4 border-b">
                    {item.other_date
                      ? new Date(item.other_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Number(item.other_amount).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Company Debit Transactions */}
              {debitCompanies.map((item) => (
                <tr key={`company-debit-${item.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">{item.company_name}</td>
                  <td className="py-3 px-4 border-b">
                    {item.transaction_date
                      ? new Date(item.transaction_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4 border-b text-right font-mono text-red-600 font-semibold">
                    ₹ {Number(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
