import React from 'react';
import LeftPanel from './LeftPanel';
import LoginForm from './LoginForm';

const LoginPage = ({ onLoginSuccess }) => {
  return (
    <div className="login_container">
      <LeftPanel />
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
};

export default LoginPage;
