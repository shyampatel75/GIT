import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [error, setError] = useState(null);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [bankingEmployee, setBankingEmployee] = useState(null);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/employees/${id}/`);
                if (!response.ok) throw new Error("Failed to fetch employee");
                const data = await response.json();
                setEmployee(data);
            } catch (err) {
                console.error(err);
                setError("Unable to load employee details.");
            }
        };

        fetchEmployee();
    }, [id]);

    useEffect(() => {
        const fetchAdditionalData = async () => {
            if (!employee) return;

            try {
                // Fetch salary history
                const salaryRes = await fetch("http://localhost:8000/api/banking/salary/");
                const salaryData = await salaryRes.json();
                const filteredSalaries = salaryData.filter(
                    (entry) => entry.salary_name === employee.name
                );
                setSalaryHistory(filteredSalaries);

                // Fetch banking employee info
                const empRes = await fetch("http://localhost:8000/api/banking/employee/");
                const empData = await empRes.json();
                const matchedBankingEmployee = empData.find(
                    (entry) => entry.name === employee.name
                );
                setBankingEmployee(matchedBankingEmployee);
            } catch (err) {
                console.error("Error fetching salary or banking employee data:", err);
            }
        };

        fetchAdditionalData();
    }, [employee]);

    if (error) return <p className="text-red-600">{error}</p>;
    if (!employee) return <p>Loading...</p>;

    return (
        <div className="p-6 max-w-5xl mx-auto" style={{ paddingLeft: "100px" }}>
            <h1 className="text-2xl font-bold mb-4">Employee Details</h1>

            <div className="border rounded p-4 bg-white shadow space-y-2 mb-6">
                <p><strong>Name:</strong> {employee.name}</p>
                <p><strong>Salary:</strong> ₹ {employee.salary}</p>
                <p><strong>Joining Date:</strong> {new Date(employee.joining_date).toLocaleDateString()}</p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Phone:</strong> {employee.number}</p>
            </div>



            <h2 className="text-xl font-semibold mb-3">Salary History</h2>
            {salaryHistory.length > 0 ? (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Date</th>
                            <th className="border px-4 py-2">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaryHistory.map((entry, index) => (
                            <tr key={index} className="bg-white hover:bg-gray-50">
                                <td className="border px-4 py-2">
                                    {new Date(entry.salary_date).toLocaleDateString("en-GB")}
                                </td>
                                <td className="border px-4 py-2">₹ {entry.salary_amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-gray-500">No salary history available for this employee.</p>
            )}


            <button
                onClick={() => navigate(-1)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Back
            </button>
        </div>
    );
};

export default EmployeeDetails;
