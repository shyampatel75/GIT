import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation } from 'react-router-dom';
import "./Taxinvoice.css";

const getCurrentInvoiceYear = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

const Taxinvoice = () => {
  const location = useLocation();

  const [billTo, setBillTo] = useState({ title: "", address: "", gst: "" });
  const [shipTo, setShipTo] = useState({ title: "", address: "", gst: "" });
  const [rate, setRate] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [totalWithGst, setTotalWithGst] = useState(0);
  const [selectedHsn, setSelectedHsn] = useState("9983");
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: "India",
    currency: "₹",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceYear, setInvoiceYear] = useState(getCurrentInvoiceYear());
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [showPdfContent, setShowPdfContent] = useState(false);
  const pdfRef = useRef(null);
  const [date, setDate] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [deliveryNoteDate, setDeliveryNoteDate] = useState("");
  const [destination, setDestination] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [gstConsultancy, setGstConsultancy] = useState("");

  const [invoice_Number, setinvoice_Number] = useState(() => {

    const savedNumber = localStorage.getItem('lastInvoiceNumber');
    return savedNumber ? parseInt(savedNumber) : 1;
  });

  const copyBillToShip = () => {
    setFormData((prev) => ({
      ...prev,
      consignee_name: prev.buyer_name,
      consignee_address: prev.buyer_address,
      consignee_gst: prev.buyer_gst,
    }));
  };

  const formatToISO = (dateStr) => {
    if (!dateStr) return null;

    // If it's already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return null; // Invalid date format

    // If format is DD-MM-YYYY or DD/MM/YYYY
    const [day, month, year] = parts;
    if (!day || !month || !year) return null;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

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


  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/settings/")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setData(data[data.length - 1]);
        }
      })
      .catch((err) => console.error("Error fetching settings", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newYear = getCurrentInvoiceYear();
      setInvoiceYear(newYear);
    }, 1000 * 60 * 60 * 24); // Check daily if the year has changed

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      financial_year: invoiceYear,
    }));
  }, [invoiceYear]);




  // And add this useEffect to sync with the server's latest number on load
  useEffect(() => {
    const fetchLatestInvoiceNumber = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/invoices/next-invoice-number/");
        if (response.ok) {
          const data = await response.json();
          const numericPart = parseInt(data.invoice_number.split('-')[0]);
          // Only update if server has a higher number than we have locally
          setinvoice_Number(prev => Math.max(prev, numericPart || 1));
        }
      } catch (error) {
        console.error("Error verifying invoice number:", error);
      }
    };

    fetchLatestInvoiceNumber();
  }, []);

  const incrementInvoice = () => setInvoiceNumber((prev) => prev + 1);
  const decrementInvoice = () => setInvoiceNumber((prev) => (prev > 1 ? prev - 1 : 1));

  // Use invoiceNumber in your form



  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const thousandUnits = ["", "Thousand", "Lakh", "Crore"];
    if (num === 0) return "Zero";
    let words = "";
    let unitIndex = 0;
    // Handle the integer part of the number
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
          chunkWords +=
            tens[Math.floor(chunk / 10)] +
            (chunk % 10 !== 0 ? " " + ones[chunk % 10] : "");
        }
        words =
          chunkWords.trim() + " " + thousandUnits[unitIndex] + " " + words;
      }
      integerPart = Math.floor(integerPart / 1000);
      unitIndex++;
    }

    // Handle the fractional part (for paisa or cents)
    let decimalPart = Math.round((num - Math.floor(num)) * 100);
    if (decimalPart > 0) {
      words += " and " + numberToWords(decimalPart) + " Paisa";
    }

    return words.trim();
  };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const countryList = data.map((country) => {
          const currencyCode = country.currencies
            ? Object.keys(country.currencies)[0]
            : "";
          const currencySymbol =
            country.currencies?.[currencyCode]?.symbol || "";
          return {
            name: country.name.common,
            currency: currencySymbol,
            flag: country.flags.svg, // Get country flag image
          };
        });
        setCountries(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (selectedCountry) {
      setFormData((prev) => ({
        ...prev,
        country: selectedCountry.name,
        currency: selectedCountry.currency, // ✅ update currency
      }));
    }
  }, [selectedCountry]);


  // Auto calculate values when total_hours or rate changes
  useEffect(() => {
    calculateTotal();
  }, [formData.total_hours, formData.rate, formData.country]);

  // Function to calculate total tax (CGST + SGST)
  const totalTax = (cgstValue, sgstValue) => {
    return cgstValue + sgstValue;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // Update the handleSubmit function
  const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Only validate buyer_name
  if (!formData.buyer_name || formData.buyer_name.trim() === "") {
    alert("Please enter the buyer's name.");
    return;
  }

  // ✅ Format dates if provided (but don't require them)
  const formattedInvoiceDate = formData.invoice_date
    ? formatToISO(formData.invoice_date)
    : "";

  const formattedDeliveryDate = formData.delivery_note_date
    ? formatToISO(formData.delivery_note_date)
    : "";

  if (
    (formData.invoice_date && !formattedInvoiceDate) ||
    (formData.delivery_note_date && !formattedDeliveryDate)
  ) {
    alert("Please enter valid dates in DD-MM-YYYY or YYYY-MM-DD format.");
    return;
  }

  try {
    const fullInvoiceNumber = `${String(invoice_Number).padStart(2, "0")}-${invoiceYear}`;

    const payload = {
      ...formData,
      invoice_number: fullInvoiceNumber,
      invoice_date: formattedInvoiceDate,
      delivery_note_date: formattedDeliveryDate,
      country: selectedCountry.name,
      currency: selectedCountry.currency,
    };

    console.log("Payload being sent:", payload);

    const saveResponse = await fetch("http://localhost:8000/api/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await saveResponse.json();

    if (!saveResponse.ok) {
      console.error("Server validation errors:", responseData);
      const errorMessages = Object.values(responseData.errors || {}).flat().join(", ");
      throw new Error(errorMessages || "Failed to save invoice");
    }

    console.log("Invoice saved successfully:", responseData);

    await generatePDF(fullInvoiceNumber);

    setinvoice_Number(prev => {
      const nextNum = prev + 1;
      localStorage.setItem('lastInvoiceNumber', nextNum.toString());
      return nextNum;
    });

    alert("Invoice created and PDF downloaded successfully!");
  } catch (error) {
    console.error("Invoice processing error:", error);
    alert(`Error: ${error.message}`);
  }
};



  // Update the generatePDF function
  const generatePDF = async (invoiceNumber) => {
    const input = pdfRef.current;
    if (!input) {
      alert("PDF content not found.");
      return;
    }

    const originalVisibility = input.style.visibility;
    input.style.visibility = "visible";

    try {
      const logoImg = input.querySelector("img");
      if (logoImg && !logoImg.complete) {
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
      }

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 2;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const contentWidth = pageWidth - 1 * margin;
      let contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight + margin > pageHeight) {
        contentHeight = pageHeight - margin; // Set bottom padding to 0
      }

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        contentWidth,
        contentHeight
      );

      pdf.save(`Invoice_${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF");
    } finally {
      input.style.visibility = originalVisibility;
    }
  };




  const getNextInvoiceNumber = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/invoices/");
      const data = await res.json();

      // Extract and filter only valid invoice numbers like "01-2025/2026"
      const invoiceNumbers = data
        .map((inv) => inv.invoice_number)
        .filter((num) => num && num.includes("-"))
        .map((num) => {
          const [prefix] = num.split("-");
          return parseInt(prefix, 10);
        });

      const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
      const nextNumber = (maxNumber + 1).toString().padStart(2, "0");

      const year = new Date().getFullYear();
      const currentFinancialYear = `${year}/${year + 1}`;

      const nextInvoiceNumber = `${nextNumber}-${currentFinancialYear}`;

      console.log("Next Invoice Number:", nextInvoiceNumber);
      return nextInvoiceNumber;

    } catch (error) {
      console.error("Failed to get next invoice number:", error);
      return null;
    }
  };


  // Auto calculate total with GST and tax fields
  const calculateTotal = () => {
    const total_hours = parseFloat(formData.total_hours) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const base_amount = total_hours * rate;

    console.log("Base Amount:", base_amount);
    // console.log("Total With GST:", total_with_gst);

    if (formData.country === "India" && base_amount > 0) {
      const tax = (base_amount * 9) / 100;
      const total_with_gst = Math.round(base_amount + 2 * tax);
      console.log("Total With GST after tax:", total_with_gst);

      const total_tax = totalTax(tax, tax); // Calculate CGST + SGST
      setFormData((prev) => ({
        ...prev,
        base_amount,
        cgst: tax,
        sgst: tax,
        taxtotal: total_tax, // Set total tax value
        total_with_gst,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        base_amount,
        cgst: 0,
        sgst: 0,
        taxtotal: 0, // No tax for countries other than India
        total_with_gst: Math.round(base_amount),
      }));
    }
  };

  useEffect(() => {
    calculateTotal(); // Whenever formData.base_amount changes, recalculate
  }, [formData.base_amount]);


  if (!data) return <p className="text-center mt-4">Loading settings...</p>;
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
                        {data.company_name}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
                      {data.seller_address}
                      <br />
                      Email: {data.seller_email}
                      <br />
                      PAN: {data.seller_pan}
                      <br />
                    </td>
                  </tr>
                  <tr >
                    <td className="gray-background">
                      <strong>  GSTIN/UIN:</strong>{data.seller_gstin}
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
                        style={{ border: !formData.buyer_name ? '1px solid red' : '' }}
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
                      />
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
                        value={`${String(invoice_Number).padStart(
                          2,
                          "0"
                        )}-${invoiceYear}`}
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
                        type="date" // ✅ Use "date" for a date picker
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
                        onChange={handleChange}
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
          <div className="row">
            <div className="col-x-12">
              <div className="hr">
                <strong>Company's Bank Details</strong>
                <br />
                A/c Holder's Name: {data.bank_account_holder}
                <br />
                Bank Name:{data.bank_name}
                <br />
                A/c No.:{data.account_number}
                <br />
                IFS Code:{data.ifsc_code}
                <br />
                Branch: {data.branch}
                <br />
                SWIFT Code:{data.swift_code}
              </div>
              <div className="text-right signatory">
                {data.logo && (
                  <img
                    src={`http://127.0.0.1:8000${data.logo}`}
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
      <div
        ref={pdfRef}
        style={{
          // position: "absolute",
          // // top: "-9999px",
          // // left: "-9999px",
          // // visibility: "hidden",
          fontFamily: "Arial, sans-serif",
          color: "#575757"
        }}
        className="bg-white p-4 rounded shadow mt-4"
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
                          Grabsolve Infotech:
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px", height: "150px" }}>
                        {data.seller_address}
                        <br />
                        Email:{data.seller_email}
                        <br />
                        PAN:{data.seller_pan}
                        <br />
                      </td>
                    </tr>
                    <tr>
                      <td className="gray-background">
                        <strong>  GSTIN/UIN:</strong>{data.seller_gstin}
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
                        {" "}
                        {`${String(invoice_Number).padStart(
                          2,
                          "0"
                        )}-${invoiceYear}`}
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

            <div className="row">
              <div className="col-x-12">
                <div className="hr">
                  <strong>Company's Bank Details</strong>
                  <br />
                  A/c Holder's Name: {data.bank_account_holder}
                  <br />
                  Bank Name:{data.bank_name}
                  <br />
                  A/c No.:{data.account_number}
                  <br />
                  IFS Code:{data.ifsc_code}
                  <br />
                  Branch: {data.branch}
                  <br />
                  SWIFT Code:{data.swift_code}
                </div>
                <div className="text-right signatory">
                  {data.logo && (
                    <img
                      src={`http://127.0.0.1:8000${data.logo}`}
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