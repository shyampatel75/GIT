import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BillManager = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [otherTransactions, setOtherTransactions] = useState([]);
  const [groupedOther, setGroupedOther] = useState([]);
  const [companyTransactions, setCompanyTransactions] = useState([]);
  const [groupedCompany, setGroupedCompany] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [category, setCategory] = useState("all");
  const [allCombined, setAllCombined] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Authentication token not found.");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Invoices
      const invoiceRes = await fetch("http://localhost:8000/api/invoices/", { headers });
      if (!invoiceRes.ok) throw new Error("Failed to fetch invoices.");
      const invoiceData = await invoiceRes.json();
      setInvoices(invoiceData);

      const grouped = {};
      invoiceData.forEach((invoice) => {
        const key = `${invoice.buyer_name}-${invoice.buyer_gst}`;
        if (!grouped[key]) {
          grouped[key] = {
            buyer_name: invoice.buyer_name,
            buyer_gst: invoice.buyer_gst,
            invoices: [invoice],
          };
        } else {
          grouped[key].invoices.push(invoice);
        }
      });
      setGroupedClients(Object.values(grouped));

      // Other transactions
      const otherRes = await fetch("http://localhost:8000/api/banking/other/", { headers });
      if (!otherRes.ok) throw new Error("Failed to fetch 'other' transactions.");
      const otherData = await otherRes.json();
      setOtherTransactions(otherData);

      const groupedOtherMap = otherData.reduce((acc, txn) => {
        const key = txn.other_type;
        if (!acc[key]) {
          acc[key] = txn;
        }
        return acc;
      }, {});
      setGroupedOther(Object.values(groupedOtherMap));

      // Company transactions
      const companyRes = await fetch("http://localhost:8000/api/banking/company/", { headers });
      if (!companyRes.ok) throw new Error("Failed to fetch company transactions.");
      const companyData = await companyRes.json();
      setCompanyTransactions(companyData);

      const groupedCompanyMap = companyData.reduce((acc, txn) => {
        const key = txn.company_name;
        if (!acc[key]) {
          acc[key] = txn;
        }
        return acc;
      }, {});
      setGroupedCompany(Object.values(groupedCompanyMap));

      // Combine all data
      const allFormatted = [
        ...invoiceData.map((inv) => ({
          source: "Invoice",
          name: inv.buyer_name,
          amount: inv.total_amount,
          date: inv.invoice_date,
          note: inv.note || "-",
          original: inv,  // <- Add this line
        })),
        ...otherData.map((txn) => ({
          source: "Other",
          name: txn.other_type,
          amount: txn.other_amount,
          date: txn.other_date,
          note: txn.other_notice || "-",
          original: txn,  // <- Add this line
        })),
        ...companyData.map((txn) => ({
          source: "Company",
          name: txn.company_name,
          amount: txn.amount,
          date: txn.transaction_date,
          note: txn.notice || "-",
          original: txn,  // <- Add this line
        })),
      ];

      setAllCombined(allFormatted);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = groupedClients.filter((client) =>
    client.buyer_name.toLowerCase().includes(filterText.toLowerCase()) ||
    client.buyer_gst.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredOther = groupedOther.filter((txn) =>
    txn.other_type?.toLowerCase().includes(filterText.toLowerCase()) ||
    txn.other_amount?.toString().includes(filterText)
  );

  const filteredCompany = groupedCompany.filter((txn) =>
    txn.company_name?.toLowerCase().includes(filterText.toLowerCase()) ||
    txn.amount?.toString().includes(filterText)
  );

  return (
    <div style={{ padding: "10px 21px 10px 82px" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      <h3>Bill Manager</h3>
      <div className="mb-3 d-flex align-items-center gap-2">
        <select
          className="form-select"
          style={{ maxWidth: "200px" }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="invoice">Invoice</option>
          <option value="company">Company</option>
          <option value="other">Other</option>
          <option value="all">All</option>
        </select>

        <input
          type="text"
          className="form-control"
          placeholder={`Filter by ${category === "other"
            ? "Type or Amount"
            : category === "company"
              ? "Company Name or Amount"
              : "Name or GST"
            }`}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
        <button className="btn btn-secondary" onClick={() => setFilterText("")}>
          Clear
        </button>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {category === "all" && (
            <>
              <h4>All Transactions</h4>
              {allCombined.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <>
                  <table className="table table-bordered table-hover text-center">
                    <thead className="table-dark">
                      <tr>
                        <th>No.</th>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCombined
                        .filter((txn) =>
                          txn.source.toLowerCase().includes(filterText.toLowerCase()) ||
                          txn.name.toLowerCase().includes(filterText.toLowerCase()) ||
                          txn.note.toLowerCase().includes(filterText.toLowerCase())
                        )
                        .sort((a, b) => {
                          const dateA = new Date(a.date);
                          const dateB = new Date(b.date);
                          // Handle invalid dates by pushing them to the end
                          if (isNaN(dateA)) return 1;
                          if (isNaN(dateB)) return -1;
                          return dateA - dateB; // ascending order
                        })
                        .map((txn, index) => (
                          <tr
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const { source, original } = txn;
                              if (source === "Invoice") {
                                navigate("/invoice-details/:id", {
                                  state: {
                                    buyer_name: original.buyer_name,
                                    buyer_gst: original.buyer_gst,
                                  },
                                });
                              } else if (source === "Other") {
                                navigate(`/banking/other-type/${original.other_type}`);
                              } else if (source === "Company") {
                                navigate(`/banking/company/${original.company_name}`, {
                                  state: { company_name: original.company_name },
                                });
                              }
                            }}
                          >
                            <td>{index + 1}</td>
                            <td>{txn.source}</td>
                            <td>{txn.name}</td>
                            <td>
                              {txn.date && !isNaN(new Date(txn.date))
                                ? new Date(txn.date).toLocaleDateString("en-GB")
                                : "-"}
                            </td>
                            <td>{txn.note}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {category === "invoice" && (
            <>
              {filteredClients.length === 0 ? (
                <p>No buyers found.</p>
              ) : (
                <table className="table table-bordered table-hover text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>No.</th>
                      <th>Buyer Name</th>
                      <th>GST Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate("/invoice-details/:id", {
                            state: {
                              buyer_name: client.buyer_name,
                              buyer_gst: client.buyer_gst,
                            },
                          })
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{client.buyer_name}</td>
                        <td>{client.buyer_gst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {category === "other" && (
            <>
              <h4>Other Banking Transactions</h4>
              {filteredOther.length === 0 ? (
                <p>No transactions found.</p>
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
                    {filteredOther.map((txn, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/banking/other-type/${txn.other_type}`)
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{txn.transaction_type}</td>
                        <td>{txn.other_type}</td>
                        <td>{txn.other_amount}</td>
                        <td>{new Date(txn.other_date).toLocaleDateString("en-GB")}</td>
                        <td>{txn.other_notice || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {category === "company" && (
            <>
              <h4>Company Banking Transactions</h4>
              {filteredCompany.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="table table-bordered table-hover text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>No.</th>
                      <th>Company Name</th>
                      <th>Amount (₹)</th>
                      <th>Date</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompany.map((txn, index) => (
                      <tr
                        key={index}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/banking/company/${txn.company_name}`, {
                            state: { company_name: txn.company_name }
                          })
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{txn.company_name}</td>
                        <td>{txn.amount}</td>
                        <td>{new Date(txn.transaction_date).toLocaleDateString("en-GB")}</td>
                        <td>{txn.notice || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BillManager;
