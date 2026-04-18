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
      
      // Step 1: Detect if reset is required
      if (response?.isPasswordResetRequired === true) {
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

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

        {/* Change Password Modal (Matching Screenshot) */}
        {showChangePwd && (
          <div className="nsdl-modal-overlay" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="change-pwd-card" style={{ background: '#fff', width: '420px', borderRadius: '8px', padding: '32px', boxShadow: '0 12px 48px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 600, color: '#333' }}>Change Password</h2>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#666' }}>Enter your old password and new password</p>

              <form onSubmit={handleChangePasswordSubmit}>
                <div className="form-field" style={{ position: 'relative', marginBottom: '16px' }}>
                  <input
                    type={showCpPwd.old ? 'text' : 'password'}
                    placeholder="Old Password*"
                    value={cpForm.oldPwd}
                    onChange={e => setCpForm({...cpForm, oldPwd: e.target.value})}
                    style={{ width: '100%', height: '48px', padding: '0 45px 0 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, old: !showCpPwd.old})} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#595959' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       {showCpPwd.old ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /> : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />}
                       <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                <div className="form-field" style={{ position: 'relative', marginBottom: '16px' }}>
                  <input
                    type={showCpPwd.new ? 'text' : 'password'}
                    placeholder="New Password*"
                    value={cpForm.newPwd}
                    onChange={e => setCpForm({...cpForm, newPwd: e.target.value})}
                    style={{ width: '100%', height: '48px', padding: '0 45px 0 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, new: !showCpPwd.new})} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#595959' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       {showCpPwd.new ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /> : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />}
                       <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                <div className="form-field" style={{ position: 'relative', marginBottom: '24px' }}>
                  <input
                    type={showCpPwd.confirm ? 'text' : 'password'}
                    placeholder="Confirm Password*"
                    value={cpForm.confirmPwd}
                    onChange={e => setCpForm({...cpForm, confirmPwd: e.target.value})}
                    style={{ width: '100%', height: '48px', padding: '0 45px 0 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <button type="button" onClick={() => setShowCpPwd({...showCpPwd, confirm: !showCpPwd.confirm})} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#595959' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       {showCpPwd.confirm ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /> : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />}
                       <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                {cpError && <div style={{ color: '#a80000', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>{cpError}</div>}

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button type="button" onClick={handleCancelReset} style={{ flex: 1, height: '44px', background: '#fff', border: '1px solid #a80000', color: '#a80000', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, height: '44px', background: '#8B0304', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Verify Otp</button>
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
