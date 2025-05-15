import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import "./Signup.css"; // ⬅️ add this CSS file

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          mobile,
          password,
          password2: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = Object.entries(data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(" ") : value}`)
          .join("\n") || "Registration failed";
        setError(errorMsg);
        return;
      }

      alert("Account created successfully! Please log in.");
      navigate("/");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Registration error:", err);
    }
  };

  return (
    <section className="signup-container">
      <div className="signup-box">
        <div className="signup-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="illustration"
          />
        </div>
        <div className="signup-form-box">
          <form onSubmit={handleSignup} className="signup-form">
            <h2>Create an Account</h2>
            {error && <div className="error-message">{error}</div>}

            <label>First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter a valid email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Mobile Number</label>
            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              pattern="[0-9]{10}"
              title="Please enter a 10-digit mobile number"
              required
            />

            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                {showPassword ? <EyeSlash /> : <Eye />}
              </span>
            </div>

            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit">Signup</button>

            <p className="redirect">
              Already have an account? <Link to="/">Login</Link>
            </p>
          </form>
        </div>
      </div>

      <footer className="signup-footer">
        <div>&copy; 2025 Your Company</div>
        <div className="footer-links">
          <a href="#!">Facebook</a>
          <a href="#!">Twitter</a>
          <a href="#!">Google</a>
          <a href="#!">LinkedIn</a>
        </div>
      </footer>
    </section>
  );
};

export default Signup;
