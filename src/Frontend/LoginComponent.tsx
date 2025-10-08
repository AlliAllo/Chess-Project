import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // Unified login handler
  async function handleLogin(
    usernameOrEmail: string,
    passwordOrToken: string,
    googleLogin: boolean
  ) {
    try {
      const path = googleLogin ? "google" : "login";
      const body = googleLogin
        ? { credential: passwordOrToken }
        : { username: usernameOrEmail, password: passwordOrToken };

      const res = await fetch(`https://localhost:3001/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setMessage("Logged in successfully!");
        navigate("/");
      } else {
        setMessage(`${data.error || "Login failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error logging in — please try again.");
    }
  }

  return (
    <div className="loginContainer">
      <form
        className="loginForm"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(usernameOrEmail, password, false);
        }}
      >
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input type="checkbox" id="rememberMe" name="Remember me" />
        <label htmlFor="rememberMe" className="rememberMeLabel">
          Remember me
        </label>

        <button type="submit" className="loginButton">
          Login
        </button>

        <p className="signupPrompt">
          Don’t have an account?
          <a onClick={() => navigate("/signup")} href="#">
            Sign up here
          </a>
        </p>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="googleButtonWrapper">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (!credentialResponse.credential) return;

              const decoded: { email: string; name?: string; sub: string } =
                jwtDecode(credentialResponse.credential);

              handleLogin(
                decoded.email,
                credentialResponse.credential,
                true
              );
            }}
            onError={() => {
              console.log("Google login failed");
              setMessage("Google login failed. Try again.");
            }}
            theme="filled_blue"
            context="signin"
            useOneTap={false}
            auto_select={false}
          />
        </div>

        {message && <p className="loginMessage">{message}</p>}
      </form>
    </div>
  );
}
