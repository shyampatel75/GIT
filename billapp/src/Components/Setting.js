import React, { useState, useEffect } from "react";
import "./setting.css";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
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
    logo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file, // assign the file to `logo`
        stampPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("company_name", formData.company_name);
    formDataToSend.append("seller_address", formData.seller_address);
    formDataToSend.append("seller_pan", formData.seller_pan);
    formDataToSend.append("seller_gstin", formData.seller_gstin);
    formDataToSend.append("seller_email", formData.seller_email);
    formDataToSend.append("bank_account_holder", formData.bank_account_holder);
    formDataToSend.append("bank_name", formData.bank_name);
    formDataToSend.append("account_number", formData.account_number);
    formDataToSend.append("ifsc_code", formData.ifsc_code);
    formDataToSend.append("branch", formData.branch);
    formDataToSend.append("swift_code", formData.swift_code);
    if (formData.logo) {
      formDataToSend.append("logo", formData.logo);
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/settings/", {
        method: "POST", // use PUT for update
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

        // If it's a list of settings, pick the latest one
        const setting = Array.isArray(data) ? data[data.length - 1] : data;

        setFormData((prev) => ({
          ...prev,
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
          logo: null, // we won’t set file objects, but we can show preview
          stampPreview: setting.logo ? `http://127.0.0.1:8000${setting.logo}` : "",
        }));
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };

    fetchSettings();
  }, []);
  return (
    <div style={{ paddingLeft: "100px" }}>
      <h1 className="hedding"> Your Company ditels</h1>
      <div className="formbody">
        <div class="form-box">
          <div className="form-row">
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                Company name
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                PAN Number
              </label>
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
              <label htmlFor="seller_address" className="input-label">
                Seller Address
              </label>
              <textarea
                id="seller_address"
                name="seller_address"
                value={formData.seller_address}
                onChange={handleChange}
                className="textarea-field"
                rows={4}
                placeholder="Enter seller address"
              ></textarea>
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                name="seller_gstin"

                value={formData.seller_gstin}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
              />
            </div>

            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                IFSC Code
              </label>
              <input
                type="text"
                name="ifsc_code"
                value={formData.ifsc_code}
                onChange={handleChange}
              />
            </div>

            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                A/c Holder's Name:
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                SWIFT Code:
              </label>
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
              <div className="upload-input">
                <label className="upload-label">
                  Upload Stamp
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="upload-file"
                />
              </div>
              {formData.stampPreview && (
                <div className="upload-preview">
                  <p className="preview-text">Uploaded Logo Preview:</p>
                  <img
                    src={formData.stampPreview}
                    alt="Uploaded Logo"
                    className="preview-image"
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
      <div>
      </div>
    </div>

  );
}
