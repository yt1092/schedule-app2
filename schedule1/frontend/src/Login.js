import React, { useState } from "react";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "ログインに失敗しました");
      }

      const data = await response.json();
      localStorage.setItem("userId", data.id);
      localStorage.setItem("userEmail", data.email);
      onLoginSuccess(data.id, data.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "登録に失敗しました");
      }

      await response.json();
      setError("");
      setEmail("");
      setPassword("");
      setIsRegister(false);
      alert("登録が完了しました。ログインしてください。");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Schedule Management</h1>
        
        {isRegister ? (
          <form onSubmit={handleRegister}>
            <h2>アカウント登録</h2>
            <div className="form-group">
              <label htmlFor="email">メールアドレス:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">パスワード:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? "登録中..." : "登録"}
            </button>
            <div className="toggle-auth">
              <p>
                既にアカウントをお持ちですか？
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError("");
                    setPassword("");
                  }}
                >
                  ログイン
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <h2>ログイン</h2>
            <div className="form-group">
              <label htmlFor="email">メールアドレス:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">パスワード:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
            <div className="toggle-auth">
              <p>
                アカウントをお持ちでありませんか？
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError("");
                    setPassword("");
                  }}
                >
                  登録
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
