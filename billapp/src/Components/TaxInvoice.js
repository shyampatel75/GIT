import React, { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation, useNavigate } from 'react-router-dom';
import "./Taxinvoice.css";

const getCurrentInvoiceYear = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

const Taxinvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  // State management
  const [formData, setFormData] = useState({
    buyer_name: location.state?.buyerData?.buyer_name || "",
    buyer_address: location.state?.buyerData?.buyer_address || "",
    buyer_gst: location.state?.buyerData?.buyer_gst || "",
    consignee_name: location.state?.consigneeData?.consignee_name || "",
    consignee_address: location.state?.consigneeData?.consignee_address || "",
    consignee_gst: location.state?.consigneeData?.consignee_gst || "",
    invoice_number: "",
    invoice_date: "",
    delivery_note: "",
    payment_mode: "",
    delivery_note_date: "",
    destination: "",
    Terms_to_delivery: "",
    country: "",
    currency: "",
    Particulars: "",
    hsn_code: "9983",
    total_hours: "",
    rate: "",
    base_amount: "",
    cgst: "",
    sgst: "",
    total_with_gst: "",
    taxtotal: "",
    remark: "",
    totalWithGst: "",
    financial_year: getCurrentInvoiceYear(),
  });

  const [selectedHsn, setSelectedHsn] = useState("9983");
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: "India",
    currency: "₹",

  });
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceYear, setInvoiceYear] = useState(getCurrentInvoiceYear());
  // const [invoice_Number, setinvoice_Number] = useState(() => {
  //   const savedNumber = localStorage.getItem('lastInvoiceNumber');
  //   return savedNumber ? parseInt(savedNumber) : 1;
  // });
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Helper functions
  const formatToISO = (dateStr) => {
    if (!dateStr) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return null;
  };

  const copyBillToShip = () => {
    setFormData(prev => ({
      ...prev,
      consignee_name: prev.buyer_name,
      consignee_address: prev.buyer_address,
      consignee_gst: prev.buyer_gst,
    }));
  };

  // Fetch data functions with authentication
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/settings/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.length > 0) {
        setSettingsData(data[data.length - 1]);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load company settings");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const countryList = data.map((country) => {
        const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : "";
        const currencySymbol = country.currencies?.[currencyCode]?.symbol || "";
        return {
          name: country.name.common,
          currency: currencySymbol,
          currencyCode: currencyCode,
          flag: country.flags?.svg
        };
      }).filter(country => country.currencyCode);

      countryList.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(countryList);
    } catch (error) {
      console.error("Error fetching countries:", error);
      const fallbackCountries = [
        { name: "India", currency: "₹", currencyCode: "INR" },
        { name: "United States", currency: "$", currencyCode: "USD" },
        { name: "United Kingdom", currency: "£", currencyCode: "GBP" },
        { name: "European Union", currency: "€", currencyCode: "EUR" },
        { name: "Japan", currency: "¥", currencyCode: "JPY" }
      ];
      setCountries(fallbackCountries);
    }
  }, []);


  // Modify your fetchNextInvoiceNumber function
  const fetchNextInvoiceNumber = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/get_next_invoice_number/", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setNextInvoiceNumber(data.invoice_number);
      setFormData(prev => ({
        ...prev,
        invoice_number: data.invoice_number,
        financial_year: data.financial_year
      }));

    } catch (error) {
      console.error("Error fetching next invoice number:", error);
      // Fallback to manual numbering if API fails
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const financialYear = `${currentYear}/${nextYear}`;
      const fallbackNumber = `01-${financialYear}`;

      setNextInvoiceNumber(fallbackNumber);
      setFormData(prev => ({
        ...prev,
        invoice_number: fallbackNumber,
        financial_year: financialYear
      }));
    }
  }, []);


  // Effects
  useEffect(() => {
    fetchNextInvoiceNumber();
    fetchCountries();
    fetchSettings();
    // fetchLatestInvoiceNumber();

    const interval = setInterval(() => {
      const newYear = getCurrentInvoiceYear();
      setInvoiceYear(newYear);
    }, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, [fetchNextInvoiceNumber, fetchCountries, fetchSettings,]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      financial_year: invoiceYear,
    }));
  }, [invoiceYear]);

  useEffect(() => {
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        country: selectedCountry.name,
        currency: selectedCountry.currencyCode,
      }));
    }
  }, [selectedCountry]);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.currencyCode.toLowerCase().includes(search.toLowerCase())
  );

  // Handlers
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update handleChange function
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // GST validation
    if (name === 'buyer_gst' || name === 'consignee_gst') {
      if (value && value.length !== 15) {
        setError('GST number must be exactly 15 digits');
        setTimeout(() => setError(''), 3000);
      }
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

  const calculateTotal = useCallback(() => {
    const total_hours = parseFloat(formData.total_hours) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const base_amount = parseFloat(formData.base_amount);

    let calculatedBaseAmount;
    if (total_hours > 0 && rate > 0) {
      // Calculate from hours and rate
      calculatedBaseAmount = total_hours * rate;
    } else {
      // Use directly entered base amount
      calculatedBaseAmount = base_amount;
    }

    if (selectedCountry.name === "India" && calculatedBaseAmount > 0) {
      const tax = (calculatedBaseAmount * 9) / 100;
      const total_with_gst = Math.round(calculatedBaseAmount + 2 * tax);
      const total_tax = tax * 2;

      setFormData(prev => ({
        ...prev,
        base_amount: calculatedBaseAmount,
        cgst: tax,
        sgst: tax,
        taxtotal: total_tax,
        total_with_gst,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        base_amount: calculatedBaseAmount,
        cgst: 0,
        sgst: 0,
        taxtotal: 0,
        total_with_gst: Math.round(calculatedBaseAmount) || 0,
      }));
    }
  }, [formData.total_hours, formData.rate, formData.base_amount, selectedCountry.name]);


  const handleBaseAmountChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset hours and rate when manually entering base amount
      ...(name === "base_amount" && value && {
        total_hours: "",
        rate: ""
      })
    }));

    // Only recalculate if we're changing base_amount directly
    if (name === "base_amount") {
      const base_amount = parseFloat(value);
      if (selectedCountry.name === "India" && base_amount > 0) {
        const tax = (base_amount * 9) / 100;
        const total_with_gst = Math.round(base_amount + 2 * tax);
        const total_tax = tax * 2;

        setFormData(prev => ({
          ...prev,
          base_amount,
          cgst: tax,
          sgst: tax,
          taxtotal: total_tax,
          total_with_gst,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          base_amount,
          cgst: 0,
          sgst: 0,
          taxtotal: 0,
          total_with_gst: Math.round(base_amount),
        }));
      }
    }
  };

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const toBase64 = (url) =>
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });


  // Modify the handleSubmit function to include PDF generation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submission
    // if (isSubmitted) {
    //   setError('Invoice already generated. Please modify data to generate again.');
    //   setTimeout(() => setError(''), 3000);
    //   return;
    // }

    // GSTIN length check
    if (
      (formData.buyer_gst && formData.buyer_gst.length !== 15) ||
      (formData.consignee_gst && formData.consignee_gst.length !== 15)
    ) {
      setError('GST number must be exactly 15 digits');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Hours/Rate validation for India
    if (selectedCountry.name === "India") {
      const hasHoursRate = formData.total_hours && formData.rate;
      const hasBaseAmount = formData.base_amount;

      if (!hasHoursRate && !hasBaseAmount) {
        setError('Please provide either Hours and Rate or Base Amount');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (!hasBaseAmount && (!formData.total_hours || !formData.rate)) {
        setError('Both Hours and Rate must be entered');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Format dates
      const formattedInvoiceDate = formatToISO(formData.invoice_date);
      const formattedDeliveryDate = formData.delivery_note_date
        ? formatToISO(formData.delivery_note_date)
        : null;

      if (!formattedInvoiceDate) {
        throw new Error("Please enter a valid invoice date in DD-MM-YYYY or YYYY-MM-DD format.");
      }

      // Helper for number conversion
      const prepareNumericField = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      // Calculate base amount
      let base_amount;
      if (formData.total_hours && formData.rate) {
        base_amount = parseFloat(formData.total_hours) * parseFloat(formData.rate);
      } else if (formData.base_amount) {
        base_amount = parseFloat(formData.base_amount);
      } else {
        throw new Error("Please provide either (total hours + rate) OR base amount");
      }

      // Final payload - only include fields needed for PDF generation
    const payload = {
      buyer_name: formData.buyer_name,
      buyer_address: formData.buyer_address,
      buyer_gst: formData.buyer_gst,
      consignee_name: formData.consignee_name,
      consignee_address: formData.consignee_address,
      consignee_gst: formData.consignee_gst,
      invoice_number: formData.invoice_number, // Use existing number
      invoice_date: formattedInvoiceDate,
      delivery_note: formData.delivery_note,
      payment_mode: formData.payment_mode,
      delivery_note_date: formattedDeliveryDate,
      destination: formData.destination,
      Terms_to_delivery: formData.Terms_to_delivery,
      country: selectedCountry.name,
      currency: selectedCountry.currencyCode,
      Particulars: formData.Particulars,
      hsn_code: formData.hsn_code,
      total_hours: prepareNumericField(formData.total_hours),
      rate: prepareNumericField(formData.rate),
      base_amount,
      cgst: prepareNumericField(formData.cgst),
      sgst: prepareNumericField(formData.sgst),
      taxtotal: prepareNumericField(formData.taxtotal),
      total_with_gst: prepareNumericField(formData.total_with_gst),
      remark: formData.remark,
      financial_year: formData.financial_year,
    };

         // Only create new invoice if this is the first submission
    if (!isSubmitted) {
      const response = await fetch("http://localhost:8000/api/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessages = Object.values(responseData.errors || {}).flat().join(", ");
        throw new Error(errorMessages || "Failed to save invoice");
      }

      setIsSubmitted(true);
      setFormData(prev => ({
        ...prev,
        invoice_number: responseData.invoice_number
      }));
    }

      // Generate PDF with the invoice number from backend
      await generatePDF(formData.invoice_number);

      // Reset form after success (optional)
      // setFormData((prev) => ({
      //   ...prev,
      //   invoice_date: '',
      //   delivery_note_date: '',
      //   total_hours: '',
      //   rate: '',
      //   base_amount: '',
      //   cgst: '',
      //   sgst: '',
      //   taxtotal: '',
      //   total_with_gst: '',
      //   remark: '',
      // }));

    } catch (err) {
      console.error("Invoice processing error:", err);
      setError(err.message || "An error occurred while processing the invoice");
    } finally {
      setLoading(false);
    }
  };

 const generatePDF = async (invoiceNumber) => {
  const input = pdfRef.current;

  if (!input) {
    setError("PDF content not found.");
    return;
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DOM updates

    const canvas = await html2canvas(input, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: true,
      scrollY: -window.scrollY,
      width: input.offsetWidth,
      height: input.offsetHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const margin = 10; // 10mm margin
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const availableWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * availableWidth) / canvas.width;

    // If image height fits on one page, center it vertically
    const imgY = imgHeight < (pageHeight - 2 * margin)
      ? (pageHeight - imgHeight) / 2
      : margin;

    pdf.addImage(imgData, "PNG", margin, imgY, availableWidth, imgHeight);
    pdf.save(`Invoice_${invoiceNumber}.pdf`);
    setSuccess("Invoice downloaded successfully!");
  } catch (error) {
    console.error("PDF generation error:", error);
    setError("Failed to generate PDF");
  } 
};


  if (!settingsData) return <p className="text-center mt-4">Loading settings...</p>;

  return (
    <div style={{ paddingLeft: "70px", fontFamily: "Arial, sans-serif" }} onSubmit={handleSubmit}>
      <div style={{ paddingRight: "10px" }}>
        <h2 className="text-center">TAX INVOICE</h2>

        <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white" }}>
          <div className="row date-tables">
            <div className="col-6">
              {/* Seller Info */}
              <table className="table table-bordered black-bordered" >
                <tbody>
                  <tr>
                    <td className="gray-background" >
                      <strong style={{ fontSize: "15px", fontfamily: "Arial, sans-serif" }}>
                        {settingsData.company_name}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
                      {settingsData.seller_address}
                      <br />
                      Email: {settingsData.seller_email}
                      <br />
                      PAN: {settingsData.seller_pan}
                      <br />
                    </td>
                  </tr>
                  <tr >
                    <td className="gray-background">
                      <strong>  GSTIN/UIN:</strong>{settingsData.seller_gstin}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Buyer Info */}
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Buyer (Bill to):</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:{" "}
                      <input
                        type="text"
                        name="buyer_name"
                        className="billToTitle"
                        value={formData.buyer_name}
                        onChange={handleChange}
                        required
                      />
                      <br />
                      Address:
                      <textarea
                        type="text"
                        name="buyer_address"
                        className="billToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.buyer_address}
                        onChange={handleChange}
                      />
                      <br />
                      GSTIN/UIN:{" "}

                      <input
                        type="text"
                        name="buyer_gst"
                        className="billToGST"
                        value={formData.buyer_gst}
                        onChange={handleChange}
                        maxLength={15}
                        pattern="\d{15}"
                        title="15 digit GST number required"
                      />

                      {error && (
                        <div className="toast-error">
                          {error}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Consignee Info */}
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td className="gray-background">
                      <strong>Consignee (Ship to):</strong>
                      <button
                        className="copybutton"
                        style={{ float: "right" }}
                        onClick={copyBillToShip}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Name:{" "}
                      <input
                        type="text"
                        name="consignee_name"
                        className="shipToTitle"
                        value={formData.consignee_name}
                        onChange={handleChange}
                      />
                      <br />
                      Address:
                      <textarea
                        name="consignee_address"
                        className="shipToAddress"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.consignee_address}
                        onChange={handleChange}
                      />
                      <br />
                      GSTIN/UIN:{" "}
                      <input
                        type="text"
                        name="consignee_gst"
                        className="shipToGST"
                        value={formData.consignee_gst}
                        onChange={handleChange}
                        maxLength={15}
                        pattern="\d{15}"
                        title="15 digit GST number required"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="col-6">
              <table className="table table-bordered black-bordered">
                <tbody>
                  <tr>
                    <td style={{ width: "50%" }}>Invoice No.</td>
                    <td className="invoice-no-td">
                      <input
                        type="text"
                        style={{ width: "75%", margin: "1px 5px 1px 5px" }}
                        name="invoice_number"
                        className="invoice_Number"
                        value={formData.invoice_number || "Will be generated"}
                        readOnly
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>
                      <input
                        type="date"
                        id="datePicker"
                        value={formData.invoice_date}
                        onChange={handleChange}
                        name="invoice_date"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Delivery Note</td>
                    <td>
                      <input
                        type="text"
                        className="deliveryNote"
                        value={formData.delivery_note}
                        onChange={handleChange}
                        name="delivery_note"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Mode/Terms of Payment</td>
                    <td>
                      <input
                        type="text"
                        className="deliveryNote"
                        value={formData.payment_mode}
                        onChange={handleChange}
                        name="payment_mode"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Delivery Note Date</td>
                    <td>
                      <input
                        type="date"
                        name="delivery_note_date"
                        className="deliveryNote"
                        value={formData.delivery_note_date}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td>Destination</td>
                    <td>
                      <input
                        type="text"
                        name="destination"
                        className="deliveryNote"
                        value={formData.destination}
                        onChange={handleChange}
                      />
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
                      <textarea
                        className="billToAddress"
                        name="Terms_to_delivery"
                        style={{ width: "100%", height: "100px" }}
                        value={formData.Terms_to_delivery}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="relative w-72">
                {/* Selected Country (Dropdown Trigger) */}
                <p>
                  <strong>Country and currency:</strong>
                </p>
                <div
                  className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="flex items-center" style={{ height: "30px" }}>
                    <span className="mr-2">
                      {selectedCountry.name} - {selectedCountry.currency}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
                    <input
                      type="text"
                      className="w-full p-2 border-b border-gray-200 focus:outline-none"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Country List */}
                    <ul
                      className="overflow-y-auto list-group"
                      style={{ height: "200px" }}
                    >
                      {filteredCountries.map((country, index) => (
                        <li
                          key={index}
                          className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsOpen(false);
                            setSearch(""); // Clear search after selection
                          }}
                        >
                          {country.name} - {country.currency}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Keep "Declare under LUT" separate, so it doesn't slide when dropdown opens */}
              <div className="mt-4 ">
                {selectedCountry.name !== "India" && (
                  <div className="lut">
                    <p style={{ margin: "0px" }}>Declare under LUT</p>
                  </div>
                )}
              </div>

              <input type="hidden" id="currencyTitle" value="INR" />
              <input type="hidden" id="currencySymbol" value="₹" />
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12">
              <table className="table table-bordered black-bordered" style={{ textAlign: "center" }}>
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
                <tbody>
                  <tr style={{ height: "111px" }}>
                    <td>1</td>
                    <td>
                      <input
                        name="Particulars"
                        id="gstConsultancy"
                        value={formData.Particulars}
                        onChange={handleChange}
                        type="text"
                      />
                    </td>
                    <td style={{ width: "130px", paddingTop: "16px" }}>
                      <select
                        name="hsn_code"
                        id="hns_select"
                        onChange={handleSelectChange}
                        value={formData.hsn_code}
                        style={{ height: "46px" }}
                      >
                        <option value="9983">9983</option>
                        <option value="8523">8523</option>
                      </select>
                    </td>

                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="total_hours"
                        value={formData.total_hours}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData(prev => ({
                            ...prev,
                            base_amount: ""
                          }));
                          calculateTotal();
                        }}
                      />
                    </td>

                    <td style={{ width: "10%" }}>
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData(prev => ({
                            ...prev,
                            base_amount: ""
                          }));
                          calculateTotal();
                        }}
                      />
                    </td>

                    <td style={{ width: "200px" }}>
                      <span className="currency-sym">
                        {selectedCountry.currency}
                      </span>
                      <input
                        style={{ width: "80%" }}
                        id="baseAmount"
                        name="base_amount"
                        type="number"
                        value={formData.base_amount}
                        onChange={handleBaseAmountChange}
                        readOnly={formData.total_hours > 0 && formData.rate > 0}
                      />
                    </td>
                  </tr>
                  {selectedCountry.name === "India" && (
                    <tr className="inside-india">
                      <td></td>
                      <td>
                        <span style={{ float: "right" }}>CGST @ 9%</span>
                      </td>
                      <td></td>
                      <td></td>
                      <td>9%</td>
                      <td id="cgst">
                        <span className="currency-sym">{selectedCountry.currency}  </span>
                        {formData.cgst}
                      </td>
                    </tr>
                  )}

                  {selectedCountry.name === "India" && (
                    <tr className="inside-india">
                      <td></td>
                      <td>
                        <span style={{ float: "right" }}>SGST @ 9%</span>
                      </td>
                      <td></td>
                      <td></td>
                      <td>9%</td>
                      <td id="sgst">
                        <span className="currency-sym">{selectedCountry.currency} </span>
                        {formData.sgst}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="5" className="text-right">
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong id="total-with-gst">
                        <span className="currency-sym">
                          {selectedCountry.currency}
                        </span>
                        {formData.total_with_gst}
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
                    <span className="currency-text">INR</span>{" "}
                    {numberToWords(Math.floor(formData.total_with_gst))}
                  </h4>
                  <div className="top-right-corner">
                    <span>E. & O.E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedCountry.name === "India" && (
            <div className="row">
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
                  <tbody>
                    <tr>
                      <td>
                        <span className="hns_select_text">{formData.hsn_code}</span>
                      </td>
                      <td className="taxable-value">{formData.base_amount}</td>
                      <td>9%</td>
                      <td className="tax-cgst">{formData.cgst}</td>
                      <td>9%</td>
                      <td className="tax-sgst">{formData.sgst}</td>
                      <td className="all-tax-amount">{formData.taxtotal}</td>
                    </tr>
                    <tr className="total-row">
                      <td>Total</td>
                      <td className="total-taxable">{formData.base_amount}</td>
                      <td></td>
                      <td className="total-tax-cgst">{formData.cgst}</td>
                      <td></td>
                      <td className="total-tax-sgst">{formData.sgst}</td>
                      <td className="total-tax-amount">{formData.taxtotal}</td>
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
                  <span className="currency-text">INR</span>{" "}
                  {numberToWords(Math.floor(formData.total_with_gst))}
                </span>
              </div>
            </div>
            <div className="col-xs-12">
              <div>
                <h4>
                  <strong>Remarks:</strong>
                </h4>
                <h5 className="html-remark">
                  <input
                    name="remark"
                    type="text"
                    value={formData.remark}
                    onChange={handleChange}
                    className="remark"
                    style={{ width: "550px" }}
                  />
                </h5>
              </div>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-x-12 mb-3">
              <div className="hr">
                <strong>Company's Bank Details</strong>
                <br />
                A/c Holder's Name: {settingsData.bank_account_holder}
                <br />
                Bank Name:{settingsData.bank_name}
                <br />
                A/c No.:{settingsData.account_number}
                <br />
                IFS Code:{settingsData.ifsc_code}
                <br />
                Branch: {settingsData.branch}
                <br />
                SWIFT Code:{settingsData.swift_code}
              </div>
              <div className="text-right signatory">
                {settingsData.logo && (
                  <img
                    src={`http://127.0.0.1:8000${settingsData.logo}`}
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

      {/* --------------------------------------------pdf------------------------------------------------------ */}
      {/* <div
        ref={pdfRef}
        style={{ position: "absolute", left: "-9999px" }}
        
      > */}
      <div
        ref={pdfRef}
        style={{
          position: 'absolute',
          left: '-9999px',
        
        }}
        // style={{ position: "absolute", left: "-9999px" }}
      >
        <div style={{ paddingRight: "10px" }}>
          <h2 className="text-center">TAX INVOICE</h2>
          <div className="table-bordered black-bordered main-box">
            <div className="row date-tables">
              <div className="col-6">
                {/* Seller Info */}
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background">
                        <strong style={{ fontSize: "15px" }}>
                          {settingsData.company_name}:
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px", height: "150px" }}>
                        {settingsData.seller_address}
                        <br />
                        Email:{settingsData.seller_email}
                        <br />
                        PAN:{settingsData.seller_pan}
                        <br />
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background">
                        <strong>  GSTIN/UIN:</strong>{settingsData.seller_gstin}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Buyer Info */}
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background">
                        <strong>Buyer (Bill to):</strong>{formData.buyer_name}
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
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {formData.buyer_address}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background">
                        <strong>  GSTIN/UIN:</strong>{formData.buyer_gst}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Consignee Info */}
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td className="gray-background">
                        <strong>Consignee (Ship to):</strong>{formData.consignee_name}
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
                        <div>
                          {formData.consignee_address}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background">
                        <strong>  GSTIN/UIN:</strong>{formData.buyer_gst}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-6">
                <table className="table table-bordered black-bordered">
                  <tbody>
                    <tr>
                      <td style={{ width: "50%" }}>Invoice No.</td>
                      <td>
                        {formData.invoice_number}
                      </td>
                    </tr>
                    <tr>
                      <td>Date</td>
                      <td>{formData.invoice_date}</td>
                    </tr>
                    <tr>
                      <td>Delivery Note</td>
                      <td>{formData.delivery_note}</td>
                    </tr>
                    <tr>
                      <td>Mode/Terms of Payment</td>
                      <td>{formData.payment_mode}</td>
                    </tr>
                    <tr>
                      <td>Delivery Note Date</td>
                      <td>{formData.delivery_note_date}</td>
                    </tr>
                    <tr>
                      <td>Destination</td>
                      <td>{formData.destination}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="table table-bordered black-bordered">
                  <tbody style={{ width: "100%" }}>
                    <tr>
                      <td className="gray-background" >
                        <strong>Terms to Delivery:</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        maxWidth: "250px",
                        overflowWrap: "break-word",
                        height: "150px",
                      }}>{formData.Terms_to_delivery}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="relative w-72">
                  {/* Selected Country (Dropdown Trigger) */}
                  <p>
                    <strong>Country and currency:</strong>
                  </p>
                  <div
                    className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <div
                      className="flex items-center"
                      style={{ height: "30px" }}
                    >
                      <span className="mr-2">
                        {selectedCountry.name} - {selectedCountry.currency}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute bg-white border border-gray-300 w-full mt-1 rounded shadow-lg z-10">
                      <input
                        type="text"
                        className="w-full p-2 border-b border-gray-200 focus:outline-none"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />

                      {/* Country List */}
                      <ul
                        className="overflow-y-auto list-group"
                        style={{ height: "200px" }}
                      >
                        {filteredCountries.map((country, index) => (
                          <li
                            key={index}
                            className="p-2 flex items-center hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedCountry(country);
                              setIsOpen(false);
                              setSearch(""); // Clear search after selection
                            }}
                          >
                            {country.name} - {country.currency}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Keep "Declare under LUT" separate, so it doesn't slide when dropdown opens */}
                <div className="mt-4 ">
                  {selectedCountry.name !== "India" && (
                    <div className="lut">
                      <p style={{ margin: "0px" }}>Declare under LUT</p>
                    </div>
                  )}
                </div>

                <input type="hidden" id="currencyTitle" value="INR" />
                <input type="hidden" id="currencySymbol" value="₹" />
              </div>
            </div>

            <div className="row">
              <div className="col-xs-12">
                <table className="table table-bordered black-bordered" style={{ textAlign: "center" }}>
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

                  <tbody>
                    <tr style={{ height: "130px" }}>
                      <td>1</td>
                      <td>{formData.Particulars}</td>
                      <td style={{ width: "130px" }}>{formData.hsn_code}</td>
                      <td style={{ width: "10%" }}>{formData.total_hours}</td>

                      <td style={{ width: "10%" }}>{formData.rate}</td>

                      <td style={{ width: "200px" }}>
                        <span className="currency-sym">
                          {selectedCountry.currency}
                        </span>
                        {formData.base_amount}
                      </td>
                    </tr>
                    {selectedCountry.name === "India" && (
                      <tr className="inside-india">
                        <td></td>
                        <td>
                          <span style={{ float: "right" }}>CGST @ 9%</span>
                        </td>
                        <td></td>
                        <td></td>
                        <td>9%</td>
                        <td id="cgst">
                          <span className="currency-sym">₹</span>
                          {formData.cgst}
                        </td>
                      </tr>
                    )}

                    {selectedCountry.name === "India" && (
                      <tr className="inside-india">
                        <td></td>
                        <td>
                          <span style={{ float: "right" }}>SGST @ 9%</span>
                        </td>
                        <td></td>
                        <td></td>
                        <td>9%</td>
                        <td id="sgst">
                          <span className="currency-sym">₹</span>
                          {formData.sgst}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="5" className="text-right">
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong id="total-with-gst">
                          <span className="currency-sym">
                            {selectedCountry.currency}
                          </span>{" "}
                          {formData.total_with_gst}
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
                      <span className="currency-text">INR</span>{" "}
                      {numberToWords(Math.floor(formData.total_with_gst))}
                    </h4>
                    <div className="top-right-corner">
                      <span>E. & O.E</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedCountry.name === "India" && (
              <div className="row">
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
                    <tbody>
                      <tr>
                        <td>
                          <span className="hns_select_text">{formData.hsn_code}</span>
                        </td>
                        <td className="taxable-value">
                          {formData.base_amount}
                        </td>
                        <td>9%</td>
                        <td className="tax-cgst">{formData.cgst}</td>
                        <td>9%</td>
                        <td className="tax-sgst">{formData.sgst}</td>
                        <td className="all-tax-amount">{formData.taxtotal}</td>
                      </tr>
                      <tr className="total-row">
                        <td>Total</td>

                        <td className="total-taxable">
                          {formData.base_amount}
                        </td>
                        <td></td>
                        <td className="total-tax-cgst">{formData.cgst}</td>
                        <td></td>
                        <td className="total-tax-sgst">{formData.sgst}</td>
                        <td className="total-tax-amount">
                          {formData.taxtotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "0 0 0 10px" }}>
                  <div className="col-xs-12 inside-india">
                    <div>
                      <strong>Tax Amount (in words):</strong>
                      <span className="total-tax-in-words">
                        <span className="currency-text">INR</span>{" "}
                        {numberToWords(Math.floor(formData.total_with_gst))}
                      </span>
                    </div>
                  </div>
                  <div className="col-xs-12">
                    <div>
                      <h4>
                        <strong>Remarks:</strong>
                      </h4>
                      <h5 className="html-remark">{formData.remark}</h5>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row mb-3">
              <div className="col-x-12 mb-3">
                <div className="hr">
                  <strong>Company's Bank Details</strong>
                  <br />
                  A/c Holder's Name: {settingsData.bank_account_holder}
                  <br />
                  Bank Name:{settingsData.bank_name}
                  <br />
                  A/c No.:{settingsData.account_number}
                  <br />
                  IFS Code:{settingsData.ifsc_code}
                  <br />
                  Branch: {settingsData.branch}
                  <br />
                  SWIFT Code:{settingsData.swift_code}
                </div>
                <div className="text-right signatory">
                  {settingsData.logo && (
                    <img
                      src={`http://127.0.0.1:8000${settingsData.logo}`}
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
          <p className="text-center" style={{ marginBottom: "0px" }}>This is a Computer Generated Invoice</p>
        </div>
      </div>
      <div className="pdfbutton">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Taxinvoice;