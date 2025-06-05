import React, { useEffect, useState } from "react";

const Buyer = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    const fetchIndianStates = async () => {
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            country: "India",
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error("Failed to fetch states");
        }

        setStates(data.data.states);
      } catch (error) {
        console.error("Error fetching Indian states:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndianStates();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Buyer Page</h1>

      <label htmlFor="state">Select State:</label><br />
      {loading ? (
        <p>Loading states...</p>
      ) : states.length > 0 ? (
        <select
          id="state"
          name="state"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">-- Select State --</option>
          {states.map((state, index) => (
            <option key={index} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      ) : (
        <p>No states found. Please check the API response.</p>
      )}
    </div>
  );
};

export default Buyer;
