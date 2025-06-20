import React, { useState, useEffect } from "react";
import './style/balancesheet.css';

const API_URL = "http://localhost:8000/api/banking/other/";
const SALARY_API_URL = "http://localhost:8000/api/banking/salary/";
const BUYER_API_URL = "http://localhost:8000/api/banking/buyer/";
const INVOICE_API_URL = "http://localhost:8000/api/invoices/";
const COMPANY_API_URL = "http://localhost:8000/api/banking/company/";

const BalanceSheet = () => {
  const [capital, setCapital] = useState([]);
  const [fixedAssets, setFixedAssets] = useState([]);
  const [loan, setLoan] = useState([]);
  const [loanCredit, setLoanCredit] = useState([]);
  const [loanDebit, setLoanDebit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState([]);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [buyer, setBuyer] = useState([]);
  const [buyerTotal, setBuyerTotal] = useState(0);
  // New state for custom transaction types
  const [customTypes, setCustomTypes] = useState({});
  const [customTypesCredit, setCustomTypesCredit] = useState({});
  const [customTypesDebit, setCustomTypesDebit] = useState({});
  // New state for invoices and company
  const [invoiceDebits, setInvoiceDebits] = useState([]);
  const [companyCredit, setCompanyCredit] = useState([]);
  const [companyDebit, setCompanyDebit] = useState([]);
  // New: store invoice totals by company
  const [invoiceTotalsByCompany, setInvoiceTotalsByCompany] = useState({});
  const [companyAmounts, setCompanyAmounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        console.log("API data:", data);

        // Use data directly (should be an array)
        const capitalData = {};
        const fixedAssetsData = {};
        const loanData = {};
        const loanCreditData = {};
        const loanDebitData = {};
        // New: Track custom transaction types
        const customTypesData = {};
        const customTypesCreditData = {};
        const customTypesDebitData = {};

        // New: Track total credit and debit for each loan
        const loanTotals = {};
        // New: Track total credit and debit for each custom type
        const customTypesTotals = {};
        
        data.forEach(item => {
          // Capital section: only "partner"
          if (item.other_type && item.other_type.toLowerCase() === "partner") {
            const name = item.other_notice;
            const amount = Math.abs(parseFloat(item.other_amount)); // always positive
            if (!capitalData[name]) capitalData[name] = 0;
            if (item.transaction_type === "credit") {
              capitalData[name] += amount;
            } else if (item.transaction_type === "debit") {
              capitalData[name] -= amount;
            }
          }
          // Loan section: only "loan"
          else if (item.other_type && item.other_type.toLowerCase() === "loan") {
            const name = item.other_notice;
            const amount = Math.abs(parseFloat(item.other_amount)); // always positive
            if (!loanData[name]) loanData[name] = 0;
            if (!loanCreditData[name]) loanCreditData[name] = 0;
            if (!loanDebitData[name]) loanDebitData[name] = 0;
            if (item.transaction_type === "credit") {
              loanData[name] += amount;
              loanCreditData[name] += amount;
            } else if (item.transaction_type === "debit") {
              loanData[name] -= amount;
              loanDebitData[name] += amount;
            }
            // Update loan totals
            if (!loanTotals[name]) loanTotals[name] = { credit: 0, debit: 0 };
            if (item.transaction_type === "credit") {
              loanTotals[name].credit += amount;
            } else if (item.transaction_type === "debit") {
              loanTotals[name].debit += amount;
            }
          }
          // Fixed Assets section: only "fixed assets"
          else if (item.other_type && item.other_type.toLowerCase() === "fixed assets") {
            const asset = item.other_notice;
            const amount = Math.abs(parseFloat(item.other_amount)); // always positive
            if (!fixedAssetsData[asset]) fixedAssetsData[asset] = 0;
            fixedAssetsData[asset] += amount;
          }
          // Custom transaction types: any other_type not predefined
          else if (item.other_type) {
            const customType = item.other_type;
            const name = item.other_notice;
            const amount = Math.abs(parseFloat(item.other_amount)); // always positive
            
            // Initialize data structures for this custom type
            if (!customTypesData[customType]) customTypesData[customType] = {};
            if (!customTypesCreditData[customType]) customTypesCreditData[customType] = {};
            if (!customTypesDebitData[customType]) customTypesDebitData[customType] = {};
            if (!customTypesTotals[customType]) customTypesTotals[customType] = {};
            
            if (!customTypesData[customType][name]) customTypesData[customType][name] = 0;
            if (!customTypesCreditData[customType][name]) customTypesCreditData[customType][name] = 0;
            if (!customTypesDebitData[customType][name]) customTypesDebitData[customType][name] = 0;
            if (!customTypesTotals[customType][name]) customTypesTotals[customType][name] = { credit: 0, debit: 0 };
            
            if (item.transaction_type === "credit") {
              customTypesData[customType][name] += amount;
              customTypesCreditData[customType][name] += amount;
              customTypesTotals[customType][name].credit += amount;
            } else if (item.transaction_type === "debit") {
              customTypesData[customType][name] -= amount;
              customTypesDebitData[customType][name] += amount;
              customTypesTotals[customType][name].debit += amount;
            }
          }
        });

        // Prepare filtered lists for display
        const filteredLoanCredit = Object.entries(loanTotals)
          .filter(([_, v]) => v.credit - v.debit > 0)
          .map(([name, v]) => [name, v.credit - v.debit]);
        const filteredLoanDebit = Object.entries(loanTotals)
          .filter(([_, v]) => v.debit - v.credit > 0)
          .map(([name, v]) => [name, v.debit - v.credit]);
        setLoanCredit(filteredLoanCredit);
        setLoanDebit(filteredLoanDebit);

        // Process custom types for display
        const processedCustomTypes = {};
        const processedCustomTypesCredit = {};
        const processedCustomTypesDebit = {};
        
        Object.keys(customTypesTotals).forEach(customType => {
          // Credit side: net positive balances (only show if balance > 0)
          const creditEntries = Object.entries(customTypesTotals[customType])
            .filter(([_, v]) => v.credit - v.debit > 0)
            .map(([name, v]) => [name, v.credit - v.debit]);
          
          // Debit side: only show when credit side is 0 or negative for that person
          const debitEntries = Object.entries(customTypesTotals[customType])
            .filter(([name, v]) => {
              const netBalance = v.credit - v.debit;
              // Show on debit side only if net balance is 0 or negative
              return netBalance <= 0 && v.debit > 0;
            })
            .map(([name, v]) => [name, Math.abs(v.credit - v.debit)]); // Show absolute value of negative balance
          
          if (creditEntries.length > 0) {
            processedCustomTypesCredit[customType] = creditEntries;
          }
          if (debitEntries.length > 0) {
            processedCustomTypesDebit[customType] = debitEntries;
          }
        });
        
        setCustomTypesCredit(processedCustomTypesCredit);
        setCustomTypesDebit(processedCustomTypesDebit);

        setCapital(Object.entries(capitalData));
        setLoan(Object.entries(loanData));
        setFixedAssets(Object.entries(fixedAssetsData));
      } catch (error) {
        console.error("Error fetching balance sheet data:", error);
        setCapital([]);
        setFixedAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch salary data
  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(SALARY_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        // Group and sum by salary_name
        const salaryMap = {};
        data.forEach(item => {
          const name = item.salary_name;
          const amount = parseFloat(item.salary_amount);
          if (!salaryMap[name]) salaryMap[name] = 0;
          salaryMap[name] += amount;
        });
        const salaryArr = Object.entries(salaryMap);
        setSalary(salaryArr);
        setSalaryTotal(salaryArr.reduce((sum, [, amt]) => sum + amt, 0));
      } catch (error) {
        setSalary([]);
        setSalaryTotal(0);
      }
    };
    fetchSalary();
  }, []);

  // Fetch buyer data
  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(BUYER_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        // Group and sum by buyer_name
        const buyerMap = {};
        data.forEach(item => {
          const name = item.buyer_name;
          const amount = parseFloat(item.amount);
          if (!buyerMap[name]) buyerMap[name] = 0;
          buyerMap[name] += amount;
        });
        const buyerArr = Object.entries(buyerMap);
        setBuyer(buyerArr);
        setBuyerTotal(buyerArr.reduce((sum, [, amt]) => sum + amt, 0));
      } catch (error) {
        setBuyer([]);
        setBuyerTotal(0);
      }
    };
    fetchBuyer();
  }, []);

  // Fetch invoice data for debit side
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(INVOICE_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        // Only keep buyer_name and base_amount, and only if base_amount > 0
        const filtered = data
          .filter(item => item.buyer_name && item.base_amount > 0)
          .map(item => [item.buyer_name, item.base_amount]);
        setInvoiceDebits(filtered);
        // Aggregate invoice totals by buyer_name
        const totals = {};
        filtered.forEach(([name, amt]) => {
          if (!totals[name]) totals[name] = 0;
          totals[name] += amt;
        });
        setInvoiceTotalsByCompany(totals);
      } catch (error) {
        setInvoiceDebits([]);
        setInvoiceTotalsByCompany({});
      }
    };
    fetchInvoices();
  }, []);

  // Fetch company data for credit and debit side
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(COMPANY_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        // Aggregate company amounts by company_name
        const amounts = {};
        data.forEach(item => {
          if (item.company_name) {
            const amt = parseFloat(item.amount);
            if (!amounts[item.company_name]) amounts[item.company_name] = 0;
            amounts[item.company_name] += amt;
          }
        });
        setCompanyAmounts(amounts);
      } catch (error) {
        setCompanyAmounts({});
      }
    };
    fetchCompany();
  }, []);

  // Calculate company credit and debit based on invoice totals
  useEffect(() => {
    // Only run if both invoiceTotalsByCompany and companyAmounts are loaded
    if (Object.keys(invoiceTotalsByCompany).length === 0 && Object.keys(companyAmounts).length === 0) return;
    const credit = [];
    const debit = [];
    Object.entries(companyAmounts).forEach(([company, amount]) => {
      const invoiceTotal = invoiceTotalsByCompany[company] || 0;
      const diff = amount - invoiceTotal;
      if (diff > 0) {
        credit.push([company, diff]);
      } else if (diff < 0) {
        debit.push([company, Math.abs(diff)]);
      }
      // If diff === 0, show nothing
    });
    setCompanyCredit(credit);
    setCompanyDebit(debit);
  }, [invoiceTotalsByCompany, companyAmounts]);

  // Calculate remaining invoice debits (invoice total - company amount)
  const invoiceDebitsRemaining = Object.entries(invoiceTotalsByCompany)
    .map(([name, invoiceTotal]) => {
      const paid = companyAmounts[name] || 0;
      const remaining = invoiceTotal - paid;
      return [name, remaining];
    })
    .filter(([_, remaining]) => remaining > 0);

  // Calculate totals
  const capitalTotal = capital.reduce((sum, [, amt]) => sum + amt, 0);
  const loanTotal = loan.reduce((sum, [, amt]) => sum + amt, 0);
  const loanCreditTotal = loanCredit.reduce((sum, [, amt]) => sum + amt, 0);
  const loanDebitTotal = loanDebit.reduce((sum, [, amt]) => sum + amt, 0);
  const fixedAssetsTotal = fixedAssets.reduce((sum, [, amt]) => sum + amt, 0);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="balance-sheet-container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: 'black' }}>
        Balance Sheet
      </h1>
      <div className="balance-sheet-sections">
        {/* LEFT: Capital and Loan Credit */}
        <div className="left">
          <div className="balance-sheet-box-left">
            <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Capital</h4>
            <table className="balance-sheet-table" style={{ width: '100%' }}>
              <tbody>
                {capital.map(([name, amt]) => (
                  <tr key={name}>
                    <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                    <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                  </tr>
                ))}
                <tr className="balance-sheet-total">
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{capitalTotal}</td>
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Loan (Credit) section: only show if there are entries */}
          {loanCredit.length > 0 && (
            <div className="balance-sheet-box-left" style={{ marginTop: '30px' }}>
              <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Loan (Credit)</h4>
              <table className="balance-sheet-table" style={{ width: '100%' }}>
                <tbody>
                  {loanCredit.map(([name, amt]) => (
                    <tr key={name}>
                      <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                      <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                    </tr>
                  ))}
                  <tr className="balance-sheet-total">
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{loanCredit.reduce((sum, [, amt]) => sum + amt, 0)}</td>
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {/* Custom Types Credit Sections */}
          {Object.entries(customTypesCredit).map(([customType, entries]) => {
            const total = entries.reduce((sum, [, amt]) => sum + amt, 0);
            return (
              <div key={customType} className="balance-sheet-box-left" style={{ marginTop: '30px' }}>
                <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>{customType} (Credit)</h4>
                <table className="balance-sheet-table" style={{ width: '100%' }}>
                  <tbody>
                    {entries.map(([name, amt]) => (
                      <tr key={name}>
                        <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                        <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                      </tr>
                    ))}
                    <tr className="balance-sheet-total">
                      <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{total}</td>
                      <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          {/* Company Credit Section */}
          {companyCredit.length > 0 && (
            <div className="balance-sheet-box-left" style={{ marginBottom: '30px' }}>
              <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Sundry Creditrts</h4>
              <table className="balance-sheet-table" style={{ width: '100%' }}>
                <tbody>
                  {companyCredit.map(([name, amt]) => (
                    <tr key={name}>
                      <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                      <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                    </tr>
                  ))}
                  <tr className="balance-sheet-total">
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{companyCredit.reduce((sum, [, amt]) => sum + amt, 0)}</td>
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Fixed Assets, Loan Debit, Salary, and Buyer */}
        <div className="right">
          <div className="balance-sheet-box-right">
            <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Fixed Assets</h4>
            <table className="balance-sheet-table" style={{ width: '100%' }}>
              <tbody>
                {fixedAssets.map(([name, amt]) => (
                  <tr key={name}>
                    <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                    <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                  </tr>
                ))}
                <tr className="balance-sheet-total">
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{fixedAssetsTotal}</td>
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Loan (Debit) section: only show if there are entries */}
          {loanDebit.length > 0 && (
            <div className="balance-sheet-box-right" style={{ marginTop: '30px' }}>
              <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Loan (Debit)</h4>
              <table className="balance-sheet-table" style={{ width: '100%' }}>
                <tbody>
                  {loanDebit.map(([name, amt]) => (
                    <tr key={name}>
                      <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                      <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                    </tr>
                  ))}
                  <tr className="balance-sheet-total">
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{loanDebit.reduce((sum, [, amt]) => sum + amt, 0)}</td>
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="balance-sheet-box-right" style={{ marginTop: '30px' }}>
            <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Salary</h4>
            <table className="balance-sheet-table" style={{ width: '100%' }}>
              <tbody>
                {salary.map(([name, amt]) => (
                  <tr key={name}>
                    <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                    <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                  </tr>
                ))}
                <tr className="balance-sheet-total">
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{salaryTotal}</td>
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="balance-sheet-box-right" style={{ marginTop: '30px' }}>
            <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Buyer</h4>
            <table className="balance-sheet-table" style={{ width: '100%' }}>
              <tbody>
                {buyer.map(([name, amt]) => (
                  <tr key={name}>
                    <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                    <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                  </tr>
                ))}
                <tr className="balance-sheet-total">
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{buyerTotal}</td>
                  <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Custom Types Debit Sections */}
          {Object.entries(customTypesDebit).map(([customType, entries]) => {
            const total = entries.reduce((sum, [, amt]) => sum + amt, 0);
            return (
              <div key={customType} className="balance-sheet-box-right" style={{ marginTop: '30px' }}>
                <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>{customType} (Debit)</h4>
                <table className="balance-sheet-table" style={{ width: '100%' }}>
                  <tbody>
                    {entries.map(([name, amt]) => (
                      <tr key={name}>
                        <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                        <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                      </tr>
                    ))}
                    <tr className="balance-sheet-total">
                      <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{total}</td>
                      <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          {/* Invoice Debit Section */}
          {invoiceDebitsRemaining.length > 0 && (
            <div className="balance-sheet-box-right" style={{ marginBottom: '30px' }}>
              <h4 style={{ textAlign: 'left', borderBottom: '1px solid #aaa' }}>Sundry Debitorts</h4>
              <table className="balance-sheet-table" style={{ width: '100%' }}>
                <tbody>
                  {invoiceDebitsRemaining.map(([name, amt]) => (
                    <tr key={name}>
                      <td style={{ textAlign: 'center', width: '50%' }}>{amt}</td>
                      <td style={{ textAlign: 'center', width: '50%' }}>{name}</td>
                    </tr>
                  ))}
                  <tr className="balance-sheet-total">
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>{invoiceDebitsRemaining.reduce((sum, [, amt]) => sum + amt, 0)}</td>
                    <td style={{ textAlign: 'center', borderTop: '3px double #000', fontWeight: 'bold' }}>Total</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BalanceSheet;
