import React, { useState, useEffect } from "react";
import "./setting.css";
import { useNavigate } from "react-router-dom";

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
    company_code: "",
    HSN_codes: [],
    logo: null,          // Will store File object for new uploads
    logoUrl: "",         // Will store URL for existing/preview images
  });
  const [newHsn, setNewHsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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
        logoUrl: URL.createObjectURL(file),
      }));
    }
  };

  const addHsnCode = () => {
    if (newHsn.trim()) {
      setFormData((prev) => ({
        ...prev,
        HSN_codes: [...prev.HSN_codes, newHsn.trim()],
      }));
      setNewHsn("");
    }
  };

  const removeHsnCode = (index) => {
    setFormData((prev) => ({
      ...prev,
      HSN_codes: prev.HSN_codes.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You need to login first");
      navigate("/login");
      return;
    }

    const formDataToSend = new FormData();
    
    // Append all regular fields
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
    formDataToSend.append("company_code", formData.company_code);
    formDataToSend.append("HSN_codes", JSON.stringify(formData.HSN_codes));

    // Only append logo if it's a new file
    if (formData.logo instanceof File) {
      formDataToSend.append("logo", formData.logo);
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/settings/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(true);
        // Update the form data with the new logo URL if one was returned
        if (result.logo) {
          setFormData(prev => ({
            ...prev,
            logoUrl: `http://127.0.0.1:8000${result.logo}`,
            logo: null // Reset the file object after successful upload
          }));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Save failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("http://127.0.0.1:8000/api/settings/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        let data = await response.json();

        // If no settings exist, create default ones
        if (Array.isArray(data) && data.length === 0) {
          const createResponse = await fetch(
            "http://127.0.0.1:8000/api/settings/",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (!createResponse.ok) {
            throw new Error("Failed to create default settings");
          }

          data = await createResponse.json();
        }

        // Get the settings (handle both array and single object responses)
        const setting = Array.isArray(data) ? data[data.length - 1] : data;

        setFormData({
          company_name: setting.company_name || "Your Company",
          seller_address: setting.seller_address || "Your Address",
          seller_pan: setting.seller_pan || "ABCDE1234F",
          seller_gstin: setting.seller_gstin || "22AAAAA0000A1Z5",
          seller_email: setting.seller_email || "your@email.com",
          bank_account_holder: setting.bank_account_holder || "Your Company",
          bank_name: setting.bank_name || "Bank Name",
          account_number: setting.account_number || "123456789012",
          ifsc_code: setting.ifsc_code || "BANK0001234",
          branch: setting.branch || "Main Branch",
          swift_code: setting.swift_code || "SWFT0001",
          company_code: setting.company_code || "SWFT0001",
          HSN_codes: setting.HSN_codes || [],
          logo: null, // Initialize as null - will only be set when a new file is uploaded
          logoUrl: setting.logo ? `http://127.0.0.1:8000${setting.logo}` : "",
        });
      } catch (error) {
        console.error("Failed to fetch settings", error);
        setError(error.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate, success]); // Added success to dependencies to refetch after save

  return (
    <div style={{ paddingLeft: "100px" }}>
      <h1 className="hedding">Your Company details</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success">Settings saved successfully!</div>
      )}
      <div className="formbody">
        <div className="form-box">
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="fastinput">
              <label className="block text-sm font-medium text-gray-700">
                COMPANY Code:
              </label>
              <input
                type="text"
                name="company_code"
                value={formData.company_code}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="fastinput">
              <div className="formbody">
                <div className="form-row">
                  <label>HSN Codes</label>
                  <div className="hsn-group">
                    <input
                      type="text"
                      value={newHsn}
                      onChange={(e) => setNewHsn(e.target.value)}
                      disabled={loading}
                    />
                    <button className="mb-2" onClick={addHsnCode} disabled={loading}>
                      Add HSN Code
                    </button>
                    {formData.HSN_codes.map((code, index) => (
                      <div key={index} className="hsn-item d-flex align-items-center justify-content-between border rounded p-2 mb-2">
                        <span>{code}</span>
                        <button className="ms-2" onClick={() => removeHsnCode(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="upload-container">
              <div className="upload-input">
                <label className="upload-label">Upload Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="upload-file"
                  disabled={loading}
                />
              </div>
              {formData.logoUrl && (
                <div className="upload-preview">
                  <p className="preview-text">Logo Preview:</p>
                  <img
                    src={formData.logoUrl}
                    alt="Company Logo"
                    className="preview-image"
                  />
                </div>
              )}
            </div>
          </div>
          
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 updet"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}