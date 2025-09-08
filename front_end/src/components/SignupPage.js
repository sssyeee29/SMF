import React, {useState} from "react";
import './SignupPage.css';

const SignupPage = ({ onSignup, onBackToLogin }) => {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // 입력값 검증
        if (!name.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }
        if (!id.trim()) {
            alert("아이디를 입력해주세요.");
            return;
        }

        if (!pw.trim()) {
            alert("비밀번호를 입력해주세요.");
            return;
        }


        if (pw !== confirmPw) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        // 회원가입 처리
        const success = onSignup(id, pw, name);

        if (success) {
            // 입력값 초기화
            setId("");
            setPw("");
            setConfirmPw("");
            setName("");
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-container">
                <h2 className="signup-title">회원가입</h2>
                <form onSubmit={handleSubmit} className="signup-form">
                    <input
                        type="text"
                        placeholder="이름"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="signup-input"
                    />
                    <input
                        type="text"
                        placeholder="아이디"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        className="signup-input"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        className="signup-input"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호 확인"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        className="signup-input"
                    />
                    <button
                        type="submit"
                        className="signup-button"
                    >
                        가입하기
                    </button>
                </form>
                <div className="login-link" onClick={onBackToLogin}>
                    이미 계정이 있으신가요? 로그인
                </div>
            </div>
        </div>
    );
};

export default SignupPage;