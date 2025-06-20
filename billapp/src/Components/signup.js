import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeSlash } from "react-bootstrap-icons";

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

      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Registration error:", err);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="Signup visual"
          />
        </div>

        <div className="auth-form-container">
          <form onSubmit={handleSignup} className="auth-form">
            <h2 className="auth-title">Create an Account</h2>

            {error && <div className="auth-error">{error}</div>}

            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Enter your first name"
            />

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <label>Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              pattern="[0-9]{10}"
              title="Please enter a 10-digit mobile number"
              placeholder="Enter your mobile number"
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
              <span onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                {showPassword ? <EyeSlash /> : <Eye />}
              </span>
            </div>

            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
              />
            </div>

            <button type="submit" className="auth-button">Signup</button>

            <div className="auth-footer-text">
              Already have an account? <Link to="/">Login</Link>
            </div>
          </form>
        </div>
      </div>

      <footer className="auth-footer">
        <div>© 2025 YourCompany</div>
        <div className="social-icons">
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-google"></i></a>
          <a href="#"><i className="fab fa-linkedin-in"></i></a>
        </div>
      </footer>
    </section>
  );
};

export default Signup;
