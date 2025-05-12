import React from "react";
import { useNavigate } from "react-router-dom";

const YearTable = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const startYear = 2022;
  const endYear = currentYear + 1;
  const yearRanges = [];

  // Populate the year ranges list
  for (let year = startYear; year < endYear; year++) {
    yearRanges.push(`${year}-${year + 1}`);
  }

  return (
    <div style={{ height: "100vh" }}>
      <div className="d-grid gap-2 d-md-flex justify-content-md-end pt-2 pb-2 px-4">
        <button
          onClick={() => navigate("/tax-invoice")}
          type="button"
          className="naw-biladd"
        >
          <i className="bi bi-plus-lg"></i> New Bills
        </button>
      </div>
      <div style={{ padding: "10px 21px 10px 82px" }}>
        <h2>Year Bills</h2>
        <div style={{ borderRadius: "10px", overflow: "hidden" }}>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Year Range</th>
              </tr>
            </thead>
            <div style={{ height: "5px" }}></div>
            <tbody>
              {yearRanges.map((yearRange) => (
                <tr
                  key={yearRange}
                  onClick={() => navigate(`/${yearRange}`)} // Navigates to year-specific page
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span className="text-dark">
                      <i className="bi bi-folder2"></i> <b>{yearRange}</b>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearTable;
 