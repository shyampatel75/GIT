import React, { useEffect, useState } from 'react';

const Banking = () => {
  // State variables
  const [visibleButton, setVisibleButton] = useState(null);
  const [buyerNames, setBuyerNames] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [buyerInvoices, setBuyerInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [buyerNotice, setBuyerNotice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDate, setCompanyDate] = useState("");
  const [companyAmount, setCompanyAmount] = useState("");
  const [companyNotice, setCompanyNotice] = useState("");
  const [salaryName, setSalaryName] = useState("");
  const [salary, setSalaryAmount] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [salaryInvoices, setSalaryInvoices] = useState([]);
  const [selectedSalaryInvoice, setSelectedSalaryInvoice] = useState("");
  const [otherDate, setOtherDate] = useState("");
  const [otherNotice, setOtherNotice] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [otherSelector, setOtherSelector] = useState('');
  const [transactionType, setTransactionType] = useState('debit'); // Add credit/debit selector state
  const [allInvoices, setAllInvoices] = useState([]);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositFormAmount, setDepositFormAmount] = useState("");
  const [depositFormDate, setDepositFormDate] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);
  const [newType, setNewType] = useState("");
  const [typeOptions, setTypeOptions] = useState(["Fast Expand", "Profit", "Other"]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Helper functions
  const handleResponse = (response) => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  };

  const handleError = (error) => {
    console.error("API Error:", error);
    alert("An error occurred. Please try again.");
  };

  const validateRequiredFields = (fields) => {
    if (fields.some(field => !field)) {
      alert("Please fill all required fields.");
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const handleApiResponse = async (response, entity) => {
    if (!response.ok) {
      const error = await response.json();
      alert(`Error: ${JSON.stringify(error)}`);
      return false;
    }
    alert(`${entity} saved successfully!`);
    return true;
  };

  const resetBuyerForm = () => {
    setSelectedBuyer("");
    setSelectedInvoice("");
    setSelectedDate("");
    setBuyerNotice("");
    setDepositAmount("");
  };

  const handleSubmissionError = (error, entity) => {
    console.error(`${entity} submission error:`, error);
    alert(`Failed to save ${entity}. Please try again.`);
  };

  // Load existing transaction types
  const loadTransactionTypes = () => {
    setIsLoadingTypes(true);
    fetch("http://localhost:8000/api/banking/other/", {
      headers: getAuthHeaders()
    })
      .then(handleResponse)
      .then((data) => {
        // Extract unique types from the response
        const existingTypes = data.map(item => item.other_type);
        const uniqueTypes = [...new Set(existingTypes)];

        // Merge with default types while avoiding duplicates
        const defaultTypes = ["Fast Expand", "Profit", "Other"];
        const allTypes = [...defaultTypes];

        uniqueTypes.forEach(type => {
          if (!allTypes.includes(type)) {
            allTypes.push(type);
          }
        });

        setTypeOptions(allTypes);
      })
      .catch(handleError)
      .finally(() => setIsLoadingTypes(false));
  };

  // useEffect hooks
  useEffect(() => {
    if ([1, 2, 3].includes(visibleButton)) {
      fetch("http://localhost:8000/api/invoices/", {
        headers: getAuthHeaders()
      })
        .then(handleResponse)
        .then((data) => {
          const names = data.map(item => item.buyer_name);
          const uniqueNames = [...new Set(names)];
          setBuyerNames(uniqueNames);
          setAllInvoices(data);
        })
        .catch(handleError);
    }

    // Load transaction types when "Other" button is clicked
    if (visibleButton === 4) {
      loadTransactionTypes();
    }
  }, [visibleButton]);

  useEffect(() => {
    const filtered = allInvoices.filter(inv => inv.buyer_name === selectedBuyer);
    setBuyerInvoices(filtered);
    setSelectedInvoice("");
  }, [selectedBuyer, allInvoices]);

  useEffect(() => {
    const filtered = allInvoices.filter(inv => inv.buyer_name === salaryName);
    setSalaryInvoices(filtered);
    setSelectedSalaryInvoice("");
  }, [salaryName, allInvoices]);

  useEffect(() => {
    if (visibleButton === 3) {
      setIsLoadingEmployees(true);
      fetch("http://localhost:8000/api/banking/employee/", {
        headers: getAuthHeaders()
      })
        .then(handleResponse)
        .then((data) => setEmployees(data))
        .catch(handleError)
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [visibleButton]);

  // Handler functions
  const handleBuyerSubmit = async () => {
    if (!validateRequiredFields([selectedBuyer, selectedDate, depositAmount])) return;

    try {
      const response = await fetch("http://localhost:8000/api/banking/buyer/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          buyer_name: selectedBuyer,
          invoice_id: selectedInvoice,
          transaction_date: selectedDate,
          notice: buyerNotice,
          deposit_amount: parseFloat(depositAmount)
        }),
      });

      await handleApiResponse(response, "Transaction");
      resetBuyerForm();
    } catch (error) {
      handleSubmissionError(error, "transaction");
    }
  };

  const handleAddType = async () => {
    const trimmed = newType.trim();
    if (!trimmed) return;

    // If the type already exists, just update the UI state
    if (typeOptions.includes(trimmed)) {
      setOtherSelector(trimmed);
      setNewType("");
      setShowAddTypeInput(false);
      return;
    }

    // Update the UI immediately for a more responsive feel
    setTypeOptions(prev => [...prev, trimmed]);
    setOtherSelector(trimmed);
    setNewType("");
    setShowAddTypeInput(false);
  };

  const handleCompanySubmit = async () => {
    if (!validateRequiredFields([companyName, companyDate, companyAmount])) return;

    try {
      const response = await fetch("http://localhost:8000/api/banking/company/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company_name: companyName,
          transaction_date: companyDate,
          amount: parseFloat(companyAmount),
          notice: companyNotice
        }),
      });

      if (await handleApiResponse(response, "Company bill")) {
        setCompanyName("");
        setCompanyDate("");
        setCompanyAmount("");
        setCompanyNotice("");
      }
    } catch (error) {
      handleSubmissionError(error, "company bill");
    }
  };

  const handleSalarySubmit = async () => {
    if (!validateRequiredFields([salaryName, salary, salaryDate])) return;

    try {
      const response = await fetch("http://localhost:8000/api/banking/salary/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          salary_name: salaryName,
          salary_amount: parseFloat(salary),
          salary_date: salaryDate,
          salary_invoice: selectedSalaryInvoice || null,
        }),
      });

      if (await handleApiResponse(response, "Salary data")) {
        setSalaryName("");
        setSalaryAmount("");
        setSalaryDate("");
        setSelectedSalaryInvoice("");
      }
    } catch (error) {
      handleSubmissionError(error, "salary data");
    }
  };

  const handleOtherSubmit = async () => {
    if (!validateRequiredFields([otherDate, otherNotice, otherAmount, otherSelector, transactionType])) return;

    // Adjust amount based on transaction type
    const finalAmount = transactionType === 'debit'
      ? -Math.abs(parseFloat(otherAmount))
      : Math.abs(parseFloat(otherAmount));

    try {
      const response = await fetch("http://localhost:8000/api/banking/other/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          other_type: otherSelector,
          other_date: otherDate,
          other_notice: otherNotice,
          other_amount: finalAmount,
          transaction_type: transactionType, // Add transaction type to payload
        }),
      });

      if (await handleApiResponse(response, "Other data")) {
        setOtherSelector('');
        setOtherDate('');
        setOtherNotice('');
        setOtherAmount('');
        setTransactionType('debit'); // Reset to default

        // Refresh the types list to include the newly added type
        loadTransactionTypes();
      }
    } catch (error) {
      handleSubmissionError(error, "other data");
    }
  };

  const handleDepositSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/add-deposit/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: depositFormAmount,
          date: depositFormDate,
        }),
      });

      if (await handleApiResponse(response, "Deposit")) {
        setShowDepositForm(false);
        setDepositFormAmount('');
        setDepositFormDate('');
      }
    } catch (error) {
      handleSubmissionError(error, "deposit");
    }
  };

  const [companies, setCompanies] = useState([]);
