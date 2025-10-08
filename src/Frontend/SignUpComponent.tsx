import { useState } from "react";
import './CSS/SignUp.css';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }
    
    if (password.length < 3) {
      setMessage("Password must be at least 3 characters long.");
      return;
    }

    if (!username || !email) {
      setMessage("Username and email are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("That email looks off. I'll let you off the hook this time tho.");
    }

    if (username.length < 3 || username.length > 20) {
      setMessage("Username must be between 3 and 20 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (password === password.toLowerCase()) {
      setMessage(`No capital letter in the big ${new Date().getFullYear()} is crazy work.`);
      return;
    }
      

    try {
      const res = await fetch("https://localhost:3001/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
         },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account created successfully!");
        navigate("/")
      } else {
        setMessage(`${data.error || "Signup failed"}`);
      }
    } catch (err) {
      setMessage("Network error — please try again.");
    }
  }


  return (
    <div className="signupContainer">
      
      <form className="signupForm" onSubmit={handleSignup}>
        <h2>Sign Up</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" className="signupButton">
          Sign Up
        </button>

        <p className="loginPrompt">
          Already have an account?&nbsp;
          <button
            type="button"
            className="linkButton"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </p>

        {message && <p className="signupMessage">{message}</p>}
      </form>
    </div>
  );
}
