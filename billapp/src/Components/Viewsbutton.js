import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ViewsButton = () => {
    const { id } = useParams();

    const [invoice, setInvoice] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        // Fetch invoice details
        fetch(`http://127.0.0.1:8000/api/invoices/${id}/`)
            .then((res) => res.json())
            .then((data) => setInvoice(data))
            .catch((err) => console.error("Error fetching invoice:", err));

        // Fetch settings
        fetch("http://127.0.0.1:8000/api/settings/")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setSettings(data[0]); // Use first item from array
                } else {
                    console.error("Settings data is empty or not an array:", data);
                }
            })
            .catch((err) => console.error("Error fetching settings:", err));
    }, [id]);

    if (!invoice || !settings) {
        return <div>Loading invoice and settings...</div>;
    }

    return (
        <div style={{ paddingLeft: "100px" }}>
            <div style={{ paddingRight: "10px" }}>
                <h2 className="text-center">TAX INVOICE</h2>
                <div className="table-bordered black-bordered main-box" style={{backgroundColor:"white"}}>
                    <div className="row date-tables">
                        <div className="col-6">
                            {/* Seller Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong style={{ fontSize: "15px" }}>
                                                Grabsolve Infotech:
                                            </strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        {/* {data.seller_address} */}
                                        {settings.seller_address}
                                        <br />
                                        Email:{settings.seller_email}
                                        <br />
                                        PAN:{settings.seller_pan}
                                        <br />
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>  GSTIN/UIN:</strong>{settings.seller_gstin}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Buyer Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>Buyer (Bill to):</strong>  {invoice.buyer_name}
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
                                            {invoice.buyer_address}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>  GSTIN/UIN:</strong>{invoice.buyer_gst}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Consignee Info */}
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>Consignee (Ship to):</strong> {invoice.consignee_name}
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
                                            {invoice.consignee_address}

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="gray-background">
                                            <strong>  GSTIN/UIN:</strong>{invoice.consignee_gst}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="col-6">
                            <table className="table table-bordered black-bordered">
                                <tbody style={{border: "2px solid"}}>
                                    <tr>
                                        <td style={{ width: "50%" }}>Invoice No.</td>
                                        <td>
                                            {invoice.invoice_number}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Date</td>
                                        <td>{invoice.invoice_date}</td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note</td>
                                        <td>{invoice.delivery_note}</td>
                                    </tr>
                                    <tr>
                                        <td>Mode/Terms of Payment</td>
                                        <td>{invoice.payment_mode}</td>
                                    </tr>
                                    <tr>
                                        <td>Delivery Note Date</td>
                                        <td>{invoice.delivery_note_date}</td>
                                    </tr>
                                    <tr>
                                        <td>Destination</td>
                                        <td>{invoice.destination}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table table-bordered black-bordered">
                                <tbody style={{ width: "100%",border: "2px solid"}}>
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
                                        }}>{invoice.Terms_to_delivery}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="relative w-72">
                                {/* Selected Country (Dropdown Trigger) */}
                                <p>
                                    <strong>Country and currency:</strong>
                                </p>
                                <div
                                    className="border border-gray-300 p-2 rounded flex items-center justify-between cursor-pointer bg-white" >

                                    <div
                                        className="flex items-center"
                                        style={{ height: "30px" }}
                                    >
                                        <span className="mr-2">
                                            {/* {selectedCountry.name} - {selectedCountry.currency} */}
                                            {invoice.country} {invoice.currency}
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
                                    <tr className="trbody" style={{border:"2px solid"}}>
                                        <th>SI No.</th>
                                        <th>Particulars</th>
                                        <th>HSN/SAC</th>
                                        <th>Hours</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody style={{border: "2px solid"}}>
                                    <tr style={{ height: "111px" }}>
                                        <td>1</td>
                                        <td>{invoice.Particulars}</td>
                                        <td style={{ width: "130px" }}>{invoice.hsn_code}</td>
                                        <td style={{ width: "10%" }}>{invoice.total_hours}</td>
                                        <td style={{ width: "10%" }}>{invoice.rate}</td>

                                        <td style={{ width: "200px" }}>
                                            <span className="currency-sym">
                                                {invoice.currency} {invoice.base_amount}
                                            </span>

                                        </td>
                                    </tr>
                                    {invoice.country === "India" && (
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
                                                    <span className="currency-sym">{invoice.currency} {invoice.cgst} </span>

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
                                                    <span className="currency-sym">{invoice.currency} {invoice.sgst}</span>

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
                                                <span className="currency-sym">

                                                </span>
                                                {invoice.currency}   {invoice.total_with_gst}
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
                                        {/* {numberToWords(Math.floor(formData.total_with_gst))} */}
                                    </h4>
                                    <div className="top-right-corner">
                                        <span>E. & O.E</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row">
                        {invoice.country === "India" && (
                            <div className="col-xs-12 inside-india">
                                <table className="table table-bordered invoice-table">
                                    <thead style={{border:"2px solid"}}>
                                        <tr >
                                            <th rowSpan="2">HSN/SAC</th>
                                            <th rowSpan="2">Taxable Value</th>
                                            <th colSpan="2">Central Tax</th>
                                            <th colSpan="2">State Tax</th>
                                            <th colSpan="2" rowSpan="2">
                                                Total Tax Amount
                                            </th>
                                        </tr>
                                        <tr>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{border: "2px solid"}}>
                                        <tr>
                                            <td>
                                                <span className="hns_select_text">{invoice.hsn_code}</span>
                                            </td>
                                            <td className="taxable-value">
                                                {/* {formData.base_amount} */}
                                                {invoice.base_amount}
                                            </td>
                                            <td>9%</td>
                                            <td className="tax-cgst">{invoice.cgst}</td>
                                            <td>9%</td>
                                            <td className="tax-sgst">{invoice.sgst}</td>
                                            <td className="all-tax-amount">{invoice.taxtotal}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td>Total</td>

                                            <td className="total-taxable">
                                                {/* {formData.base_amount} */}
                                                {invoice.base_amount}
                                            </td>
                                            <td></td>
                                            <td className="total-tax-cgst">{invoice.cgst}</td>
                                            <td></td>
                                            <td className="total-tax-sgst">{invoice.sgst}</td>
                                            <td className="total-tax-amount">
                                            {invoice.taxtotal}
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
                                        <span className="currency-text">INR</span>{" "}
                                        {/* {numberToWords(Math.floor(formData.total_with_gst))} */}
                                    </span>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <div>
                                    <h4>
                                        <strong>Remarks:</strong>
                                    </h4>
                                    <h5 className="html-remark">{invoice.remark}</h5>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row">
                        <div className="col-x-12">
                            <div className="hr">
                                <strong>Company's Bank Details</strong>
                                <br />
                                A/c Holder's Name: {settings.seller_name}
                                <br />
                                Bank Name: {settings.bank_name}
                                <br />
                                A/c No.: {settings.account_number}
                                <br />
                                IFS Code: {settings.ifsc_code}
                                <br />
                                Branch: {settings.branch}
                                <br />
                                SWIFT Code: {settings.swift_code}
                            </div>
                            <div className="text-right signatory">
                                {/* {data.logo && (
                    <img
                      src={`http://127.0.0.1:8000${data.logo}`}
                      alt="Company Logo"
                      className="logo-image"
                    />
                  )} */}
                                <img className="logo-image" src={`http://127.0.0.1:8000${settings.logo}`} alt="Logo" height={100} />

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
