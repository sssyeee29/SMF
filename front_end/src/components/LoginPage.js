import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import './LoginPage.css';

const LoginPage = ({ onLogin, onSignupClick }) => {
  const { t } = useTranslation();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(id, pw); // App.js에 전달해서 검사
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">{t("login.title")}</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder={t("login.username")}
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder={t("login.password")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">
            {t("login.button")}
          </button>
        </form>
        <div className="signup-link" onClick={onSignupClick}>
          {t("login.signup")}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
