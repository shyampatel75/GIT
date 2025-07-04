import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Address.css';
import "./Taxinvoice.css";

// Force browser cache refresh - fetchCountries issue fixed
const Address = () => {
  const navigate = useNavigate();
  const printRef = useRef();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isFirstRun = useRef(true);
  const [showConversion, setShowConversion] = useState(false);
  const [countryFlags, setCountryFlags] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);


  const calculateInrEquivalent = (amount) => {
    // Assuming selectedInvoice.currency is either "INR" or "USD"
    if (selectedInvoice?.currency === "USD") {
      // Use current exchange rate or fixed rate if you prefer
      const exchangeRate = 75; // Example rate, replace with actual rate or API call
      return amount * exchangeRate;
    }
    return amount;
  };

  // Auth fetch wrapper
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
      // For DELETE requests, the response might be empty, so we don't try to parse JSON
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

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchWithAuth("http://localhost:8000/api/grouped-invoices/");
      if (data) {
        setInvoices(data);
        // Only show toast if there are invoices
        if (data.length > 0) {
          toast.success("Invoices loaded successfully");
        }
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      // Only show error toast if there's a real error
      if (err.message !== "Failed to fetch") {
        toast.error(err.message || "Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      fetchInvoices();
    }
  }, [fetchInvoices]);

  // Fetch country flags on mount
  useEffect(() => {
    const fetchCountryFlags = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) throw new Error("Failed to fetch country flags");
        const data = await response.json();
        const flags = {};
        data.forEach((country) => {
          if (country.name && country.name.common && country.flags && country.flags.svg) {
            flags[country.name.common] = country.flags.svg;
          }
        });
        setCountryFlags(flags);
      } catch (error) {
        console.error("Error fetching country flags:", error);
      }
    };
    fetchCountryFlags();
  }, []);

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

  const handleDownload = async (invoiceId) => {
    try {
      setLoading(true);
      setError("");

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

      // Set combined data - note: pdfMainDetails is already the object
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
        console.warn("Failed to load logo, using default");
        setLogoLoaded(true); 
      };

    } catch (err) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to prepare invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvoice && logoLoaded) {
      generatePDF();
    }
  }, [selectedInvoice, logoLoaded]);

  const pdfRef = useRef(null);

  const generatePDF = async (invoiceNumber) => {
    const input = pdfRef.current;

    if (!input) {
      toast.error("PDF content not found.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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

      const fileName = `${selectedInvoice?.buyer_name || "Client"}-${selectedInvoice?.invoice_number || invoiceNumber}.pdf`;
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
        },
        countryData: {
          country: invoice?.country || 'India',
          currency: invoice?.currency || 'INR',
          state: invoice?.state || '',
          destination: invoice?.destination || '',
        }
      }
    });
  };

  const handleEdit = (invoice) => {
    navigate(`/edit-invoice/${invoice.id}`, {
      state: {
        isEdit: true,
        fullInvoiceData: invoice,
      },
    });
  };

  const handleDelete = async (invoiceId) => {
    // Optimistically remove the row from UI
    setInvoices((prev) =>
      prev
        .map((group) => ({
          ...group,
          invoices: group.invoices.filter((inv) => inv.id !== invoiceId),
        }))
        .filter((group) => group.invoices.length > 0)
    );

    try {
      const response = await fetchWithAuth(
        `http://localhost:8000/api/delete/${invoiceId}/`,
        { method: "DELETE" }
      );

      // Check if response exists (not null) - this means the request was successful
      if (response !== null) {
        toast.success("Invoice deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        // If response is null, it means there was an error in fetchWithAuth
        toast.error("Failed to delete invoice", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        // Rollback and re-fetch if failed
        fetchInvoices();
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      toast.error("Failed to delete invoice", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Rollback and re-fetch if failed
      fetchInvoices();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Helper functions from TaxInvoice.js for PDF rendering
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
  const currencySymbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };

  return (
    <div className="year_container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        limit={1}  
      />

      {/* Header with New Bill Button */}
      <div className="header-bar">
        <button
          type="button"
          className="new-bill-btn"
          onClick={() => navigate("/tax-invoice")}
          disabled={loading}
        >
          <i className="bi bi-plus-lg"></i> {loading ? "Loading..." : "New Bills"}
        </button>
       
      </div>



      {/* Invoice Table */}
      <table className="custom-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Buyers</th>
            <th>Address</th>
            <th>Invoice No.</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && invoices.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">Loading invoices...</td>
            </tr>
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">No invoices found</td>
            </tr>
          ) : (
            invoices.flatMap((group, groupIndex) =>
              group.invoices.map((invoice, invoiceIndex) => (
                <tr key={invoice.id}>
                  <td>{groupIndex + 1}.{invoiceIndex + 1}</td>
                  <td>{group.buyer_name}</td>
                  <td
                    className="truncate address-hover"
                    title={`Click to copy: ${group.buyer_address}`}
                    onClick={() => {
                      navigator.clipboard.writeText(group.buyer_address);
                      toast.success("Address copied to clipboard");
                    }}
                  >
                    {group.buyer_address.length > 20
                      ? group.buyer_address.slice(0, 20) + "..."
                      : group.buyer_address}
                  </td>
                  <td>{invoice.invoice_number}</td>

                  <td>
                    {invoice.currency} {parseFloat(invoice.total_with_gst).toFixed(2)}
                  </td>
                  <td style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <div className="tooltip-container">
                      <button
                        type="button"
                        className="action-btn view"
                        onClick={() => navigate(`/invoice-detail/${invoice.id}`)}
                        disabled={loading}
                      >
                        <i className="fa-regular fa-eye"></i>
                      </button>
                      <span className="tooltip-text">View</span>
                    </div>

                    <div className="tooltip-container">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(invoice)}
                        disabled={loading}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <span className="tooltip-text">Edit</span>
                    </div>

                    <div className="tooltip-container">
                      <button
                        className="action-btn download"
                        onClick={() => handleDownload(invoice.id)}
                        disabled={loading}
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                      <span className="tooltip-text">Download</span>
                    </div>

                    <div className="tooltip-container">
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          setShowDeleteModal(true);
                          setInvoiceToDelete(invoice.id);
                        }}
                        disabled={loading}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <span className="tooltip-text">Delete</span>
                    </div>
                  </td>
                </tr>
              ))
            )
          )}
        </tbody>
      </table>

      {/* Hidden printable invoice for PDF */}
      {selectedInvoice && (
        <div ref={pdfRef}>
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
                          <strong style={{ fontfamily: "Arial, sans-serif" }}>
                            {selectedInvoice.company_name}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "10px", fontFamily: "Arial, sans-serif", whiteSpace: "pre-line" }}>
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
                          <strong>GSTIN/UIN:</strong>{selectedInvoice.seller_gstin}
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
                              {/* If you want INR conversion for foreign invoices, add here */}
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
                    A/c Holder's Name: {selectedInvoice.bank_account_holder}
                    <br />
                    Bank Name:{selectedInvoice.bank_name}
                    <br />
                    A/c No.:{selectedInvoice.account_number}
                    <br />
                    IFS Code:{selectedInvoice.ifsc_code}
                    <br />
                    Branch: {selectedInvoice.branch}
                    <br />
                    SWIFT Code:{selectedInvoice.swift_code}
                  </div>
                  <div className="text-right signatory">
                    {selectedInvoice.logo && (
                      <img
                        src={`http://localhost:8000${selectedInvoice.logo}`}
                        alt="Company Logo"
                        className="logo-image"
                      />
                    )}
                    <p>for {selectedInvoice.company_name || 'Grabsolve Infotech'}</p>
                    <p>Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center">This is a Computer Generated Invoice</p>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <span className="close-button" onClick={() => setShowDeleteModal(false)}>&times;</span>
            <p>Are you sure you want to delete this invoice?</p>
            <button onClick={() => {
              handleDelete(invoiceToDelete);
              setShowDeleteModal(false);
            }}>Yes</button>
            <button onClick={() => setShowDeleteModal(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Address;