import React, { useState, useEffect } from "react";
import "./setting.css";

export default function SettingsPage(props) {
  const defaultData = {
    company_name: "",
    seller_address: "",
    seller_pan: "",
    seller_gstin: "",
    seller_email: "",
    bank_account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    swift_code: "",
    logo: null,
    stampPreview: "",
  };

  const [formData, setFormData] = useState(defaultData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        stampPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "stampPreview") return; // don't send preview
      if (value) formDataToSend.append(key, value);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/api/settings/", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Saved successfully");
        console.log(result);
      } else {
        const errorData = await response.json();
        console.error("Save failed", errorData);
        alert("Save failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving");
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/settings/");
        const data = await response.json();
        const setting = Array.isArray(data) ? data[data.length - 1] : data;

        if (setting) {
          setFormData({
            company_name: setting.company_name || "",
            seller_address: setting.seller_address || "",
            seller_pan: setting.seller_pan || "",
            seller_gstin: setting.seller_gstin || "",
            seller_email: setting.seller_email || "",
            bank_account_holder: setting.bank_account_holder || "",
            bank_name: setting.bank_name || "",
            account_number: setting.account_number || "",
            ifsc_code: setting.ifsc_code || "",
            branch: setting.branch || "",
            swift_code: setting.swift_code || "",
            logo: null,
            stampPreview: setting.logo ? `http://127.0.0.1:8000${setting.logo}` : "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div style={{ paddingLeft: "100px" }}>
      <h1 className="hedding">Your Company Details</h1>
      <div className="formbody">
        <div className="form-box">
          <div className="form-row">
            <div className="fastinput">
              <label>Company name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label>PAN Number</label>
              <input
                type="text"
                name="seller_pan"
                value={formData.seller_pan}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Seller Address</label>
              <textarea
                name="seller_address"
                value={formData.seller_address}
                onChange={handleChange}
                rows={4}
                placeholder="Enter seller address"
              ></textarea>
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>GST Number</label>
              <input
                type="text"
                name="seller_gstin"
                value={formData.seller_gstin}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label>Email</label>
              <input
                type="email"
                name="seller_email"
                value={formData.seller_email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label>Account Number</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label>A/c Holder's Name</label>
              <input
                type="text"
                name="bank_account_holder"
                value={formData.bank_account_holder}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label>Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label>SWIFT Code</label>
              <input
                type="text"
                name="swift_code"
                value={formData.swift_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="upload-container">
              <label>Upload Stamp</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {formData.stampPreview && (
                <div className="upload-preview">
                  <p>Uploaded Logo Preview:</p>
                  <img
                    src={formData.stampPreview}
                    alt="Uploaded Logo"
                    style={{ width: "100px", marginTop: "10px" }}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 updet"
            onClick={handleSave}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
