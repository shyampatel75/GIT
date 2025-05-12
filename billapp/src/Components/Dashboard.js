import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // Add this at the top of your file

const Dashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
    { label: "Bills", icon: "bi-receipt-cutoff", path: "/year-table" },
    { label: "Address", icon: "bi-house-add-fill", path: "/address" },
    { label: "Clients", icon: "bi-person-lines-fill", path: "/clients" },
    { label: "Accounting", icon: "bi-calculator-fill", path: "/billmanager" },
    { label: "Balance Sheet", icon: "bi-layout-text-sidebar-reverse", path: "/balancesheet" },
    { label: "Banking", icon: "bi-bank2", path: "/banking" },
    { label: "Buyer", icon: "bi-cart-fill", path: "/buyer" }, // Added Buyer button
    { label: "Settings", icon: "bi-gear-fill", path: "/setting" },
    { label: "Profile", icon: "bi-person-circle", path: "/profile" },
  ];

  const handleButtonClick = (path) => {
    navigate(path);
  };

  // Inline styles (same as before)
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    title: {
      textAlign: "center",
      marginBottom: "30px",
      color: "#333",
    },
    buttonsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "20px",
    },
    button: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      border: "1px solid #dee2e6",
      borderRadius: "8px",
      cursor: "pointer",
      height: "120px",
      transition: "all 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#e9ecef",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <div style={styles.buttonsContainer}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            style={styles.button}
            onClick={() => handleButtonClick(item.path)}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <i className={`bi ${item.icon}`} style={styles.icon}></i>
            <span style={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;