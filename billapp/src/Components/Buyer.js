import React from 'react';
import './buye.css'; // custom styling
import image from './images.jpg'; // ✅ correct
import image1 from './images__1_-removebg-preview.png';

const Login = () => {
  return (
    <div className="login-container"  style={{ backgroundImage: `url(${image})`}}>
      <div className="login-card">
        <div className="left-panel">
          <img src={image1} alt="plants" className="plants-img" />
        </div>
        <div className="right-panel">
          
          <h2>Let's get started.</h2>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button className="sign-in-btn">SIGN IN</button>
          <p>Do not have an account? <a href="#">Sign Up here!</a></p>
          
        </div>
      </div>
    </div>
  );
};

export default Login;