// const [companyName, setCompanyName] = useState("");  
const [manualEntry, setManualEntry] = useState(false); // NEW

useEffect(() => {
  const fetchCompanies = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/banking/company/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch companies");

      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  fetchCompanies();
}, []);


  return (
    <div className="p-6 max-w-md mx-auto" style={{ paddingLeft: "100px" }}>
      <div className="d-flex bd-highlight mb-4">
        <div className="p-2 bd-highlight position-relative">
          {showDepositForm && (
            <div className="card p-3 position-absolute bg-white shadow" style={{ zIndex: 999, left: "7px", top: "50px" }}>
              <input type="number" placeholder="Amount" className="form-control mb-2"
                value={depositFormAmount} onChange={(e) => setDepositFormAmount(e.target.value)} />
              <input type="date" className="form-control mb-2"
                value={depositFormDate} onChange={(e) => setDepositFormDate(e.target.value)} />
              <div className="d-flex justify-content-between">
                <button className="btn btn-success me-2" onClick={handleDepositSubmit}>Submit</button>
                <button className="btn btn-secondary" onClick={() => setShowDepositForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setShowDepositForm(!showDepositForm)}>
            Add Deposit
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-around gap-2 mb-4 my-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setVisibleButton(1)}>Company Bill</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setVisibleButton(2)}>Buyer</button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => setVisibleButton(3)}>Salary</button>
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setVisibleButton(4)}>Other</button>
      </div>

      <div className="mt-4">
        {visibleButton === 1 && (
          <>
            <h3 className="mb-2 font-semibold">Company Bill</h3>
            <select className="border px-4 py-2 rounded w-full mb-3"
              value={selectedBuyer} onChange={(e) => setSelectedBuyer(e.target.value)} required>
              <option value="">-- Select Company Bill --</option>
              {buyerNames.map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>
            <select className="border px-4 py-2 rounded w-full mb-3"
              value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)}>
              <option value="">-- Select Invoice (Optional) --</option>
              {buyerInvoices.map(inv => (
                <option key={inv.id} value={inv.invoice_number}>{inv.invoice_number}</option>
              ))}
            </select>
            <input type="date" className="border px-4 py-2 rounded w-full mb-3"
              value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
            <input type="text" placeholder="Notice (Optional)" className="border px-4 py-2 rounded w-full mb-3"
              value={buyerNotice} onChange={(e) => setBuyerNotice(e.target.value)} />
            <input type="number" placeholder="Deposit Amount*" className="border px-4 py-2 rounded w-full mb-3"
              value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleBuyerSubmit}>
              Submit Buyer Transaction
            </button>
          </>
        )}

       {visibleButton === 2 && (
  <>
    <h3 className="mb-2 font-semibold">Buyer Bill</h3>

    <label className="mb-1 font-medium flex items-center gap-2">
      <input
        type="checkbox"
        checked={manualEntry}
        onChange={() => {
          setManualEntry(!manualEntry);
          setCompanyName(""); // reset on toggle
        }}
      />
      Enter Buyer Name Manually
    </label>

    {manualEntry ? (
      <input
        type="text"
        placeholder="Buyer Name*"
        className="border px-4 py-2 rounded w-full mb-3"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />
    ) : (
      <select
        className="border px-4 py-2 rounded w-full mb-3"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      >
        <option value="">-- Select Buyer --</option>
        {companies.map((comp) => (
          <option key={comp.id} value={comp.company_name}>
            {comp.company_name}
          </option>
        ))}
      </select>
    )}

    <input
      type="date"
      className="border px-4 py-2 rounded w-full mb-3"
      value={companyDate}
      onChange={(e) => setCompanyDate(e.target.value)}
      required
    />
    <input
      type="number"
      placeholder="Amount*"
      className="border px-4 py-2 rounded w-full mb-3"
      value={companyAmount}
      onChange={(e) => setCompanyAmount(e.target.value)}
      required
    />
    <input
      type="text"
      placeholder="Notice (Optional)"
      className="border px-4 py-2 rounded w-full mb-3"
      value={companyNotice}
      onChange={(e) => setCompanyNotice(e.target.value)}
    />
    <button
      className="bg-green-600 text-white px-4 py-2 rounded"
      onClick={handleCompanySubmit}
    >
      Submit Buyer Bill
    </button>
  </>
)}


        {visibleButton === 3 && (
          <>
            <h3 className="mb-2 font-semibold">Salary</h3>
            {isLoadingEmployees ? (
              <p>Loading employees...</p>
            ) : employees.length === 0 ? (
              <p>No employees found</p>
            ) : (
              <>
                <select className="border px-4 py-2 rounded w-full mb-3"
                  value={salaryName} onChange={(e) => {
                    const selected = e.target.value;
                    setSalaryName(selected);
                    const emp = employees.find(emp => emp.name === selected);
                    if (emp) setSalaryAmount(emp.salary || "");
                  }}>
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp, index) => (
                    <option key={index} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
                <input type="number" placeholder="Enter amount" className="border px-4 py-2 rounded w-full mb-3"
                  value={salary} onChange={(e) => setSalaryAmount(e.target.value)} />
                <input type="date" className="border px-4 py-2 rounded w-full mb-3"
                  value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} />
                <button className="bg-yellow-600 text-white px-4 py-2 rounded" onClick={handleSalarySubmit}>
                  Submit
                </button>
              </>
            )}
          </>
        )}

        {visibleButton === 4 && (
          <>
            <h3 className="mb-2 font-semibold">Other</h3>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => setShowAddTypeInput(!showAddTypeInput)}
              >
                {showAddTypeInput ? "Cancel" : "Add New Type"}
              </button>

              {showAddTypeInput && (
                <>
                  <input
                    type="text"
                    placeholder="New type"
                    className="border px-3 py-1 rounded"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  />
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={handleAddType}
                  >
                    Add
                  </button>
                </>
              )}
            </div>

            {/* Credit/Debit Selector */}
            <div className="mb-3">
              <label className="block mb-2 font-medium">Transaction Type*</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="credit"
                    checked={transactionType === 'credit'}
                    onChange={() => setTransactionType('credit')}
                    className="mr-2"
                  />
                  Credit (Money In)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transactionType"
                    value="debit"
                    checked={transactionType === 'debit'}
                    onChange={() => setTransactionType('debit')}
                    className="mr-2"
                  />
                  Debit (Money Out)
                </label>
              </div>
            </div>

            {isLoadingTypes ? (
              <p>Loading transaction types...</p>
            ) : (
              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={otherSelector}
                onChange={(e) => setOtherSelector(e.target.value)}
                required
              >
                <option value="">Select Type*</option>
                {typeOptions.map((option, i) => (
                  <option key={i} value={option}>{option}</option>
                ))}
              </select>
            )}

            <input type="date" className="border px-4 py-2 rounded w-full mb-3"
              value={otherDate} onChange={(e) => setOtherDate(e.target.value)} />
            <input type="text" placeholder="Enter notice" className="border px-4 py-2 rounded w-full mb-3"
              value={otherNotice} onChange={(e) => setOtherNotice(e.target.value)} />
            <input type="number" placeholder="Enter amount" className="border px-4 py-2 rounded w-full mb-3"
              value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleOtherSubmit}>
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Banking;