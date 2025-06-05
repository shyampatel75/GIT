import React, { useState, useEffect, useRef } from "react";

const BankAdd = () => {
  const [showForm, setShowForm] = useState(false);
  const [banks, setBanks] = useState([]);
  const [deletedBanks, setDeletedBanks] = useState([]);
  const [editingBank, setEditingBank] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    amount: "",
  });
  const toastRef = useRef();

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
    fetchBanks();
    fetchDeletedBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("http://127.0.0.1:8000/api/bank-accounts/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banks');
      }

      const data = await response.json();
      setBanks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedBanks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("http://127.0.0.1:8000/api/bank-accounts/deleted/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch deleted banks');
      }

      const data = await response.json();
      setDeletedBanks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.account_number !== formData.confirm_account_number) {
      setError("Account numbers do not match!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const { confirm_account_number, ...payload } = formData;
      payload.amount = parseFloat(payload.amount);

      let response;
      if (editingBank) {
        response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${editingBank.id}/`, {
          method: "PUT",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch("http://127.0.0.1:8000/api/bank-accounts/", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save bank');
      }

      setSuccess(editingBank ? "Bank updated successfully!" : "Bank added successfully!");
      showToast(success);
      fetchBanks();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bankId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${bankId}/`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete bank');
      }

      setSuccess("Bank deleted successfully!");
      showToast(success);
      fetchBanks();
      fetchDeletedBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (bankId) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`http://127.0.0.1:8000/api/bank-accounts/${bankId}/restore/`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to restore bank');
      }

      setSuccess("Bank restored successfully!");
      showToast(success);
      fetchBanks();
      fetchDeletedBanks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      confirm_account_number: bank.account_number,
      amount: bank.amount.toString(),
    });
    setShowForm(true);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      bank_name: "",
      account_number: "",
      confirm_account_number: "",
      amount: "",
    });
    setEditingBank(null);
    setShowForm(false);
  };

  const showToast = (message) => {
    const toast = new window.bootstrap.Toast(toastRef.current);
    toastRef.current.querySelector(".toast-body").textContent = message;
    toast.show();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Bank Accounts</h2>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? "Hide Deleted Banks" : "View Deleted Banks"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Add Bank"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
            aria-label="Close"
          ></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border p-3 rounded">
          <div className="mb-3">
            <label className="form-label">Bank Name</label>
            <input
              type="text"
              className="form-control"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              className="form-control"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Account Number</label>
            <input
              type="text"
              className="form-control"
              name="confirm_account_number"
              value={formData.confirm_account_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
            />
          </div>

          <button type="submit" className="btn btn-success me-2" disabled={loading}>
            {loading ? "Processing..." : editingBank ? "Update Bank" : "Add Bank"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
            Cancel
          </button>
        </form>
      )}

      {loading && banks.length === 0 && !showDeleted ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : !showDeleted && banks.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Bank Name</th>
                <th>Account Number</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr key={bank.id}>
                  <td>{bank.bank_name}</td>
                  <td>{bank.account_number}</td>
                  <td>{bank.amount}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(bank)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      data-bs-toggle="modal"
                      data-bs-target={`#deleteModal-${bank.id}`}
                      disabled={loading}
                    >
                      Delete
                    </button>

                    <div
                      className="modal fade"
                      id={`deleteModal-${bank.id}`}
                      tabIndex="-1"
                      aria-labelledby={`deleteModalLabel-${bank.id}`}
                      aria-hidden="true"
                    >
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title" id={`deleteModalLabel-${bank.id}`}>
                              Confirm Delete
                            </h5>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                              aria-label="Close"
                            ></button>
                          </div>
                          <div className="modal-body">
                            Are you sure you want to delete this bank account?
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              data-bs-dismiss="modal"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              data-bs-dismiss="modal"
                              onClick={() => handleDelete(bank.id)}
                              disabled={loading}
                            >
                              {loading ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !showDeleted ? (
        <div className="alert alert-info">No bank accounts found. Add one to get started.</div>
      ) : null}

      {/* Deleted Banks Section */}
      {showDeleted && (
        <div className="mt-4">
          <h3>Deleted Banks</h3>
          {loading && deletedBanks.length === 0 ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : deletedBanks.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>Amount</th>
                    <th>Deleted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedBanks.map((bank) => (
                    <tr key={bank.id}>
                      <td>{bank.bank_name}</td>
                      <td>{bank.account_number}</td>
                      <td>{bank.amount}</td>
                      <td>{new Date(bank.deleted_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleRestore(bank.id)}
                          disabled={loading}
                        >
                          {loading ? "Restoring..." : "Restore"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">No deleted bank accounts found.</div>
          )}
        </div>
      )}

      {/* Toast Message */}
      <div
        ref={toastRef}
        className="toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-3"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="d-flex">
          <div className="toast-body"></div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
};

export default BankAdd;