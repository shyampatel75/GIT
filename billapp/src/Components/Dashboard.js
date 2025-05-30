import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Newscustomerchart from "./Newscustomerchart";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuItems = [
    { label: "Bills", icon: "bi-receipt-cutoff", path: "/year-table" },
    { label: "Address", icon: "bi-house-add-fill", path: "/address" },
    { label: "Clients", icon: "bi-person-lines-fill", path: "/clients" },
    { label: "Accounting", icon: "bi-calculator-fill", path: "/billmanager" },
    { label: "Balance Sheet", icon: "bi-layout-text-sidebar-reverse", path: "/balancesheet" },
    { label: "Banking", icon: "bi-bank2", path: "/banking" },
    { label: "Buyer", icon: "bi-cart-fill", path: "/buyer" },
    { label: "Employee", icon: "bi-person-badge-fill", path: "/employee" },
    { label: "Income Expenditure", icon: "bi-wallet-fill", path: "/incomeExpenditure" },
  ];

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      setLoading(false);
    } catch (err) {
      console.error("Token verification failed:", err);
      setError("Authentication failed. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [navigate]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const handleButtonClick = (path) => {
    navigate(path);
  };

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    title: {
   textalign: "start",
    marginbottom: "30px",
    color: "rgb(51, 51, 51)",
    fontsize: "20px",
    marginBottom:"20px"
    },
 
    chartContainer: {
      marginBottom: "40px",
      padding: "20px",
   
      borderRadius: "8px",
    },
    icon: {
      fontSize: "2rem",
      marginBottom: "10px",
      color: "#0d6efd",
    },
    label: {
      fontSize: "1rem",
      fontWeight: "500",
      color: "#333",
    },
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-danger mt-5">{error}</div>;
  }

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Dashboard</h1>

        {/* <div style={styles.chartContainer}>
          <h4 className="mb-3">Customer Overview</h4>
          <Newscustomerchart />
        </div> */}

        <div className="dashboard-buttons-container">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="dashboard-button"
              onClick={() => handleButtonClick(item.path)}
            >
              <i className={`bi ${item.icon}`} style={styles.icon}></i>
              <span style={styles.label}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
