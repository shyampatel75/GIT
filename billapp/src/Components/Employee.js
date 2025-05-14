import React, { useState } from "react";

const Employee = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    joining_date: "",
    salary: "",
    email: "",
    number: "",
  });
  const [submittedData, setSubmittedData] = useState([]);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/api/banking/salary/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit employee data");
      }

      const data = await response.json();

      setSubmittedData([...submittedData, data]); // Add new data to table
      setFormData({ name: "", joining_date: "", salary: "", email: "", number: "" }); // Clear form
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div style={{padding:"0px 20px 0px 100px"}}>
      <h1 className="text-2xl font-bold mb-4">Employee Page</h1>

      <button
        onClick={toggleForm}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "Close Form" : "Add Employee"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 border rounded bg-gray-50 space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Joining Date</label>
            <input
              type="date"
              name="joining_date"
              required
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Salary</label>
            <input
              type="number"
              name="salary"
              required
              value={formData.salary}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              name="number"
              required
              value={formData.number}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit
          </button>

          {error && <p className="text-red-500 mt-2">Error: {error}</p>}
        </form>
      )}

      {submittedData.length > 0 && (
        <div className="overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">Submitted Employees</h2>
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Joining Date</th>
                <th className="p-2 border">Salary</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Number</th>
              </tr>
            </thead>
            <tbody>
              {submittedData.map((emp, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-2 border">{emp.name}</td>
                  <td className="p-2 border">
                    {emp.joining_date
                      ? new Date(emp.joining_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-2 border">₹ {Number(emp.salary).toFixed(2)}</td>
                  <td className="p-2 border">{emp.email}</td>
                  <td className="p-2 border">{emp.number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Employee;
