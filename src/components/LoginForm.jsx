import React, { useState } from 'react';
import { loginUser } from '../services/authService';

const LoginForm = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: '' });
  const [pwdError, setPwdError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
    setUsernameError('');
    setPasswordError('');
    setPwdError('');

    let hasError = false;
    if (!username.trim()) {
      setUsernameError('Username is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }
    if (hasError) return;

    const pError = validatePassword(password);
    if (pError) {
      setPwdError(pError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(username, password);
      console.log('--- LOGIN RESPONSE AUDIT ---');
      console.log('Full Decrypted Response:', response);
      console.log('isPasswordResetRequired Status:', response?.isPasswordResetRequired);
      console.log('----------------------------');
      
      const token = response?.access_token || response?.userInfo?.token || response?.data?.access_token;
      
      // TEMPORARY: Bypassing reset check for development as per user request
      // Mandatory Check: if isPasswordResetRequired is true (as bool or string "true"), FORCE popup and BLOCK dashboard
      const resetRequired = false; // Original logic: response?.isPasswordResetRequired === true || response?.isPasswordResetRequired === "true";
      
      if (resetRequired) {
        console.warn('⚠️ ACTION REQUIRED: Password reset is mandatory for this user.');
        setIsLoading(false);
        setCpForm({ oldPwd: password, newPwd: '', confirmPwd: '' });
        setShowChangePwd(true);
        return; // HALT HERE - Do not proceed to dashboard success modal
      }

      // If isPasswordResetRequired is false (or undefined), proceed to Dashboard as per current flow
      console.log('✅ LOGIN AUTHORIZED: Proceeding to Dashboard.');
      if (token) {
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user_data', JSON.stringify(response));
        sessionStorage.setItem('login_timestamp', Date.now().toString());
        
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
      
      // If there's no response object, it's likely a CORS or Network error
      if (!error.response) {
        msg = 'Something went wrong, please try again!';
      } else if (error.response?.data?.message) {
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

    if (!cpForm.oldPwd || !cpForm.newPwd || !cpForm.confirmPwd) {
      return setCpError('All fields are mandatory.');
    }
    
    const pError = validatePassword(cpForm.newPwd);
    if (pError) return setCpError(pError);

    if (cpForm.newPwd !== cpForm.confirmPwd) {
      return setCpError('Passwords do not match.');
    }

    if (cpForm.oldPwd === cpForm.newPwd) {
      return setCpError('New Password cannot be same as old.');
    }

    // Logic for "Verify Otp" - Collect data and wait for next step
    console.log('Verifying OTP for password change:', {
      old: cpForm.oldPwd,
      new: cpForm.newPwd,
      confirm: cpForm.confirmPwd
    });
    
    // For now, just show a success or processing log as per user request
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('OTP Verification Triggered. Proceeding to next step...');
    }, 1000);
  };

  const handleModalClose = () => {
    const isSuccess = modal.type === 'success';
    setModal({ show: false, title: '', message: '', type: '' });
    if (isSuccess && onLoginSuccess && !showChangePwd && password) {
      onLoginSuccess();
    }
  };

  const handleCancelReset = () => {
    setShowChangePwd(false);
    setUsername('');
    setPassword('');
    sessionStorage.clear();
    // This effectively keeps them on the login page as we didn't call onLoginSuccess
  };

  const valRules = getPwdValidationObj(cpForm.newPwd);

  return (
    <>
      {/* Full Screen Loader overlay */}
      {isLoading && (
        <div className="full-screen-loader" style={{ zIndex: 30000 }}>
          <div className="spinner"></div>
          <div style={{ color: '#8B0304', fontWeight: '500' }}>Processing...</div>
        </div>
      )}

      <div className="login_form">
        <h3>Welcome Back!</h3>
        <p>Please enter your details</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field" style={{ marginBottom: usernameError ? '4px' : '16px' }}>
            <input
              type="text"
              placeholder="Username*"
              value={username}
              onChange={e => { setUsername(e.target.value); if(usernameError) setUsernameError(''); }}
              onBlur={() => { if (!username.trim()) setUsernameError('Username is required.'); }}
              disabled={isLoading || showChangePwd}
              style={{ borderColor: usernameError ? '#d32f2f' : '#d9d9d9' }}
            />
          </div>
          {usernameError && <div style={{ color: '#d32f2f', fontSize: '12px', marginBottom: '12px', textAlign: 'left', paddingLeft: '4px' }}>{usernameError}</div>}

          <div className="form-field" style={{ marginBottom: passwordError ? '4px' : '16px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password*"
              value={password}
              onChange={e => { setPassword(e.target.value); if(passwordError) setPasswordError(''); }}
              onBlur={() => { if (!password) setPasswordError('Password is required.'); }}
              disabled={isLoading || showChangePwd}
              style={{ borderColor: passwordError ? '#d32f2f' : '#d9d9d9' }}
            />
            <button
              type="button"
              className="pwd-toggle"
              onClick={() => setShowPassword(p => !p)}
              disabled={isLoading || showChangePwd}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
          {passwordError && <div style={{ color: '#d32f2f', fontSize: '12px', marginBottom: '12px', textAlign: 'left', paddingLeft: '4px' }}>{passwordError}</div>}

          {pwdError && <div className="field-error-msg">{pwdError}</div>}

          <div className="form-options-row">
            <label className="remember_me_text">
              <input type="checkbox" disabled={isLoading || showChangePwd} /> Remember me
            </label>
            <a href="#" className="forgot-password-link">Forgot Password?</a>
          </div>

          <button type="submit" className="login_btn" disabled={isLoading || showChangePwd}>
            Login
          </button>
        </form>

        {/* Change Password Modal (High Fidelity) */}
        {showChangePwd && (
          <div className="nsdl-modal-overlay" style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30000 
          }}>
            <div className="change-pwd-card" style={{ 
              background: '#fff', 
              width: '440px', 
              borderRadius: '12px', 
              padding: '40px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
              textAlign: 'center',
              position: 'relative',
              animation: 'nsdlModalFade 0.3s ease-out'
            }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Change Password</h2>
              <p style={{ margin: '0 0 32px', fontSize: '15px', color: '#666', fontWeight: 400 }}>Enter your old password and new password</p>

              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showCpPwd.old ? 'text' : 'password'}
                    placeholder="Old Password*"
                    value={cpForm.oldPwd}
                    onChange={e => setCpForm({...cpForm, oldPwd: e.target.value})}
                    style={{ 
                      width: '100%', 
                      height: '52px', 
                      padding: '0 48px 0 16px', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '6px', 
                      fontSize: '15px', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      display: 'block'
                    }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, old: !showCpPwd.old})} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8c8c8c', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showCpPwd.old ? 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> : 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    }
                  </button>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showCpPwd.new ? 'text' : 'password'}
                    placeholder="New Password*"
                    value={cpForm.newPwd}
                    onChange={e => setCpForm({...cpForm, newPwd: e.target.value})}
                    style={{ 
                      width: '100%', 
                      height: '52px', 
                      padding: '0 48px 0 16px', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '6px', 
                      fontSize: '15px', 
                      outline: 'none',
                      boxSizing: 'border-box',
                      display: 'block'
                    }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, new: !showCpPwd.new})} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8c8c8c', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showCpPwd.new ? 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> : 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    }
                  </button>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showCpPwd.confirm ? 'text' : 'password'}
                    placeholder="Confirm Password*"
                    value={cpForm.confirmPwd}
                    onChange={e => setCpForm({...cpForm, confirmPwd: e.target.value})}
                    style={{ 
                      width: '100%', 
                      height: '52px', 
                      padding: '0 48px 0 16px', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '6px', 
                      fontSize: '15px', 
                      outline: 'none',
                      boxSizing: 'border-box',
                      display: 'block'
                    }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, confirm: !showCpPwd.confirm})} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8c8c8c', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showCpPwd.confirm ? 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> : 
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    }
                  </button>
                </div>

                {cpError && <div style={{ color: '#d32f2f', fontSize: '13px', fontWeight: 500, textAlign: 'left', width: '100%', marginTop: '-8px' }}>⚠️ {cpError}</div>}

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', width: '100%' }}>
                  <button type="button" onClick={handleCancelReset} style={{ 
                    flex: 1, 
                    height: '50px', 
                    background: '#fff', 
                    border: '1.5px solid #8B0304', 
                    color: '#8B0304', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 700,
                    fontSize: '15px'
                  }}>Cancel</button>
                  <button type="submit" style={{ 
                    flex: 1, 
                    height: '50px', 
                    background: '#8B0304', 
                    border: 'none', 
                    color: '#fff', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 4px 12px rgba(139, 3, 4, 0.25)'
                  }}>Verify Otp</button>
                </div>
              </form>
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
