import React, { useState } from 'react';
import { loginUser } from '../services/authService';

const LoginForm = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: '' });
  const [pwdError, setPwdError] = useState('');

  // Change Password State
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [cpForm, setCpForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
  const [showCpPwd, setShowCpPwd] = useState({ old: false, new: false, confirm: false });
  const [cpError, setCpError] = useState('');

  const validatePassword = (val) => {
    // NSDL Rules: Uppercase, lowercase, number, special char, 8-16 chars
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (!val) return 'Password is required.';
    if (!regex.test(val)) return 'Password must be 8-16 characters with uppercase, lowercase, number and special character.';
    return '';
  };

  const getPwdValidationObj = (val) => {
    return {
      length: val.length >= 8 && val.length <= 16,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /\d/.test(val),
      special: /[@$!%*?&]/.test(val)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (!username.trim()) {
      setPwdError('Username is required.');
      return;
    }

    const pError = validatePassword(password);
    if (pError) {
      setPwdError(pError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(username, password);
      console.log('Decrypted Login Response:', response);
      
      const token = response?.access_token || response?.userInfo?.token || response?.data?.access_token;
      
      // Trigger Change Password if backend flag is true (mocking common scenario)
      if (response?.isFirstLogin || response?.passwordExpired || response?.message?.includes('change')) {
        setIsLoading(false);
        setCpForm({ oldPwd: password, newPwd: '', confirmPwd: '' });
        setShowChangePwd(true);
        return;
      }

      if (token) {
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user_data', JSON.stringify(response));
        
        setModal({
          show: true,
          title: 'SUCCESS',
          message: 'Congratulations!!! Login Successfull',
          type: 'success'
        });
      } else {
        setModal({
          show: true,
          title: 'FAILED',
          message: 'Invalid Username or Password.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Login process error:', error);
      let msg = 'Invalid Username or Password.';
      
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      
      setModal({
        show: true,
        title: 'FAILED',
        message: msg,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setCpError('');

    if (!cpForm.oldPwd) return setCpError('Old password is required.');
    
    const pError = validatePassword(cpForm.newPwd);
    if (pError) return setCpError(pError);

    if (cpForm.newPwd !== cpForm.confirmPwd) {
      return setCpError('New Password and Confirm Password do not match.');
    }

    if (cpForm.oldPwd === cpForm.newPwd) {
      return setCpError('New Password cannot be the same as the old password.');
    }

    setIsLoading(true);

    try {
      // Simulate API call for changing password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In reality, you'd call changePassword API here
      console.log('Password Changed for:', username);

      setShowChangePwd(false);
      setModal({
        show: true,
        title: 'SUCCESS',
        message: 'Password changed successfully. Please login with new password.',
        type: 'success'
      });
      setPassword('');
      
    } catch (error) {
      setCpError('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    const isSuccess = modal.type === 'success';
    setModal({ show: false, title: '', message: '', type: '' });
    if (isSuccess && onLoginSuccess && !showChangePwd && password) {
      onLoginSuccess();
    }
  };

  const valRules = getPwdValidationObj(cpForm.newPwd);

  return (
    <>
      {/* Full Screen Loader overlay */}
      {isLoading && (
        <div className="full-screen-loader">
          <div className="spinner"></div>
          <div style={{ color: '#8B0304', fontWeight: '500' }}>Processing Request...</div>
        </div>
      )}

      <div className="login_form">
        <h3>Welcome Back!</h3>
        <p>Please enter your details</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <input
              type="text"
              placeholder="Username*"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading || showChangePwd}
            />
          </div>

          <div className="form-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password*"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading || showChangePwd}
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPassword(p => !p)}
              disabled={isLoading || showChangePwd}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

          {pwdError && <div className="field-error-msg">{pwdError}</div>}

          <div className="form-options-row">
            <label className="remember_me_text">
              <input type="checkbox" disabled={isLoading || showChangePwd} /> Remember me
            </label>
            <a href="#" className="forgot-password-link" onClick={() => setShowChangePwd(true)}>Change Password?</a>
          </div>

          <button type="submit" className="login_btn" disabled={isLoading || showChangePwd}>
            Login
          </button>
        </form>

        {/* Change Password Modal */}
        {showChangePwd && (
          <div className="nsdl-modal-overlay">
            <div className="nsdl-modal change-pwd-modal">
              <div className="nsdl-modal-header" style={{ color: '#8B0304' }}>Change Password</div>
              <div className="nsdl-modal-body">
                <form onSubmit={handleChangePasswordSubmit}>
                  
                  <div className="form-field">
                    <input
                      type={showCpPwd.old ? 'text' : 'password'}
                      placeholder="Old Password*"
                      value={cpForm.oldPwd}
                      onChange={e => setCpForm({...cpForm, oldPwd: e.target.value})}
                      disabled={isLoading}
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowCpPwd({...showCpPwd, old: !showCpPwd.old})}>
                       {showCpPwd.old ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="form-field">
                    <input
                      type={showCpPwd.new ? 'text' : 'password'}
                      placeholder="New Password*"
                      value={cpForm.newPwd}
                      onChange={e => {
                        setCpForm({...cpForm, newPwd: e.target.value});
                        if (cpError) setCpError('');
                      }}
                      disabled={isLoading}
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowCpPwd({...showCpPwd, new: !showCpPwd.new})}>
                       {showCpPwd.new ? 'Hide' : 'Show'}
                    </button>
                    {/* Live Validation Guidance */}
                    {cpForm.newPwd.length > 0 && (
                      <ul className="validation-list">
                        <li className={valRules.length ? 'valid' : 'invalid'}>8-16 characters</li>
                        <li className={valRules.upper ? 'valid' : 'invalid'}>At least one uppercase letter</li>
                        <li className={valRules.lower ? 'valid' : 'invalid'}>At least one lowercase letter</li>
                        <li className={valRules.number ? 'valid' : 'invalid'}>At least one number</li>
                        <li className={valRules.special ? 'valid' : 'invalid'}>At least one special character (@$!%*?&)</li>
                      </ul>
                    )}
                  </div>

                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <input
                      type={showCpPwd.confirm ? 'text' : 'password'}
                      placeholder="Confirm New Password*"
                      value={cpForm.confirmPwd}
                      onChange={e => setCpForm({...cpForm, confirmPwd: e.target.value})}
                      disabled={isLoading}
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowCpPwd({...showCpPwd, confirm: !showCpPwd.confirm})}>
                       {showCpPwd.confirm ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {cpError && <div className="field-error-msg" style={{ marginTop: '8px' }}>{cpError}</div>}

                  <button type="submit" className="login_btn" disabled={isLoading}>
                    Submit
                  </button>
                </form>
              </div>
              <div className="nsdl-modal-footer">
                <button onClick={() => setShowChangePwd(false)} disabled={isLoading}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Generic Alert Modal */}
        {modal.show && (
          <div className="nsdl-modal-overlay">
            <div className={`nsdl-modal ${modal.type}`}>
              <div className="nsdl-modal-header">{modal.title}</div>
              <div className="nsdl-modal-body">{modal.message}</div>
              <div className="nsdl-modal-footer">
                <button onClick={handleModalClose}>Okay</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LoginForm;
