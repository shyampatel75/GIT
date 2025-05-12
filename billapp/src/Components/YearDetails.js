import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const YearDetails = () => {
  const { yearRange } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [groupedClients, setGroupedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:8000/api/invoices");
        if (!res.ok) throw new Error("Error fetching invoices");
        const data = await res.json();

        const [startYear, endYear] = yearRange.split("-").map(Number);
        const filtered = data.filter((invoice) => {
          const date = new Date(invoice.invoice_date);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          return month >= 4 ? year === startYear : year === endYear;
        });

        setInvoices(filtered);

        // Group by buyer_name + buyer_gst
        const grouped = {};
        filtered.forEach((invoice) => {
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
      } catch (err) {
        setError("Failed to fetch invoices.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (yearRange?.match(/^\d{4}-\d{4}$/)) {
      fetchInvoices();
    } else {
      setError("Invalid year format.");
      setLoading(false);
    }
  }, [yearRange]);

  return (
    <div style={{ padding: "20px 80px" }}>
      <h2>Year: {yearRange}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <table className="table table-bordered table-hover text-center">
          <thead className="table-dark">
            <tr>
              <th>Sr. No.</th>
              <th>Buyer Name</th>
              <th>GST Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedClients.map((client, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{client.buyer_name}</td>
                <td>{client.buyer_gst}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      navigate("/client-invoices", {
                        state: { client },
                      })
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default YearDetails;