import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Taxinvoice.css";

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  // add more as needed
};

const safeNumber = (value) => {
  if (value === null || value === undefined || isNaN(value) || value === "") return "";
  return value;
};

const numberToWordsIndian = (num) => {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let word = "";
  function getWords(n) {
    let str = "";
    if (n > 19) {
      str += tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    } else if (n > 9) {
      str += teens[n - 10];
    } else if (n > 0) {
      str += ones[n];
    }
    return str;
  }
  let crore = Math.floor(num / 10000000);
  num = num % 10000000;
  let lakh = Math.floor(num / 100000);
  num = num % 100000;
  let thousand = Math.floor(num / 1000);
  num = num % 1000;
  let hundred = Math.floor(num / 100);
  let rest = num % 100;
  if (crore) word += getWords(crore) + " Crore ";
  if (lakh) word += getWords(lakh) + " Lakh ";
  if (thousand) word += getWords(thousand) + " Thousand ";
  if (hundred) word += ones[hundred] + " Hundred ";
  if (rest) {
    if (word !== "") word += "and ";
    word += getWords(rest) + " ";
  }
  return word.trim();
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Clientinvoices = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const client = state?.client;
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const printRef = useRef();
  const [settingsData, setSettingsData] = useState({});
  const pdfRef = useRef(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [showConversion, setShowConversion] = useState(false);

  const displayInvoices = client ? invoices : invoices;

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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (client) {
      setInvoices(client.invoices || []);
    } else {
      fetchInvoices();
    }
  }, [client, fetchInvoices]);

  const fetchWithAuth = async (url, options = {}) => {
      const token = localStorage.getItem("access_token");
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (options.method === 'DELETE') {
        return { success: true };
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.message || "Failed to fetch data");
      return null;
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      setLoading(true);
      // Fetch invoice data
      const pdfBasicDetail = await fetchWithAuth(
        `http://localhost:8000/api/invoices/${invoiceId}/`
      );
      if (!pdfBasicDetail) return;
      // Fetch settings data
      const pdfMainDetails = await fetchWithAuth(
        `http://localhost:8000/api/settings/`
      );
      if (!pdfMainDetails) return;
      setSelectedInvoice({
        ...pdfBasicDetail,
        ...pdfMainDetails // No need for [0] since it's not an array
      });
      // Preload logo
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
      logoImg.src = `http://localhost:8000${pdfMainDetails?.logo || '/media/favicon_cvGw7pn.png'}`;
      logoImg.onload = () => setLogoLoaded(true);
        logoImg.onerror = () => {
          setLogoLoaded(true);
        };
    } catch (err) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to prepare invoice");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const input = pdfRef.current;
    if (!input) {
      toast.error("PDF content not found.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(input, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
        scrollY: -window.scrollY,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
      const margin = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const imgAspectRatio = imgWidth / imgHeight;
      let renderWidth = maxWidth;
      let renderHeight = maxWidth / imgAspectRatio;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = maxHeight * imgAspectRatio;
      }
      const x = margin;
      const y = margin;
      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      const fileName = `${selectedInvoice?.buyer_name || "Client"}-${selectedInvoice?.invoice_number}.pdf`;
      pdf.save(fileName);
      toast.success("Invoice downloaded successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (selectedInvoice && logoLoaded) {
      generatePDF();
    }
  }, [selectedInvoice, logoLoaded]);

  const handleDelete = async (invoiceId) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    // Save previous state for rollback
    const prevInvoices = [...invoices];

    // Optimistically remove the row from UI
    setInvoices((prevInvoices) =>
      prevInvoices.filter((invoice) => invoice.id !== invoiceToDelete)
    );

    setShowDeleteModal(false);
    setInvoiceToDelete(null);

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch(
        `http://localhost:8000/api/delete/${invoiceToDelete}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        toast.success("Invoice deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete invoice");
      }
    } catch (err) {
      // Rollback if failed
      setInvoices(prevInvoices);
      toast.error(err.message || "An error occurred while deleting the invoice", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  // Fetch settings data on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const response = await fetch("http://localhost:8000/api/settings/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch settings");
        const data = await response.json();
        setSettingsData(data[0] || {});
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Add function to fetch exchange rate
  const fetchExchangeRate = useCallback(async (currencyCode) => {
    if (!currencyCode || currencyCode === 'INR') {
      setExchangeRate(1);
      setShowConversion(false);
      return;
    }
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/INR`);
      const data = await response.json();
      const rate = data.rates[currencyCode];
      if (rate) {
        setExchangeRate(1 / rate); // Convert from foreign currency to INR
        setShowConversion(true);
      } else {
        setExchangeRate(1);
        setShowConversion(false);
      }
    } catch (error) {
      setExchangeRate(1);
      setShowConversion(false);
    }
  }, []);

  // Add function to calculate INR equivalent
  const calculateInrEquivalent = (amount) => {
    if (!amount || isNaN(amount)) return 0;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    return numAmount * exchangeRate;
  };

  // Fetch exchange rate when selectedInvoice changes and is foreign
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.currency && selectedInvoice.currency !== 'INR') {
      fetchExchangeRate(selectedInvoice.currency);
    } else {
      setExchangeRate(1);
      setShowConversion(false);
    }
  }, [selectedInvoice, fetchExchangeRate]);

  return (
    <div className="year_container">
      <h2>
        {client ? `${client.buyer_name} - ${client.buyer_gst}` : "All Invoices"}
      </h2>

      <table className="custom-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Buyer Name</th>
            <th>Bill Number</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && invoices.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">
                Loading invoices...
              </td>
            </tr>
          ) : (
            (displayInvoices || []).map((invoice, index) => (
              <tr key={invoice.id}>
                <td>{index + 1}</td>
                <td>{invoice.buyer_name}</td>
                <td>{invoice.invoice_number}</td>
                <td>
                  {invoice.invoice_date
                    ? new Date(invoice.invoice_date).toLocaleDateString("en-GB")
                    : "N/A"}
                </td>
                <td>
                  {invoice.currency}{" "}
                  {parseFloat(invoice.total_with_gst).toFixed(2)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <div className="tooltip-container">
                      <button
                        className="view-button"
                        onClick={() =>
                          navigate(`/invoice-detail/${invoice.id}`, {
                            state: { invoice },
                          })
                        }
                        disabled={loading}
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                      <span className="tooltip-text">View</span>
                    </div>
                    <div className="tooltip-container">
                      <button
                        className="download-button"
                        onClick={() => handleDownload(invoice.id)}
                        disabled={loading}
                      >
                        {loading && selectedInvoice?.id === invoice.id
                          ? "Generating..."
                          : <i className="fa-solid fa-download"></i>}
                      </button>
                      <span className="tooltip-text">Download</span>
                    </div>
                    <div className="tooltip-container">
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(invoice.id)}
                        disabled={loading}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <span className="tooltip-text">Delete</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Hidden Printable Section */}
      {selectedInvoice && (
        <div ref={pdfRef} className="pdf-only" style={{ display: 'none' }}>
          <div style={{ fontSize: "20px" }}>
            <h1 className="text-center"><strong><b>TAX INVOICE</b></strong></h1>
            <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white", padding: "0" }} >
              <div className="row date-tables" style={{ display: "flex" }}>
                <div className="col-6" style={{ flex: 1}}>
                  {/* Seller Info */}
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background">
                          <strong style={{ fontFamily: "Arial, sans-serif" }}>
                            {settingsData.company_name || selectedInvoice.company_name}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px", fontFamily: "Arial, sans-serif", whiteSpace: "pre-line" }}>
                          {settingsData.seller_address || selectedInvoice.seller_address}
                          <br />
                          Email: {settingsData.seller_email || selectedInvoice.seller_email}
                          <br />
                          PAN: {settingsData.seller_pan || selectedInvoice.seller_pan}
                          <br />
                        </td>
                      </tr>
                      <tr>
                        <td className="gray-background">
                          <strong>GSTIN/UIN:</strong>{settingsData.seller_gstin || selectedInvoice.seller_gstin}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Buyer Info */}
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background">
                          <strong>Buyer (Bill to):</strong> {selectedInvoice.buyer_name}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="billToAddress" style={{ width: "100%", minHeight: "100px", height: "auto", whiteSpace: "pre-line",  wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}>
                            {selectedInvoice.buyer_address}
                          </div>
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
                    <tbody>
                      <tr>
                        <td className="gray-background">
                          <strong>Consignee (Ship to):</strong>{selectedInvoice.consignee_name}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="shipToAddress" style={{ width: "100%", minHeight: "100px", height: "auto", whiteSpace: "pre-line",  wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}>
                            {selectedInvoice.consignee_address}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="gray-background">
                          <strong>GSTIN/UIN:</strong>{selectedInvoice.consignee_gst}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-6" style={{ flex: 1, maxWidth: "50%" }}>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td style={{ width: "50%" }}>Invoice No.</td>
                        <td className="invoice-no-td">
                          <span>{selectedInvoice.invoice_number || "Will be generated"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Date</td>
                        <td>
                          <span>{formatDisplayDate(selectedInvoice.invoice_date)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Delivery Note</td>
                        <td>
                          <span>{selectedInvoice.delivery_note}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Mode/Terms of Payment</td>
                        <td>
                          <span>{selectedInvoice.payment_mode}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Delivery Note Date</td>
                        <td>
                          <span>{formatDisplayDate(selectedInvoice.delivery_note_date)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Destination</td>
                        <td>
                          <span>{selectedInvoice.destination}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="table table-bordered black-bordered">
                    <tbody>
                      <tr>
                        <td className="gray-background">
                          <strong>Terms to Delivery:</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="billToAddress" style={{ width: "100%", minHeight: "100px", height: "auto", whiteSpace: "pre-line", border: "1px solid #ccc", borderRadius: "4px", padding: "10px", wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}>
                            {selectedInvoice.Terms_to_delivery}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="relative w-72">
                    <div className="d-flex gap-4">
                      <div style={{ position: "relative", width: "300px" }}>
                        <p><strong>Country and currency:</strong></p>
                        <div className="border border-gray-300 p-2 rounded flex items-center justify-between bg-white" style={{ height: "40px" }}>
                          <div className="flex items-center" style={{ height: "30px" }}>
                            <span className="mr-2">
                              {selectedInvoice.country} - {selectedInvoice.currency} 
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    {selectedInvoice.country !== "India" && (
                      <div className="lut">
                        <p style={{ margin: "0px" }}>Declare under LUT</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: "20px" }}>
                <div className="col-xs-12">
                  <table className="table table-bordered black-bordered" style={{ textAlign: "center" }}>
                    <thead>
                      <tr className="trbody">
                        <th style={{ backgroundColor: "#f1f3f4" }}>SI No.</th>
                        <th style={{ backgroundColor: "#f1f3f4" }}>Particulars</th>
                        <th style={{ backgroundColor: "#f1f3f4" }}>HSN/SAC</th>
                        <th style={{ backgroundColor: "#f1f3f4" }}>Hours</th>
                        <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                        <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: "111px" }}>
                        <td>1</td>
                        <td>
                          {selectedInvoice.Particulars && selectedInvoice.Particulars.split('\n').map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </td>
                        <td style={{ width: "130px", paddingTop: "16px" }}>
                          <span>{selectedInvoice.hsn_code || selectedInvoice.hsn_sac_code}</span>
                        </td>
                        <td style={{ width: "10%" }}>
                          <span>{safeNumber(selectedInvoice.total_hours)}</span>
                        </td>
                        <td style={{ width: "10%" }}>
                          <span>{safeNumber(selectedInvoice.rate)}</span>
                        </td>
                        <td style={{ width: "200px" }}>
                          <span className="currency-sym" style={{ marginRight: "4px", fontSize: "18px" }}>
                            {currencySymbols[selectedInvoice.currency] || selectedInvoice.currency}
                          </span>
                          <span>{safeNumber(selectedInvoice.base_amount)}</span>
                        </td>
                      </tr>
                      {selectedInvoice.country === "India" && selectedInvoice.state !== "Gujarat" && (
                        <tr className="inside-india">
                          <td></td>
                          <td>
                            <span style={{ float: "right" }}>IGST @ 18%</span>
                          </td>
                          <td></td>
                          <td></td>
                          <td>18%</td>
                          <td id="igst">
                            <span className="currency-sym">{currencySymbols[selectedInvoice.currency] || selectedInvoice.currency} </span>
                            {safeNumber(selectedInvoice.igst)}
                          </td>
                        </tr>
                      )}
                      {selectedInvoice.country === "India" && selectedInvoice.state === "Gujarat" && (
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
                              <span className="currency-sym">{currencySymbols[selectedInvoice.currency] || selectedInvoice.currency} </span>
                              {safeNumber(selectedInvoice.cgst)}
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
                              <span className="currency-sym">{currencySymbols[selectedInvoice.currency] || selectedInvoice.currency} </span>
                              {safeNumber(selectedInvoice.sgst)}
                            </td>
                          </tr>
                        </>
                      )}
                      <tr>
                        <td colSpan="6">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ whiteSpace: 'nowrap' }}>
                              {showConversion && (
                                <>
                                  <span className="currency-text">INR</span> {numberToWordsIndian(Math.floor(calculateInrEquivalent(safeNumber(selectedInvoice.total_with_gst))))} Only —
                                  <span className="currency-text">₹</span> {Number(calculateInrEquivalent(safeNumber(selectedInvoice.total_with_gst))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </>
                              )}
                            </div>
                            <div style={{ whiteSpace: 'nowrap', textAlign: 'center', width: "200px" }}>
                              <strong>Total:</strong> &nbsp;
                              <strong id="total-with-gst">
                                <span className="currency-sym">{currencySymbols[selectedInvoice.currency] || selectedInvoice.currency} </span>
                                {safeNumber(selectedInvoice.total_with_gst)}
                              </strong>
                            </div>
                          </div>
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
                        {selectedInvoice.currency} {numberToWordsIndian(Math.floor(safeNumber(selectedInvoice.total_with_gst)))} Only
                      </h4>
                      <div className="top-right-corner">
                        <span>E. & O.E</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {selectedInvoice.country !== "India" ? (
                <div className="row">
                  <div className="col-xs-12 inside-india">
                    <div style={{ fontSize: "24px", textAlign: "center", margin: "0 0 20px 0" }}></div>
                  </div>
                </div>
              ) : selectedInvoice.state === "Gujarat" ? (
                  <div className="row">
                    <div className="col-xs-12 inside-india">
                      <table className="table table-bordered invoice-table">
                        <thead>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Central Tax</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">State Tax</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Total Tax Amount</th>
                          </tr>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{selectedInvoice.hsn_code}</td>
                            <td>{safeNumber(selectedInvoice.base_amount)}</td>
                            <td>9%</td>
                            <td>{safeNumber(selectedInvoice.cgst)}</td>
                            <td>9%</td>
                            <td>{safeNumber(selectedInvoice.sgst)}</td>
                            <td>{safeNumber(selectedInvoice.taxtotal)}</td>
                          </tr>
                          <tr className="total-row">
                            <td>Total</td>
                            <td>{safeNumber(selectedInvoice.base_amount)}</td>
                            <td></td>
                            <td>{safeNumber(selectedInvoice.sgst)}</td>
                            <td></td>
                            <td>{safeNumber(selectedInvoice.sgst)}</td>
                            <td>{safeNumber(selectedInvoice.taxtotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-xs-12 outside-gujarat">
                      <table className="table table-bordered invoice-table">
                        <thead>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">HSN/SAC</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Taxable Value</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} colSpan="2">Integrated Tax</th>
                            <th style={{ backgroundColor: "#f1f3f4" }} rowSpan="2">Total Tax Amount</th>
                          </tr>
                          <tr>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Rate</th>
                            <th style={{ backgroundColor: "#f1f3f4" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{selectedInvoice.hsn_code}</td>
                            <td>{safeNumber(selectedInvoice.base_amount)}</td>
                            <td>18%</td>
                            <td>{safeNumber(selectedInvoice.igst)}</td>
                            <td>{safeNumber(selectedInvoice.taxtotal)}</td>
                          </tr>
                          <tr className="total-row">
                            <td><strong>Total</strong></td>
                            <td><strong>{safeNumber(selectedInvoice.base_amount)}</strong></td>
                            <td></td>
                            <td><strong>{safeNumber(selectedInvoice.igst)}</strong></td>
                            <td><strong>{safeNumber(selectedInvoice.taxtotal)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
              )}
              <div style={{ padding: "0 0 0 10px" }}>
                <div className="col-xs-12 inside-india">
                  <div>
                    <strong>Tax Amount (in words):</strong>
                    <span className="total-tax-in-words">
                      {selectedInvoice.country} {selectedInvoice.currency} {numberToWordsIndian(Math.floor(safeNumber(selectedInvoice.total_with_gst)))} Only
                    </span>
                  </div>
                </div>
                <div className="col-xs-12">
                  <div>
                    <h4>
                      <strong>Remarks:</strong>
                    </h4>
                    <h5 className="html-remark">
                      <span className="remark" style={{ width: "550px" }}>{selectedInvoice.remark}</span>
                    </h5>
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-x-12 mb-3">
                  <div className="hr">
                    <strong>Company's Bank Details</strong>
                    <br />
                    A/c Holder's Name: {settingsData.bank_account_holder || selectedInvoice.bank_account_holder}
                    <br />
                    Bank Name:{settingsData.bank_name || selectedInvoice.bank_name}
                    <br />
                    A/c No.:{settingsData.account_number || selectedInvoice.account_number}
                    <br />
                    IFS Code:{settingsData.ifsc_code || selectedInvoice.ifsc_code}
                    <br />
                    Branch: {settingsData.branch || selectedInvoice.branch}
                    <br />
                    SWIFT Code:{settingsData.swift_code || selectedInvoice.swift_code}
                  </div>
                  <div className="text-right signatory">
                    {(settingsData.logo || selectedInvoice.logo) && (
                      <img
                        src={`http://localhost:8000${settingsData.logo || selectedInvoice.logo}`}
                        alt="Company Logo"
                        className="logo-image"
                      />
                    )}
                    <p>for {settingsData.company_name || selectedInvoice.company_name || 'Grabsolve Infotech'}</p>
                    <p>Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center">This is a Computer Generated Invoice</p>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button
                type="button"
                className="btn-close"
                onClick={cancelDelete}
                aria-label="Close"
              ></button>
            </div>
            <div className="delete-modal-body">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </div>
            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientinvoices;
