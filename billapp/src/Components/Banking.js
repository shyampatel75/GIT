import React, { useEffect, useState } from 'react';

const Banking = () => {
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

  const [salarynewname, setSalaryNewName] = useState("");
  const [salaryName, setSalaryName] = useState("");
  const [salary, setSalaryAmount] = useState(""); 
  const [salaryDate, setSalaryDate] = useState("");
  const [salaryInvoices, setSalaryInvoices] = useState([]);
  const [selectedSalaryInvoice, setSelectedSalaryInvoice] = useState("");

  const [otherDate, setOtherDate] = useState("");
  const [otherNotice, setOtherNotice] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [otherSelector, setOtherSelector] = useState('');

  const [allInvoices, setAllInvoices] = useState([]);

  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositFormAmount, setDepositFormAmount] = useState("");
  const [depositFormDate, setDepositFormDate] = useState("");

  const [employees, setEmployees] = useState([]);

  const [showAddTypeInput, setShowAddTypeInput] = useState(false);
  const [newType, setNewType] = useState("");
  const [typeOptions, setTypeOptions] = useState(["Fast Expand", "Profit", "Other"]);

  useEffect(() => {
    if ([1, 2, 3].includes(visibleButton)) {
      fetch("http://localhost:8000/api/invoices/")
        .then((res) => res.json())
        .then((data) => {
          const names = data.map(item => item.buyer_name);
          const uniqueNames = [...new Set(names)];
          setBuyerNames(uniqueNames);
          setAllInvoices(data);
        })
        .catch((error) => console.error("Error fetching invoices:", error));
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
      fetch("http://localhost:8000/api/banking/employee/")
        .then((res) => res.json())
        .then((data) => setEmployees(data))
        .catch((error) => console.error("Failed to fetch employees:", error));
    }
  }, [visibleButton]);

  const handleBuyerSubmit = async () => {
    if (!selectedBuyer || !selectedDate || !depositAmount) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/buyer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: selectedBuyer,
          invoice_id: selectedInvoice,
          transaction_date: selectedDate,
          notice: buyerNotice,
          deposit_amount: parseFloat(depositAmount)
        }),
      });

      if (response.ok) {
        alert("Transaction saved successfully!");
        setSelectedBuyer("");
        setSelectedInvoice("");
        setSelectedDate("");
        setBuyerNotice("");
        setDepositAmount("");
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to save transaction. Please try again.");
    }
  };

  const handleCompanySubmit = async () => {
    if (!companyName || !companyDate || !companyAmount) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/banking/company/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          transaction_date: companyDate,
          amount: parseFloat(companyAmount),
          notice: companyNotice
        }),
      });

      if (response.ok) {
        alert("Company bill saved successfully!");
        setCompanyName("");
        setCompanyDate("");
        setCompanyAmount("");
        setCompanyNotice("");
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to save company bill. Please try again.");
    }
  };

  const handleSalarySubmit = async () => {
    if (!salaryName || !salary || !salaryDate) {
      alert("Please fill all salary fields.");
      return;
    }

    const data = {
      salary_newname: salarynewname,
      salary_name: salaryName,
      salary_amount: parseFloat(salary),
      salary_date: salaryDate,
      salary_invoice: selectedSalaryInvoice || null,
    };

    try {
      const response = await fetch("http://localhost:8000/api/banking/salary/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("✅ Salary data submitted successfully!");
      } else {
        const result = await response.json();
        alert("❌ Submission failed: " + result.detail);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error submitting salary data.");
    }
  };

  const handleOtherSubmit = async () => {
    if (!otherDate || !otherNotice || !otherAmount || !otherSelector) {
      alert("Please fill all required fields.");
      return;
    }


    const data = {
      other_type: otherSelector,
      other_date: otherDate,
      other_notice: otherNotice,
      other_amount: parseFloat(otherAmount),
    };

    try {
      const response = await fetch("http://localhost:8000/api/banking/other/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("✅ Other data submitted successfully!");
        // Reset form fields
        setOtherSelector('');
        setOtherDate('');
        setOtherNotice('');
        setOtherAmount('');
      } else {
        const result = await response.json();
        alert("❌ Submission failed: " + (result.detail || JSON.stringify(result)));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error submitting other data.");
    }
  };

  const handleDepositSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/add-deposit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositFormAmount,
          date: depositFormDate,
        }),
      });

      if (response.ok) {
        alert('Deposit saved successfully!');
        setShowDepositForm(false);
        setDepositFormAmount('');
        setDepositFormDate('');
      } else {
        console.error('Failed to save deposit');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto" style={{ paddingLeft: "100px" }}>
      <div className="d-flex bd-highlight mb-4">
        <div className="p-2 bd-highlight position-relative">
          {showDepositForm && (
            <div className="card p-3 position-absolute bg-white shadow" style={{ zIndex: 999, left: "7px", top: "50px" }}>
              <input type="number" placeholder="Amount" className="form-control mb-2" value={depositFormAmount} onChange={(e) => setDepositFormAmount(e.target.value)} />
              <input type="date" className="form-control mb-2" value={depositFormDate} onChange={(e) => setDepositFormDate(e.target.value)} />
              <div className="d-flex justify-content-between">
                <button className="btn btn-success me-2" onClick={handleDepositSubmit}>Submit</button>
                <button className="btn btn-secondary" onClick={() => setShowDepositForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setShowDepositForm(!showDepositForm)}>Add Deposit</button>
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
            <select className="border px-4 py-2 rounded w-full mb-3" value={selectedBuyer} onChange={(e) => setSelectedBuyer(e.target.value)} required>
              <option value="">-- Select Company Bill --</option>
              {buyerNames.map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>
            <select className="border px-4 py-2 rounded w-full mb-3" value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)}>
              <option value="">-- Select Invoice (Optional) --</option>
              {buyerInvoices.map(inv => (
                <option key={inv.id} value={inv.invoice_number}>{inv.invoice_number}</option>
              ))}
            </select>
            <input type="date" className="border px-4 py-2 rounded w-full mb-3" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
            <input type="text" placeholder="Notice (Optional)" className="border px-4 py-2 rounded w-full mb-3" value={buyerNotice} onChange={(e) => setBuyerNotice(e.target.value)} />
            <input type="number" placeholder="Deposit Amount*" className="border px-4 py-2 rounded w-full mb-3" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleBuyerSubmit}>Submit Buyer Transaction</button>
          </>
        )}

        {visibleButton === 2 && (
          <>
            <h3 className="mb-2 font-semibold">Buyer Bill</h3>
            <input type="text" placeholder="Buyer Name*" className="border px-4 py-2 rounded w-full mb-3" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <input type="date" className="border px-4 py-2 rounded w-full mb-3" value={companyDate} onChange={(e) => setCompanyDate(e.target.value)} required />
            <input type="number" placeholder="Amount*" className="border px-4 py-2 rounded w-full mb-3" value={companyAmount} onChange={(e) => setCompanyAmount(e.target.value)} required />
            <input type="text" placeholder="Notice (Optional)" className="border px-4 py-2 rounded w-full mb-3" value={companyNotice} onChange={(e) => setCompanyNotice(e.target.value)} />
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCompanySubmit}>Submit Buyer Bill</button>
          </>
        )}

        {visibleButton === 3 && (
          <>
            <h3 className="mb-2 font-semibold">Salary</h3>
            <select className="border px-4 py-2 rounded w-full mb-3" value={salaryName} onChange={(e) => {
              const selected = e.target.value;
              setSalaryName(selected);
              const emp = employees.find(emp => emp.name === selected);
              if (emp) {
                setSalaryAmount(emp.salary || "");
              }
            }}>
              <option value="">-- Select Employee --</option>
              {employees.map((emp, index) => (
                <option key={index} value={emp.name}>{emp.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Enter amount" className="border px-4 py-2 rounded w-full mb-3" value={salary} onChange={(e) => setSalaryAmount(e.target.value)} />
            <input type="date" className="border px-4 py-2 rounded w-full mb-3" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} />
            <button className="bg-yellow-600 text-white px-4 py-2 rounded" onClick={handleSalarySubmit}>Submit</button>
          </>
        )}

        {visibleButton === 4 && (
          <>
            <h3 className="mb-2 font-semibold">Other</h3>

            {/* Add Type Button + Input */}
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
                    onClick={() => {
                      const trimmed = newType.trim();
                      if (trimmed && !typeOptions.includes(trimmed)) {
                        setTypeOptions([...typeOptions, trimmed]);
                        setNewType("");
                        setShowAddTypeInput(false);
                      }
                    }}
                  >
                    Add
                  </button>
                </>
              )}
            </div>


            {/* Selector with dynamic options */}
            <select
              className="border px-4 py-2 rounded w-full mb-3"
              value={otherSelector}
              onChange={(e) => setOtherSelector(e.target.value)}
              required
            >
              <option value="">Select Type*</option>
              {typeOptions.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="border px-4 py-2 rounded w-full mb-3"
              value={otherDate}
              onChange={(e) => setOtherDate(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter notice"
              className="border px-4 py-2 rounded w-full mb-3"
              value={otherNotice}
              onChange={(e) => setOtherNotice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Enter amount"
              className="border px-4 py-2 rounded w-full mb-3"
              value={otherAmount}
              onChange={(e) => setOtherAmount(e.target.value)}
            />
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={handleOtherSubmit}
            >
              Submit
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Banking;