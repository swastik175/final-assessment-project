import React from 'react';
import bankLogo from '../assets/bank.png';
import leftWatermark from '../assets/nsdl_watermark.png';

const LeftPanel = () => {
  return (
    <div className="login-left-container">
      <div className="nsdl-brand-stack">
        <img
          src={bankLogo}
          alt="NSDL Payments Bank"
          className="nsdl-logo"
        />
        <div className="left-bank-box">
          <img
            src={leftWatermark}
            alt="NSDL Bank"
            className="back-logo"
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
