import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from './favicon.png';
import compunylogo from './logo-1.png';
import './Sidebar.css';

const Header = () => {
  return (
    <header className="header d-flex justify-content-between align-items-center px-3 py-2 sidebar-header-bg">
      <div>
        heloo
      </div>
      <div>
        <img src={compunylogo} alt="Company Logo" className="compunylogo-image" />
      </div>
      <div>
        <i className="bi bi-person-circle text-white fs-4"></i>
      </div>
    </header>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define routes and labels/icons
  const menuItems = [
      { label: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
      { label: "Bills", icon: "bi-receipt-cutoff", path: "/year-table" },
      { label: "Address", icon: "bi-house-add-fill", path: "/address" },
      { label: "Clients", icon: "bi-person-lines-fill", path: "/clients" },
      { label: "Accounting", icon: "bi-calculator-fill", path: "/billmanager" },
      { label: "Balance Sheet", icon: "bi-layout-text-sidebar-reverse", path: "/balancesheet" },
      { label: "Banking", icon: "bi-bank2", path: "/banking" },
      // { label: "Profile", icon: "bi-person-circle", path: "/clients" },
      { label: "Settings", icon: "bi-gear-fill", path: "/setting" },
      { label: "Profile", icon: "bi-person-circle", path: "/profile" }, // updated path

  ];

  return (
    <div className="d-flex">
      <div className="sidebar-fixed">
        <div className="sidebar-header p-3 text-center">
          <img src={logo} alt="Logo" className="icon-image" />
        </div>
        <ul className="sidebar-nav list-unstyled">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <i className={`bi ${item.icon}`}></i> <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow-1">
        <Header />
        {/* Main content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
