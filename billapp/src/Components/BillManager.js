import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BillManager = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8000/api/invoices/")
            .then((res) => res.json())
            .then((data) => {
                setInvoices(data);
            })
            .catch((err) => console.error("Error fetching invoices:", err));
    }, []);

    return (
        <div>
            <div style={{ padding: "10px 21px 10px 82px" }}>
                <div style={{ borderRadius: "10px", overflow: "hidden" }}>
                    <table className="table table-striped table-hover text-center">
                        <thead className="table-dark">
                            <tr>
                                <th>No.</th>
                                <th>Buyer Name</th>
                                <th>Date</th>
                                <th>GST Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.slice(0, 30).map((invoice, index) => (
                                <tr
                                    key={invoice.id}
                                    onClick={() => navigate(`/invoice-details/${invoice.id}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>{index + 1}</td>
                                    <td>{invoice.buyer_name}</td>
                                    <td>{invoice.invoice_date}</td>
                                    <td>{invoice.buyer_gst}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillManager;
