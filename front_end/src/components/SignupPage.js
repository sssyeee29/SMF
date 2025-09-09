import React, { useState } from "react";
import './SignupPage.css';
import { useTranslation } from 'react-i18next';

const SignupPage = ({ onSignup, onBackToLogin }) => {
  const { t } = useTranslation();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert(t("signup.alert.nameRequired"));
      return;
    }
    if (!id.trim()) {
      alert(t("signup.alert.idRequired"));
      return;
    }
    if (!pw.trim()) {
      alert(t("signup.alert.pwRequired"));
      return;
    }
    if (pw !== confirmPw) {
      alert(t("signup.alert.pwMismatch"));
      return;
    }

    const success = onSignup(id, pw, name);
    if (success) {
      setId("");
      setPw("");
      setConfirmPw("");
      setName("");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2 className="signup-title">{t("signup.title")}</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder={t("signup.placeholder.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="signup-input"
          />
          <input
            type="text"
            placeholder={t("signup.placeholder.id")}
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="signup-input"
          />
          <input
            type="password"
            placeholder={t("signup.placeholder.pw")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="signup-input"
          />
          <input
            type="password"
            placeholder={t("signup.placeholder.confirmPw")}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="signup-input"
          />
          <button type="submit" className="signup-button">
            {t("signup.button")}
          </button>
        </form>
        <div className="login-link" onClick={onBackToLogin}>
          {t("signup.toLogin")}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
