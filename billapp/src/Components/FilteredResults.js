import React from "react";
import { useLocation } from "react-router-dom";

const FilteredResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const name = queryParams.get("name") || "N/A";
  const date = queryParams.get("date") || "N/A";
  const country = queryParams.get("country") || "N/A";

  return (
    
    <div className="container mt-4">
      <h2>Filtered Results</h2>
      <div className="card p-3">
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Country:</strong> {country}</p>
      </div>
    </div>
  );
};

export default FilteredResults;
