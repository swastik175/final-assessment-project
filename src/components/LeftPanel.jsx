import React from 'react';
import nsdlLogo from '../assets/nsdl_logo.png';
import leftBankImg from '../assets/nsdl_watermark.png';

const LeftPanel = () => {
  return (
    <div className="login-left-container">
      <img
        src={nsdlLogo}
        alt="NSDL Payments Bank"
        className="nsdl-logo"
      />
      <div className="left-bank-box">
        <img
          src={leftBankImg}
          alt="NSDL Bank"
          className="back-logo"
        />
      </div>
    </div>
  );
};

export default LeftPanel;
