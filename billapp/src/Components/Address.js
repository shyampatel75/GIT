import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import './Address.css';

const Address = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const printRef = useRef();

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/invoices/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownload = async (invoiceId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch invoice data
      const invoiceResponse = await fetch(`http://localhost:8000/api/invoices/${invoiceId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to fetch invoice details');
      }
      const pdfBasicDetail = await invoiceResponse.json();

      // Fetch settings data
      const settingsResponse = await fetch(`http://localhost:8000/api/settings/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const pdfMainDetails = await settingsResponse.json();

      // Set the combined data into state
      setSelectedInvoice({
        ...pdfBasicDetail,
        ...pdfMainDetails[0]
      });

      // Preload the logo image
      const logoImg = new Image();
      logoImg.crossOrigin = "Anonymous";
      logoImg.src = 'http://127.0.0.1:8000/media/favicon_cvGw7pn.png';
      logoImg.onload = () => setLogoLoaded(true);

    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Failed to prepare invoice for download");
    } finally {
      setLoading(false);
    }
  };

  const numberToWords = (num) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const thousandUnits = ["", "Thousand", "Lakh", "Crore"];

    if (num === 0) return "Zero";
    let words = "";
    let unitIndex = 0;
    let integerPart = Math.floor(num);

    while (integerPart > 0) {
      let chunk = integerPart % 1000;
      if (chunk) {
        let chunkWords = "";
        if (chunk >= 100) {
          chunkWords += ones[Math.floor(chunk / 100)] + " Hundred ";
          chunk %= 100;
        }
        if (chunk < 10) {
          chunkWords += ones[chunk];
        } else if (chunk < 20) {
          chunkWords += teens[chunk - 10];
        } else {
          chunkWords += tens[Math.floor(chunk / 10)] + (chunk % 10 !== 0 ? " " + ones[chunk % 10] : "");
        }
        words = chunkWords.trim() + " " + thousandUnits[unitIndex] + " " + words;
      }
      integerPart = Math.floor(integerPart / 1000);
      unitIndex++;
    }

    let decimalPart = Math.round((num - Math.floor(num)) * 100);
    if (decimalPart > 0) {
      words += " and " + numberToWords(decimalPart) + " Paisa";
    }

    return words.trim();
  };

  useEffect(() => {
    if (selectedInvoice && logoLoaded) {
      const timer = setTimeout(() => {
        generatePDF();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedInvoice, logoLoaded]);

  const generatePDF = async () => {
    const input = printRef.current;
    if (input) {
      try {
        const canvas = await html2canvas(input, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          logging: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const margin = 10; // 10mm margin
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Calculate width and height with margin
        const availableWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * availableWidth) / canvas.width;
        const imgX = margin;
        const imgY = (pageHeight - imgHeight) / 2; // Vertically center

        pdf.addImage(imgData, "PNG", imgX, imgY, availableWidth, imgHeight);
        pdf.save(`Invoice_${selectedInvoice.invoice_number}.pdf`);
        setSuccess("Invoice downloaded successfully!");
      } catch (err) {
        console.error("PDF generation error:", err);
        setError("Failed to generate PDF");
      } finally {
        setSelectedInvoice(null);
        setLogoLoaded(false);
      }
    }
  };

  const handleNewBill = (invoice) => {
    navigate('/tax-invoice', {
      state: {
        buyerData: {
          buyer_name: invoice?.buyer_name || '',
          buyer_address: invoice?.buyer_address || '',
          buyer_gst: invoice?.buyer_gst || '',
        },
        consigneeData: {
          consignee_name: invoice?.consignee_name || '',
          consignee_address: invoice?.consignee_address || '',
          consignee_gst: invoice?.consignee_gst || '',
        }
      }
    });
  };


    const showDeleteToast = () => {
      const toastEl = document.getElementById("deleteToast");
      if (toastEl) {
        const bsToast = new window.bootstrap.Toast(toastEl);
        bsToast.show();
      }
    };


  const handleDelete = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch(`http://localhost:8000/api/delete/${invoiceId}/`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          setInvoices((prevInvoices) =>
            prevInvoices.filter((invoice) => invoice.id !== invoiceId)
          );
       
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to delete invoice');
        }
      } catch (err) {
        console.error("Error deleting invoice:", err);
        setError(err.message || "An error occurred while deleting the invoice");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (invoiceId) => {
    navigate(`/edit-invoice/${invoiceId}`);
  };

  return (
    <div className="containers" style={{ height: "100vh" }}>
      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      {/* New Bill Button */}
      <div className="d-grid gap-2 d-md-flex justify-content-md-end pt-2 pb-2 px-4">
        <button
          type="button"
          className="naw-biladd btn btn-success"
          onClick={() => navigate("/tax-invoice")}
          disabled={loading}
        >
          <i className="bi bi-plus-lg"></i> {loading ? "Loading..." : "New Bills"}
        </button>
      </div>

      {/* Table Container */}
      <div style={{ padding: "10px 21px 10px 82px" }}>
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px solid #dee2e6",
            boxShadow: "0 0 15px rgba(0,0,0,0.1)",
            background: "#fff",
          }}
        >
          <table className="table table-striped table-hover text-center mb-0">
            <thead className="table-dark">
              <tr>
                <th>No.</th>
                <th>Buyer</th>
                <th>Address</th>
                <th>Total</th>
                <th>items</th>

              </tr>
            </thead>
            <tbody>
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">Loading invoices...</td>
                </tr>
              ) : invoices.map((invoice, index) => (
                <tr key={invoice.id}>
                  <td>{index + 1}</td>

                  {/* Buyer Name with Avatar */}
                  <td>
                    {invoice.buyer_name}
                  </td>

                  {/* Click-to-copy Address */}
                  <td
                    className="truncate address-hover"
                    title={invoice.buyer_address}
                    onClick={() => {
                      navigator.clipboard.writeText(invoice.buyer_address);
                      setSuccess("Address copied to clipboard!");
                    }}
                  >
                    {invoice.buyer_address.length > 20
                      ? invoice.buyer_address.slice(0, 20) + "..."
                      : invoice.buyer_address}
                  </td>

                  <td>
                    {invoice.currency} {parseFloat(invoice.total_with_gst).toFixed(2)}
                  </td>

                  {/* View Button */}
                 <td>
  {/* View Button */}
  <button
    className="btn btn-outline-primary action-btn mx-3"
    onClick={() => navigate(`/invoice-detail/${invoice.id}`)}
    disabled={loading}
  >
    <i className="bi bi-eye"></i>
  </button>

  {/* Download Button */}
  <button
    className="btn btn-outline-success action-btn mx-3"
    onClick={() => handleDownload(invoice.id)}
    disabled={loading}
  >
    <i className="bi bi-download"></i>
  </button>

  {/* Edit Button */}
  <button
    className="btn btn-outline-warning action-btn mx-3"
    onClick={() => handleEdit(invoice.id)}
    disabled={loading}
  >
    <i className="bi bi-pencil-square"></i>
  </button>

  {/* Delete Button */}
  <button
    className="btn btn-outline-danger action-btn mx-3"
    onClick={() => {
      handleDelete(invoice.id);
      showDeleteToast(); // Show toast on delete
    }}
    disabled={loading}
  >
    <i className="bi bi-trash3"></i>
  </button>

  {/* Toast */}
  <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
    <div
      id="deleteToast"
      className="toast hide"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-header bg-danger text-white">
        <strong className="me-auto">Deleted</strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="toast"
          aria-label="Close"
        ></button>
      </div>
      <div className="toast-body">Invoice has been deleted successfully.</div>
    </div>
  </div>
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Hidden printable invoice for PDF */}
      {selectedInvoice && (
        <div ref={printRef} style={{ position: "absolute", left: "-9999px" }}>
          <div style={{ paddingLeft: "10px" }}>
            <div style={{ paddingRight: "10px" }}>
              <h2 className="text-center">TAX INVOICE</h2>
              <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white" }}>
                <div className="row date-tables">
                  <div className="col-6">
                    {/* Seller Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong style={{ fontSize: "15px" }}>
                              Grabsolve Infotech:
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            {selectedInvoice.seller_address}
                            <br />
                            Email: {selectedInvoice.seller_email}
                            <br />
                            PAN: {selectedInvoice.seller_pan}
                            <br />
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.seller_gstin}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Buyer Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Buyer (Bill to):</strong> {selectedInvoice.buyer_name}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              maxWidth: "250px",
                              overflowWrap: "break-word",
                              height: "150px",
                            }}
                          >
                            {selectedInvoice.buyer_address}
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.buyer_gst}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Consignee Info */}
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Consignee (Ship to):</strong> {selectedInvoice.consignee_name}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              maxWidth: "250px",
                              overflowWrap: "break-word",
                              height: "150px",
                            }}
                          >
                            {selectedInvoice.consignee_address}
                          </td>
                        </tr>
                        <tr>
                          <td className="gray-background">
                            <strong>GSTIN/UIN:</strong> {selectedInvoice.consignee_gst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="col-6">
                    <table className="table table-bordered black-bordered">
                      <tbody style={{ border: "2px solid" }}>
                        <tr>
                          <td style={{ width: "50%" }}>Invoice No.</td>
                          <td>
                            {selectedInvoice.invoice_number}
                          </td>
                        </tr>
                        <tr>
                          <td>Date</td>
                          <td>{new Date(selectedInvoice.invoice_date).toLocaleDateString("en-GB")}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note</td>
                          <td>{selectedInvoice.delivery_note}</td>
                        </tr>
                        <tr>
                          <td>Mode/Terms of Payment</td>
                          <td>{selectedInvoice.payment_mode}</td>
                        </tr>
                        <tr>
                          <td>Delivery Note Date</td>

                          <td>{new Date(selectedInvoice.delivery_note_date).toLocaleDateString("en-GB")}</td>
                        </tr>
                        <tr>
                          <td>Destination</td>
                          <td>{selectedInvoice.destination}</td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="table table-bordered black-bordered">
                      <tbody style={{ width: "100%", border: "2px solid" }}>
                        <tr>
                          <td className="gray-background">
                            <strong>Terms to Delivery:</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{
                            maxWidth: "250px",
                            overflowWrap: "break-word",
                            height: "150px",
                          }}>{selectedInvoice.Terms_to_delivery}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="relative w-72">
                      <p>
                        <strong>Country and currency:</strong>
                      </p>
                      <div
                        className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white">
                        <div
                          className="flex items-center"
                          style={{ height: "30px" }}
                        >
                          <span className="mr-2">
                            {selectedInvoice.country} {selectedInvoice.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <input type="hidden" id="currencyTitle" value="INR" />
                    <input type="hidden" id="currencySymbol" value="₹" />
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <table className="table table-bordered black-bordered">
                      <thead>
                        <tr className="trbody" >
                          <th style={{ backgroundColor: "#f1f3f4" }}>SI No.</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Particulars</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>HSN/SAC</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Hours</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                          <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody style={{ border: "2px solid" }}>
                        <tr style={{ height: "111px" }}>
                          <td>1</td>
                          <td>{selectedInvoice.Particulars}</td>
                          <td style={{ width: "130px" }}>{selectedInvoice.hsn_code}</td>
                          <td style={{ width: "10%" }}>{selectedInvoice.total_hours}</td>
                          <td style={{ width: "10%" }}>{selectedInvoice.rate}</td>
                          <td style={{ width: "200px" }}>
                            <span className="currency-sym">
                              {selectedInvoice.currency} {selectedInvoice.base_amount}
                            </span>
                          </td>
                        </tr>
                        {selectedInvoice.country === "India" && (
                          <>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>CGST @ 9%</span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="cgst">
                                <span className="currency-sym">{selectedInvoice.currency} {selectedInvoice.cgst}</span>
                              </td>
                            </tr>
                            <tr className="inside-india">
                              <td></td>
                              <td>
                                <span style={{ float: "right" }}>SGST @ 9%</span>
                              </td>
                              <td></td>
                              <td></td>
                              <td>9%</td>
                              <td id="sgst">
                                <span className="currency-sym">{selectedInvoice.currency} {selectedInvoice.sgst}</span>
                              </td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td colSpan="5" className="text-right">
                            <strong>Total</strong>
                          </td>
                          <td>
                            <strong id="total-with-gst">
                              {selectedInvoice.currency} {selectedInvoice.total_with_gst}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="row">
                  <div className="col-xs-12">
                    <div className="table-bordered black-bordered amount-box">
                      <div>
                        <p>
                          <strong>Amount Chargeable (in words):</strong>
                        </p>
                        <h4 className="total-in-words">
                          <span className="currency-text">INR </span>
                          {numberToWords(Math.floor(selectedInvoice.total_with_gst))}
                        </h4>
                        <div className="top-right-corner">
                          <span>E. & O.E</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  {selectedInvoice.country === "India" && (
                    <div className="col-xs-12 inside-india">
                      <table className="table table-bordered invoice-table">
                        <thead>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Central Tax</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">State Tax</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2" rowSpan="2">
                              Total Tax Amount
                            </th>
                          </tr>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody style={{ border: "2px solid" }}>
                          <tr>
                            <td>
                              <span className="hns_select_text">{selectedInvoice.hsn_code}</span>
                            </td>
                            <td className="taxable-value">
                              {selectedInvoice.base_amount}
                            </td>
                            <td>9%</td>
                            <td className="tax-cgst">{selectedInvoice.cgst}</td>
                            <td>9%</td>
                            <td className="tax-sgst">{selectedInvoice.sgst}</td>
                            <td className="all-tax-amount">{selectedInvoice.taxtotal}</td>
                          </tr>
                          <tr className="total-row">
                            <td>Total</td>
                            <td className="total-taxable">
                              {selectedInvoice.base_amount}
                            </td>
                            <td></td>
                            <td className="total-tax-cgst">{selectedInvoice.cgst}</td>
                            <td></td>
                            <td className="total-tax-sgst">{selectedInvoice.sgst}</td>
                            <td className="total-tax-amount">
                              {selectedInvoice.taxtotal}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ padding: "0 0 0 20px" }}>
                    <div className="col-xs-12 inside-india">
                      <div>
                        <strong>Tax Amount (in words):</strong>
                        <span className="total-tax-in-words">
                          <span className="currency-text">INR </span>
                          {numberToWords(Math.floor(selectedInvoice.total_with_gst))}
                        </span>
                      </div>
                    </div>
                    <div className="col-xs-12">
                      <div>
                        <h4>
                          <strong>Remarks:</strong>
                        </h4>
                        <h5 className="html-remark">{selectedInvoice.remark}</h5>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-x-12">
                    <div className="hr">
                      <strong>Company's Bank Details</strong>
                      <br />
                      A/c Holder's Name: {selectedInvoice.seller_name}
                      <br />
                      Bank Name: {selectedInvoice.bank_name}
                      <br />
                      A/c No.: {selectedInvoice.account_number}
                      <br />
                      IFS Code: {selectedInvoice.ifsc_code}
                      <br />
                      Branch: {selectedInvoice.branch}
                      <br />
                      SWIFT Code: {selectedInvoice.swift_code}
                    </div>
                    <div className="text-right signatory">
                      {selectedInvoice.logo && (
                        <img
                          src={`http://127.0.0.1:8000${selectedInvoice.logo}`}
                          alt="Company Logo"
                          className="logo-image"
                        />
                      )}

                      <p>for Grabsolve Infotech</p>
                      <p>Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center">This is a Computer Generated Invoice</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Address;