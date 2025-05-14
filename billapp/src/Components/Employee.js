import React, { useState, useEffect } from "react";

const SalaryManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    salary_name: "",
    salary_amount: "",
    salary_date: "",
    salary_email: "",
    salary_number: "",
  });
  const [salaryList, setSalaryList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/banking/employee/");
        if (!response.ok) throw new Error("Failed to fetch data");
        const data = await response.json();
        setSalaryList(data);
      } catch (err) {
        console.error(err);
        setError("Could not load salary data");
      }
    };

    fetchSalaries();
  }, []);

  const toggleForm = () => {
    setShowForm(!showForm);
    setSelectedPerson(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.salary_name,
      salary: formData.salary_amount,
      joining_date: formData.salary_date,
      email: formData.salary_email,
      number: formData.salary_number,
    };

    try {
      const response = await fetch("http://localhost:8000/api/banking/employee/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend validation error:", errorData);
        throw new Error("Submission failed. Check all fields.");
      }

      const data = await response.json();
      setSalaryList([...salaryList, data]);

      setFormData({
        salary_name: "",
        salary_amount: "",
        salary_date: "",
        salary_email: "",
        salary_number: "",
      });
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleNameClick = (person) => {
    setSelectedPerson(person);
  };

  const handleCloseDetails = () => {
    setSelectedPerson(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/banking/employee/${id}/`, {
          method: "DELETE",
        });

        if (response.ok) {
          setSalaryList((prev) => prev.filter((item) => item.id !== id));
          alert("Entry deleted successfully.");
        } else {
          alert("Failed to delete entry.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting entry.");
      }
    }
  };

  return (
    <div className="p-6" style={{ paddingLeft: "100px" }}>
      <h1 className="text-2xl font-bold mb-4">Salary Manager</h1>

      <button
        onClick={toggleForm}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "Cancel" : "Add Salary"}
      </button>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="p-4 border rounded bg-gray-50 space-y-4"
        >
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              type="text"
              name="salary_name"
              required
              value={formData.salary_name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Salary Amount</label>
            <input
              type="number"
              name="salary_amount"
              required
              value={formData.salary_amount}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Joining Date</label>
            <input
              type="date"
              name="salary_date"
              required
              value={formData.salary_date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="salary_email"
              required
              value={formData.salary_email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Phone Number</label>
            <input
              type="text"
              name="salary_number"
              required
              value={formData.salary_number}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit
          </button>

          {error && <p className="text-red-500 mt-2">Error: {error}</p>}
        </form>
      ) : (
        <>
          {salaryList.length > 0 && (
            <table className="w-full border border-gray-300 mt-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryList.map((salary, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td
                      className="p-2 border text-blue-600 cursor-pointer underline"
                      onClick={() => handleNameClick(salary)}
                    >
                      {salary.name}
                    </td>
                    <td className="p-2 border">₹ {salary.salary}</td>
                    <td className="p-2 border">
                      {new Date(salary.joining_date).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">{salary.email}</td>
                    <td className="p-2 border">{salary.number}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handleDelete(salary.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedPerson && (
            <div className="mt-6 p-4 border rounded bg-gray-100 shadow">
              <h2 className="text-xl font-semibold mb-2">Salary Details</h2>
              <p><strong>Name:</strong> {selectedPerson.name}</p>
              <p><strong>Amount:</strong> ₹ {selectedPerson.salary}</p>
              <p><strong>Date:</strong> {new Date(selectedPerson.joining_date).toLocaleDateString()}</p>
              <p><strong>Email:</strong> {selectedPerson.email}</p>
              <p><strong>Phone:</strong> {selectedPerson.number}</p>

              <button
                onClick={handleCloseDetails}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close Details
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalaryManager;
