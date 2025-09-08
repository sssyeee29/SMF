import React, {useState} from "react";
import './LoginPage.css';


const LoginPage = ({ onLogin , onSignupClick }) => {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(id, pw); // App.js에 전달해서 검사
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">로그인</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="login-input"
          />
          <button
            type="submit"
            className="login-button"
          >
            로그인
          </button>
        </form>
          <div className="signup-link" onClick={onSignupClick}>
              회원가입
          </div>
      </div>
    </div>
  );
};

export default LoginPage;