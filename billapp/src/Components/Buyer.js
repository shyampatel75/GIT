import React, { useState, useEffect } from 'react';

const PaymentBuyerForm = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBankEntry, setManualBankEntry] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [bankName, setBankName] = useState('');
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);

  useEffect(() => {
    const fetchBuyerNames = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/banking/buyer/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const data = await response.json();
        const uniqueBuyers = [...new Set(data.map(item => item.buyer_name))];
        setBuyerOptions(uniqueBuyers);
      } catch (error) {
        console.error('Error fetching buyer names:', error);
      }
    };

    fetchBuyerNames();
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/banks/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const data = await response.json();
        setBankOptions(data);
      } catch (error) {
        console.error('Error fetching bank names:', error);
      }
    };

    fetchBanks();
  }, []);

  const addBankIfManual = async () => {
    const bankExists = bankOptions.some(b => (b.name || b) === bankName);
    if (manualBankEntry && bankName && !bankExists) {
      try {
        const response = await fetch('http://localhost:8000/api/banks/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ name: bankName }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }

        const newBank = await response.json();
        setBankOptions(prev => [...prev, newBank]);
      } catch (error) {
        console.error('Failed to add new bank:', error);
        alert(`Error adding bank: ${error.message}`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!buyerName || !transactionDate || !amount || (paymentMethod === 'Banking' && !bankName)) {
      alert("Please fill all required fields.");
      return;
    }

    if (paymentMethod === 'Banking') {
      await addBankIfManual();
    }

    const payload = {
      buyer_name: buyerName,
      transaction_date: transactionDate,
      amount: parseFloat(amount),
      notice: notice || "No remarks",
      payment_method: paymentMethod,
      bank_name: paymentMethod === 'Banking' ? bankName : '',
    };

    try {
      const response = await fetch("http://localhost:8000/api/banking/buyer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      alert("Buyer record submitted successfully!");

      if (manualEntry && !buyerOptions.includes(buyerName)) {
        setBuyerOptions(prev => [...prev, buyerName]);
      }

      setBuyerName('');
      setTransactionDate('');
      setAmount('');
      setNotice('');
      setBankName('');
      setManualEntry(false);
      setManualBankEntry(false);
      setPaymentMethod('');
    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Submission error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto" style={{ paddingLeft: "100px" }}>
      <h2 className="text-xl font-bold mb-4">Payment & Buyer Entry</h2>



      <label className="flex items-center mb-3 gap-2">
        <input
          type="checkbox"
          checked={manualEntry}
          onChange={() => {
            setManualEntry(!manualEntry);
            setBuyerName('');
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
        value={paymentMethod}
        onChange={(e) => {
          setPaymentMethod(e.target.value);
          if (e.target.value === 'Cash') {
            setBankName('');
            setManualBankEntry(false);
          }
        }}
        className="border px-4 py-2 rounded w-full mb-4"
      >
        <option value="">-- Select Payment Method --</option>
        <option value="Cash">Cash</option>
        <option value="Banking">Banking</option>
      </select>
      {paymentMethod === 'Banking' && (
        <>
          <label className="flex items-center mb-3 gap-2">
            <input
              type="checkbox"
              checked={manualBankEntry}
              onChange={() => {
                setManualBankEntry(!manualBankEntry);
                setBankName('');
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
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
};

export default PaymentBuyerForm;