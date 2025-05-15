import React, { useState, useEffect } from "react";

const IncomeExpenditure = () => {
const [data, setData] = useState([]);
const [selectedButton, setSelectedButton] = useState("");
const [loading, setLoading] = useState(false);

const buttons = [
{ name: "Company Bill", api: "http\://localhost:8000/api/banking/buyer/" },
{ name: "Buyer", api: "http\://localhost:8000/api/banking/company/" },
{ name: "Salary", api: "http\://localhost:8000/api/banking/salary/" },
{ name: "Other", api: "http\://localhost:8000/api/banking/other/" },
];

const fetchData = async (apiUrl) => {
try {
setLoading(true);
const response = await fetch(apiUrl);
const jsonData = await response.json();
setData(jsonData);
setLoading(false);
} catch (error) {
console.error("Error fetching data:", error);
setLoading(false);
}
};

return (

 <div className="d-flex" style={{ height: "100vh" }}>
  {/* Left Sidebar */}
  <div
    className="bg-light border-end d-flex flex-column"
    style={{ width: "350px",paddingLeft:"80px" }} // or any fixed width you prefer
  >
    <div className="p-3 border-bottom">
      <h4>Income & Expenditure</h4>
    </div>
    <div
      className="d-flex flex-column align-items-center justify-content-around flex-grow-1"
    >
      {buttons.map((button, index) => (
        <button
          key={index}
          className={`btn btn-primary mb-3 ${selectedButton === button.name ? "active" : ""}`}
          onClick={() => {
            setSelectedButton(button.name);
            fetchData(button.api);
          }}
          style={{ height: "70px", width: "80%" }}
        >
          {button.name}
        </button>
      ))}
    </div>
  </div>

  {/* Right Content */}
  <div className="flex-grow-1 p-4">
    {loading ? (
      <div className="text-center">Loading...</div>
    ) : data.length > 0 ? (
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                {Object.values(item).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
     <div className="text-center mt-5">
  <img
    src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
    alt="No data"
    style={{ width: "120px", opacity: 0.5 }}
  />
  <h5 className="mt-3 text-muted">No data to display</h5>
  <p className="text-secondary">Select a category from the sidebar to get started.</p>
</div>

    )}
  </div>
</div>


);
};

export default IncomeExpenditure;

