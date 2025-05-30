import React, { useState, useEffect } from 'react';

const Banking = () => {
  // State variables from both components
  const [visibleButton, setVisibleButton] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBankEntry, setManualBankEntry] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [bankName, setBankName] = useState('');
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);
  const [manualBuyers, setManualBuyers] = useState([]);
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
  const [transactionType, setTransactionType] = useState('debit');
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
  const [paymentType, setPaymentType] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankList, setBankList] = useState(["SBI", "HDFC", "ICICI"]);
  const [newBank, setNewBank] = useState("");
  const [companyPaymentType, setCompanyPaymentType] = useState("");
  const [companySelectedBank, setCompanySelectedBank] = useState("");
  const [salaryPaymentType, setSalaryPaymentType] = useState("");
  const [salarySelectedBank, setSalarySelectedBank] = useState("");
  const [otherPaymentType, setOtherPaymentType] = useState("");
  const [otherSelectedBank, setOtherSelectedBank] = useState("");
  const [companies, setCompanies] = useState([]);

  // const [paymentMethod, setPaymentMethod] = useState('');
  // const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');


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

  // Data fetching functions
  const fetchBuyerNames = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/banking/buyer/', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      const uniqueBuyers = [...new Set(data.map(item => item.buyer_name))];
      setBuyerOptions(uniqueBuyers);
    } catch (error) {
      console.error('Error fetching buyer names:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/banks/", {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const apiBanks = data.map(bank => bank.name || bank);
        const combinedBanks = [...new Set([...["SBI", "HDFC", "ICICI"], ...apiBanks])];
        setBankList(combinedBanks);
        setBankOptions(data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      setBankList(["SBI", "HDFC", "ICICI"]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/banking/company/", {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const loadTransactionTypes = () => {
    setIsLoadingTypes(true);
    fetch("http://localhost:8000/api/banking/other/", {
      headers: getAuthHeaders()
    })
      .then(handleResponse)
      .then((data) => {
        const existingTypes = data.map(item => item.other_type);
        const uniqueTypes = [...new Set(existingTypes)];
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

  // Handler functions
  const handleAddBank = async () => {
    const bankNameToAdd = newBank.trim();
    if (!bankNameToAdd) return;

    try {
      const response = await fetch("http://localhost:8000/api/banks/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: bankNameToAdd })
      });

      if (response.ok) {
        await fetchBanks();
        setNewBank("");
        // Set the new bank as selected in all relevant selectors
        setCompanySelectedBank(bankNameToAdd);
        setSelectedBank(bankNameToAdd);
        setSalarySelectedBank(bankNameToAdd);
        setOtherSelectedBank(bankNameToAdd);
        setBankName(bankNameToAdd);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || error.error || 'Failed to add bank'}`);
      }
    } catch (error) {
      handleSubmissionError(error, "bank");
    }
  };

  const handleCompanyBillSubmit = async () => {
    if (!validateRequiredFields([selectedBuyer, selectedDate, depositAmount, companyPaymentType])) return;

    if (companyPaymentType === "Banking" && !companySelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/company/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          company_name: selectedBuyer,
          invoice_id: selectedInvoice,
          transaction_date: selectedDate,
          notice: buyerNotice,
          amount: parseFloat(depositAmount),
          payment_method: companyPaymentType,
          bank_name: companyPaymentType === "Banking" ? companySelectedBank : null
        }),
      });

      if (await handleApiResponse(response, "Company bill")) {
        resetBuyerForm();
        setCompanyPaymentType("");
        setCompanySelectedBank("");
      }
    } catch (error) {
      handleSubmissionError(error, "company bill");
    }
  };

  const handleBuyerBillSubmit = async () => {
    // Determine which buyer name to use based on which form is visible
    const currentBuyerName = visibleButton === 2 ? buyerName : companyName;
    const currentDate = visibleButton === 2 ? transactionDate : companyDate;
    const currentAmount = visibleButton === 2 ? amount : companyAmount;
    const currentNotice = visibleButton === 2 ? notice : companyNotice;
    const currentPaymentType = visibleButton === 2 ? paymentMethod : paymentType;
    const currentSelectedBank = visibleButton === 2 ? bankName : selectedBank;
    const currentManualEntry = visibleButton === 2 ? manualEntry : manualEntry;

    if (!validateRequiredFields([currentBuyerName, currentDate, currentAmount, currentPaymentType])) {
      alert("Please fill all required fields.");
      return;
    }

    if (currentPaymentType === "Banking" && !currentSelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    // Add to manual buyers if this is a new manual entry
    if (currentManualEntry && !manualBuyers.includes(currentBuyerName) && !companies.some(c => c.company_name === currentBuyerName)) {
      setManualBuyers(prev => [...prev, currentBuyerName]);
    }

    const payload = {
      buyer_name: currentBuyerName,
      transaction_date: currentDate,
      amount: parseFloat(currentAmount),
      notice: currentNotice || "No remarks",
      payment_method: currentPaymentType,
      bank_name: currentPaymentType === "Banking" ? currentSelectedBank : null
    };

    try {
      const response = await fetch("http://localhost:8000/api/banking/buyer/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      alert("Buyer record saved successfully!");

      // Reset form
      if (visibleButton === 2) {
        setBuyerName("");
        setTransactionDate("");
        setAmount("");
        setNotice("");
        setPaymentMethod("");
        setBankName("");
        setManualEntry(false);
      } else {
        setCompanyName("");
        setCompanyDate("");
        setCompanyAmount("");
        setCompanyNotice("");
        setPaymentType("");
        setSelectedBank("");
      }

    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Failed to save buyer: ${error.message}`);
    }
  };

  const handleSalarySubmit = async () => {
    if (!validateRequiredFields([salaryName, salary, salaryDate, salaryPaymentType])) return;

    if (salaryPaymentType === "Banking" && !salarySelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/salary/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          salary_name: salaryName,
          salary_amount: parseFloat(salary),
          salary_date: salaryDate,
          salary_invoice: selectedSalaryInvoice || null,
          payment_method: salaryPaymentType,
          bank_name: salaryPaymentType === "Banking" ? salarySelectedBank : null
        }),
      });

      if (await handleApiResponse(response, "Salary data")) {
        setSalaryName("");
        setSalaryAmount("");
        setSalaryDate("");
        setSelectedSalaryInvoice("");
        setSalaryPaymentType("");
        setSalarySelectedBank("");
      }
    } catch (error) {
      handleSubmissionError(error, "salary data");
    }
  };

  const handleOtherSubmit = async () => {
    if (!validateRequiredFields([otherDate, otherNotice, otherAmount, otherSelector, transactionType, otherPaymentType])) return;

    if (otherPaymentType === "Banking" && !otherSelectedBank) {
      alert("Please select a bank for banking transactions");
      return;
    }

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
          transaction_type: transactionType,
          payment_method: otherPaymentType,
          bank_name: otherPaymentType === "Banking" ? otherSelectedBank : null
        }),
      });

      if (await handleApiResponse(response, "Other data")) {
        setOtherSelector('');
        setOtherDate('');
        setOtherNotice('');
        setOtherAmount('');
        setTransactionType('debit');
        setOtherPaymentType('');
        setOtherSelectedBank('');
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

  const handleAddType = async () => {
    const trimmed = newType.trim();
    if (!trimmed) return;

    if (typeOptions.includes(trimmed)) {
      setOtherSelector(trimmed);
      setNewType("");
      setShowAddTypeInput(false);
      return;
    }

    setTypeOptions(prev => [...prev, trimmed]);
    setOtherSelector(trimmed);
    setNewType("");
    setShowAddTypeInput(false);
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

      fetchBuyerNames();
    }

    if (visibleButton === 4) {
      loadTransactionTypes();
    }

    fetchBanks();
    fetchCompanies();
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
            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              required
            >
              <option value="">-- Select Company --</option>
              {buyerNames.map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>

            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
            >
              <option value="">-- Select Invoice (Optional) --</option>
              {buyerInvoices.map(inv => (
                <option key={inv.id} value={inv.invoice_number}>{inv.invoice_number}</option>
              ))}
            </select>

            <input
              type="date"
              className="border px-4 py-2 rounded w-full mb-3"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Notice (Optional)"
              className="border px-4 py-2 rounded w-full mb-3"
              value={buyerNotice}
              onChange={(e) => setBuyerNotice(e.target.value)}
            />

            <input
              type="number"
              placeholder="Deposit Amount*"
              className="border px-4 py-2 rounded w-full mb-3"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />

            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={companyPaymentType}
              onChange={(e) => setCompanyPaymentType(e.target.value)}
              required
            >
              <option value="">-- Select Payment Type --</option>
              <option value="Cash">Cash</option>
              <option value="Banking">Banking</option>
            </select>

            {companyPaymentType === "Banking" && (
              <>
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={companySelectedBank}
                  onChange={(e) => setCompanySelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankList.map((bank, index) => (
                    <option key={index} value={bank}>{bank}</option>
                  ))}
                </select>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter Bank Name"
                    className="border px-4 py-2 rounded w-full"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={handleAddBank}
                    disabled={!newBank.trim()}
                  >
                    Add
                  </button>
                </div>
              </>
            )}

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleCompanyBillSubmit}
            >
              Submit Company Bill
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
                  setBuyerName("");
                }}
              />
              Enter Buyer Name Manually
            </label>

            {manualEntry ? (
              <input
                type="text"
                placeholder="Buyer Name*"
                className="border px-4 py-2 rounded w-full mb-3"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              />
            ) : (
              <select
                className="border px-4 py-2 rounded w-full mb-3"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              >
                <option value="">-- Select Buyer --</option>
                {buyerOptions.map((buyer, index) => (
                  <option key={index} value={buyer}>{buyer}</option>
                ))}
              </select>
            )}

            <input
              type="date"
              className="border px-4 py-2 rounded w-full mb-3"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Amount*"
              className="border px-4 py-2 rounded w-full mb-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Notice (Optional)"
              className="border px-4 py-2 rounded w-full mb-3"
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
            />

            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={paymentMethod}
              onChange={(e) => {
                const value = e.target.value;
                setPaymentMethod(value);
                if (value !== "Banking") {
                  setBankName("");
                }
              }}
              required
            >
              <option value="">-- Select Payment Type --</option>
              <option value="Cash">Cash</option>
              <option value="Banking">Banking</option>
            </select>

            {paymentMethod === "Banking" && (
              <>
                <label className="flex items-center mb-3 gap-2">
                  <input
                    type="checkbox"
                    checked={manualBankEntry}
                    onChange={() => {
                      setManualBankEntry(!manualBankEntry);
                      setBankName("");
                    }}
                  />
                  Enter Bank Name Manually
                </label>

                {manualBankEntry ? (
                  <input
                    type="text"
                    placeholder="Bank Name*"
                    className="border px-4 py-2 rounded w-full mb-3"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                ) : (
                  <select
                    className="border px-4 py-2 rounded w-full mb-3"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  >
                    <option value="">-- Select Bank --</option>
                    {bankOptions.map((bank, index) => (
                      <option key={index} value={bank.name || bank}>{bank.name || bank}</option>
                    ))}
                  </select>
                )}

                
              </>
            )}

            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={handleBuyerBillSubmit}
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

                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={salaryPaymentType}
                  onChange={(e) => setSalaryPaymentType(e.target.value)}
                  required
                >
                  <option value="">-- Select Payment Type --</option>
                  <option value="Cash">Cash</option>
                  <option value="Banking">Banking</option>
                </select>

                {salaryPaymentType === "Banking" && (
                  <>
                    <select
                      className="border px-4 py-2 rounded w-full mb-3"
                      value={salarySelectedBank}
                      onChange={(e) => setSalarySelectedBank(e.target.value)}
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {bankList.map((bank, index) => (
                        <option key={index} value={bank}>{bank}</option>
                      ))}
                    </select>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Enter Bank Name"
                        className="border px-4 py-2 rounded w-full"
                        value={newBank}
                        onChange={(e) => setNewBank(e.target.value)}
                      />
                      <button
                        type="button"
                        className="bg-green-600 text-white px-4 py-2 rounded"
                        onClick={handleAddBank}
                        disabled={!newBank.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </>
                )}

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

            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={otherPaymentType}
              onChange={(e) => setOtherPaymentType(e.target.value)}
              required
            >
              <option value="">-- Select Payment Type --</option>
              <option value="Cash">Cash</option>
              <option value="Banking">Banking</option>
            </select>

            {otherPaymentType === "Banking" && (
              <>
                <select
                  className="border px-4 py-2 rounded w-full mb-3"
                  value={otherSelectedBank}
                  onChange={(e) => setOtherSelectedBank(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {bankList.map((bank, index) => (
                    <option key={index} value={bank}>{bank}</option>
                  ))}
                </select>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Enter Bank Name"
                    className="border px-4 py-2 rounded w-full"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={handleAddBank}
                    disabled={!newBank.trim()}
                  >
                    Add
                  </button>
                </div>
              </>
            )}

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