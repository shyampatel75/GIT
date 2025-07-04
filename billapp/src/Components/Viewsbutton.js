import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Address.css';
// import "./Taxinvoice.css";

// Force browser cache refresh - country flag and company code display improved
const ViewsButton = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [countries, setCountries] = useState([]);
    const countriesRef = useRef([]);
    const [selectedCountry, setSelectedCountry] = useState({
        name: "India",
        currency: "₹",
        currencyCode: "INR",
        flag: "https://flagcdn.com/in.svg"
    });
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState("");

    // Optimized fetchCountries function (from TaxInvoice.js)
    const fetchCountries = async () => {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all");
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
            return countryList;
        } catch (error) {
            return [
                { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
            ];
        }
    };

    // Helper function to get country flag
    const getCountryFlag = (countryName) => {
        if (!countryName || !countriesRef.current || !Array.isArray(countriesRef.current) || countriesRef.current.length === 0) {
            return "https://flagcdn.com/in.svg"; // Default flag
        }
        const country = countriesRef.current.find(c => c.name === countryName);
        return country ? country.flag : "https://flagcdn.com/in.svg"; // Default flag if not found
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

    const fetchStatesForCountry = async (countryName) => {
        try {
            const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ country: countryName }),
            });
            const data = await response.json();
            if (data && data.data && data.data.states) {
                setStates(data.data.states);
            } else {
                setStates([]);
            }
        } catch (error) {
            setStates([]);
        }
    };

    // Fetch countries on mount
    useEffect(() => {
        const getCountries = async () => {
            try {
                const data = await fetchCountries();
                if (data && Array.isArray(data)) {
                    setCountries(data);
                    countriesRef.current = data;
                } else {
                    // Fallback to default countries if API fails
                    const fallbackCountries = [
                        { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
                    ];
                    setCountries(fallbackCountries);
                    countriesRef.current = fallbackCountries;
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
                // Fallback to default countries if API fails
                const fallbackCountries = [
                    { name: "India", currency: "₹", currencyCode: "INR", flag: "https://flagcdn.com/in.svg" }
                ];
                setCountries(fallbackCountries);
                countriesRef.current = fallbackCountries;
            }
        };
        getCountries();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        Promise.all([
            fetch(`http://localhost:8000/api/invoices/${id}/`, { headers }),
            fetch("http://localhost:8000/api/settings/", { headers }),
        ])
            .then(async ([invoiceRes, settingsRes]) => {
                if (!invoiceRes.ok) {
                    const errText = await invoiceRes.text();
                    throw new Error(`Invoice fetch failed: ${errText}`);
                }
                if (!settingsRes.ok) {
                    const errText = await settingsRes.text();
                    throw new Error(`Settings fetch failed: ${errText}`);
                }

                const invoiceData = await invoiceRes.json();
                const settingsData = await settingsRes.json();

                setInvoice(invoiceData);

                // Handle different possible response formats by always taking the first object if it's an array
                const settingsObject = Array.isArray(settingsData) && settingsData.length > 0 ? settingsData[0] : settingsData;

                if (settingsObject && typeof settingsObject === 'object') {
                    setSettings(settingsObject);
                } else {
                    // Initialize with empty/default settings if fetch fails or data is empty
                    setSettings({});
                    throw new Error("Settings data format is invalid or empty");
                }

                setError("");
            })
            .catch((err) => {
                console.error("Error fetching data:", err);
                setError(err.message || "Failed to fetch data");

                // Handle authentication errors
                if (err.message.includes("401") || err.message.includes("403")) {
                    navigate("/login");
                }
            })
            .finally(() => setLoading(false));
    }, [id, navigate]);

    useEffect(() => {
        if (selectedCountry && selectedCountry.name) {
            fetchStatesForCountry(selectedCountry.name);
        } else {
            setStates([]);
            setSelectedState("");
        }
    }, [selectedCountry]);

    // Update selectedCountry and selectedState when invoice data is loaded
    useEffect(() => {
        if (invoice && countries && countries.length > 0) {
            // Update country
            if (invoice.country) {
                const countryData = countries.find(c => c.name === invoice.country);
                if (countryData) {
                    setSelectedCountry({
                        name: countryData.name,
                        currency: countryData.currency,
                        currencyCode: countryData.currencyCode,
                        flag: countryData.flag
                    });
                } else {
                    // Fallback if country not found in countries list
                    setSelectedCountry({
                        name: invoice.country,
                        currency: "₹",
                        currencyCode: invoice.currency || "INR",
                        flag: "https://flagcdn.com/in.svg"
                    });
                }
            }

            // Update state
            if (invoice.state) {
                setSelectedState(invoice.state);
            }
        } else if (invoice && (!countries || countries.length === 0)) {
            // If countries haven't loaded yet, set basic country info from invoice
            if (invoice.country) {
                setSelectedCountry({
                    name: invoice.country,
                    currency: "₹",
                    currencyCode: invoice.currency || "INR",
                    flag: "https://flagcdn.com/in.svg"
                });
            }

            if (invoice.state) {
                setSelectedState(invoice.state);
            }
        }
    }, [invoice, countries]);

    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    if (loading) {
        return <div>Loading invoice and settings...</div>;
    }

    if (error) {
        return (
            <div style={{ color: "red", padding: "20px" }}>
                <h3>Error: {error}</h3>
                <p>Please check the console for more details.</p>
                <button onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    if (!invoice || !settings || !countries || countries.length === 0) {
        return <div>Loading data...</div>;
    }

    // Currency symbol map (copied from TaxInvoice.js)
    const currencySymbols = {
        INR: "₹",
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        // add more as needed
    };
    // Helper for safe number display
    const safeNumber = (value) => {
        if (value === null || value === undefined || isNaN(value) || value === "") return "";
        return value;
    };
    // Helper for date display (copied from TaxInvoice.js)
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    // Indian number to words (copied from TaxInvoice.js)
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

    // --- MAIN RENDER ---
    return (
        <div style={{ paddingLeft: "70px", fontFamily: "Arial, sans-serif" }}>
            <ToastContainer />
            <div style={{ paddingRight: "10px" }} >
                <h1 className="text-center"><strong><b>TAX INVOICE</b></strong></h1>
                <div className="table-bordered black-bordered main-box" style={{ backgroundColor: "white", width: "100%", padding: "0" }} >
                    <div className="row date-tables">
                        <div className="col-6">
                            {/* Seller Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody>
                                    <tr>
                                        <td className="gray-background">
                                            <strong style={{ fontSize: "15px", fontFamily: "Arial, sans-serif" }}>
                                                {settings.company_name}
                                            </strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "10px", fontFamily: "Arial, sans-serif", whiteSpace: "pre-line" }}>
                                            {settings.seller_address}
                                            <br />
                                            Email: {settings.seller_email}
                                            <br />
                                            PAN: {settings.seller_pan}
                                            <br />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>GSTIN/UIN:</strong>{settings.seller_gstin}
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
                                            Name: {invoice.buyer_name}
                                            <br />
                                            Address:
                                            <div className="billToAddress" style={{ width: "100%", minHeight: "100px", height: "auto", whiteSpace: "pre-line", border: "1px solid #ccc", borderRadius: "4px", padding: "10px", wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}>
                                                {invoice.buyer_address}
                                            </div>
                                            <br />
                                            GSTIN/UIN: {invoice.buyer_gst}
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
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Name: {invoice.consignee_name}
                                            <br />
                                            Address:
                                            <div className="shipToAddress" style={{ width: "100%", minHeight: "100px", height: "auto", whiteSpace: "pre-line", border: "1px solid #ccc", borderRadius: "4px", padding: "10px", wordBreak: "break-word", overflowWrap: "break-word", boxSizing: "border-box" }}>
                                                {invoice.consignee_address}
                                            </div>
                                            <br />
                                            GSTIN/UIN: {invoice.consignee_gst}
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
                                            <span>{invoice.invoice_number || "Will be generated"}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Date</td>
                                        <td>
                                            <span>{formatDisplayDate(invoice.invoice_date)}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note</td>
                                        <td>
                                            <span>{invoice.delivery_note}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Mode/Terms of Payment</td>
                                        <td>
                                            <span>{invoice.payment_mode}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note Date</td>
                                        <td>
                                            <span>{formatDisplayDate(invoice.delivery_note_date)}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Destination</td>
                                        <td>
                                            <span>{invoice.destination}</span>
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
                                                {invoice.Terms_to_delivery}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="relative w-72">
                                <div className="d-flex gap-4">
                                    {/* Country Selector (read-only) */}
                                    <div style={{ position: "relative", width: "300px" }}>
                                        <p><strong>Country and currency:</strong></p>
                                        <div className="border border-gray-300 p-2 rounded flex items-center justify-between bg-white" style={{ height: "40px" }}>
                                            <div className="flex items-center" style={{ height: "30px" }}>
                                                <span className="mr-2">
                                                    {invoice.country} - {invoice.currency} {/* currency code */}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* State Selector only if India */}
                                    {invoice.country === "India" && (
                                        <div style={{ position: "relative", width: "300px" }}>
                                            <p><strong>Select State:</strong></p>
                                            <div className="border border-gray-300 p-2 rounded bg-white states">
                                                {invoice.state || "-- Select State --"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4">
                                {invoice.country !== "India" && (
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
                                            {invoice.Particulars && invoice.Particulars.split('\n').map((line, idx) => (
                                                <React.Fragment key={idx}>
                                                    {line}<br />
                                                </React.Fragment>
                                            ))}
                                        </td>
                                        <td style={{ width: "130px", paddingTop: "16px" }}>
                                            <span>{invoice.hsn_code || invoice.hsn_sac_code}</span>
                                        </td>
                                        <td style={{ width: "10%" }}>
                                            <span>{safeNumber(invoice.total_hours)}</span>
                                        </td>
                                        <td style={{ width: "10%" }}>
                                            <span>{safeNumber(invoice.rate)}</span>
                                        </td>
                                        <td style={{ width: "200px" }}>
                                            <span className="currency-sym" style={{ marginRight: "4px", fontSize: "18px" }}>
                                                {currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode}
                                            </span>
                                            <span>{safeNumber(invoice.base_amount)}</span>
                                        </td>
                                    </tr>
                                    {invoice.country === "India" && invoice.state !== "Gujarat" && (
                                        <tr className="inside-india">
                                            <td></td>
                                            <td>
                                                <span style={{ float: "right" }}>IGST @ 18%</span>
                                            </td>
                                            <td></td>
                                            <td></td>
                                            <td>18%</td>
                                            <td id="igst">
                                                <span className="currency-sym">{currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode} </span>
                                                {safeNumber(invoice.igst)}
                                            </td>
                                        </tr>
                                    )}
                                    {invoice.country === "India" && invoice.state === "Gujarat" && (
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
                                                    <span className="currency-sym">{currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode} </span>
                                                    {safeNumber(invoice.cgst)}
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
                                                    <span className="currency-sym">{currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode} </span>
                                                    {safeNumber(invoice.sgst)}
                                                </td>
                                            </tr>
                                        </>
                                    )}
                                    {/* Total row always right aligned */}
                                    {invoice.country === "India" && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'right' }}>
                                                <strong>Total:</strong> &nbsp;
                                                <strong id="total-with-gst">
                                                    <span className="currency-sym">{currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode} </span>
                                                    {safeNumber(invoice.total_with_gst)}
                                                </strong>
                                            </td>
                                        </tr>
                                    )}
                                    {invoice.country !== "India" && invoice.inr_equivalent && (
                                        <tr>
                                            <td colSpan="6">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', padding: '8px 0' }}>
                                                    <span>
                                                        INR {numberToWordsIndian(Math.floor(invoice.inr_equivalent))} Only — ₹{Number(invoice.inr_equivalent).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span>
                                                        Total = {currencySymbols[invoice.currency] || invoice.currency || invoice.currencyCode}{safeNumber(invoice.total_with_gst)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* For foreign invoices, show INR and Total in one line below the table */}

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
                                        {invoice.currency} {numberToWordsIndian(Math.floor(safeNumber(invoice.total_with_gst)))} Only
                                    </h4>
                                    <div className="top-right-corner">
                                        <span>E. & O.E</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {invoice.country !== "India" ? (
                        <div className="row">
                            <div className="col-xs-12 inside-india">
                                <div style={{ fontSize: "24px", textAlign: "center", margin: "0 0 20px 0" }}></div>
                            </div>
                        </div>
                    ) : invoice.state === "Gujarat" ? (
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
                                            <td>{invoice.hsn_code || invoice.hsn_sac_code}</td>
                                            <td>{safeNumber(invoice.base_amount)}</td>
                                            <td>9%</td>
                                            <td>{safeNumber(invoice.cgst)}</td>
                                            <td>9%</td>
                                            <td>{safeNumber(invoice.sgst)}</td>
                                            <td>{safeNumber(invoice.taxtotal)}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td>Total</td>
                                            <td>{safeNumber(invoice.base_amount)}</td>
                                            <td></td>
                                            <td>{safeNumber(invoice.sgst)}</td>
                                            <td></td>
                                            <td>{safeNumber(invoice.sgst)}</td>
                                            <td>{safeNumber(invoice.taxtotal)}</td>
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
                                            <td>{invoice.hsn_code || invoice.hsn_sac_code}</td>
                                            <td>{safeNumber(invoice.base_amount)}</td>
                                            <td>18%</td>
                                            <td>{safeNumber(invoice.igst)}</td>
                                            <td>{safeNumber(invoice.taxtotal)}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>{safeNumber(invoice.base_amount)}</strong></td>
                                            <td></td>
                                            <td><strong>{safeNumber(invoice.igst)}</strong></td>
                                            <td><strong>{safeNumber(invoice.taxtotal)}</strong></td>
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
                                    {invoice.currency} {numberToWordsIndian(Math.floor(safeNumber(invoice.total_with_gst)))} Only
                                </span>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <div>
                                <h4>
                                    <strong>Remarks:</strong>
                                </h4>
                                <h5 className="html-remark">
                                    {invoice.remark}
                                </h5>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-x-12 mb-3">
                            <div className="hr">
                                <strong>Company's Bank Details</strong>
                                <br />
                                A/c Holder's Name: {settings.bank_account_holder}
                                <br />
                                Bank Name:{settings.bank_name}
                                <br />
                                A/c No.:{settings.account_number}
                                <br />
                                IFS Code:{settings.ifsc_code}
                                <br />
                                Branch: {settings.branch}
                                <br />
                                SWIFT Code:{settings.swift_code}
                            </div>
                            <div className="text-right signatory">
                                {settings.logo && (
                                    <img
                                        src={`http://127.0.0.1:8000${settings.logo}`}
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
    );
};

export default ViewsButton;