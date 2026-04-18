import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { getUserDashboard, getAuditTrail, getUserListReport, getUserListByDateRange, logoutUser } from '../services/authService';
import nsdlLogo from '../assets/nsdl_logo.png';

const Dashboard = () => {
  const [userName, setUserName] = useState('Loading...');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [userReqSearchMode, setUserReqSearchMode] = useState('date');
  const [activeProfileTab, setActiveProfileTab] = useState('Basic Details');

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'User Approved', message: 'Gaurav Rana (CBC000149) has been approved successfully.', type: 'APPROVED', time: '2 mins ago', unread: true },
    { id: 2, title: 'Pending Request', message: 'New enrollment request from Adeline Ballard is pending review.', type: 'PENDING', time: '1 hour ago', unread: true },
    { id: 3, title: 'Verification Failed', message: 'Bank resolution document for Retailer SP028 mismatch.', type: 'REJECTED', time: '3 hours ago', unread: false },
    { id: 4, title: 'System Update', message: 'NSDL onboarding service will undergo maintenance at 12 AM.', type: 'INFO', time: '5 hours ago', unread: false }
  ]);

  // User List Report state
  const [auditData, setAuditData] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [searchMode, setSearchMode] = useState('date');
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', username: '', userType: 'ALL', status: 'ALL' });

  // UI State for Pagination & Selection
  const [selectedRows, setSelectedRows] = useState([]);
  
  // User Request Pagination
  const [requestPage, setRequestPage] = useState(1);
  const [requestRowsPerPage, setRequestRowsPerPage] = useState(10);

  // User List Report Pagination
  const [listReportPage, setListReportPage] = useState(1);
  const [listReportRowsPerPage, setListReportRowsPerPage] = useState(10);

  // Audit Trail Specific State
  const [auditSearchVal, setAuditSearchVal] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditTableData, setAuditTableData] = useState([]);
  const [isAuditTableLoading, setIsAuditTableLoading] = useState(false);
  const [hasSearchedAudit, setHasSearchedAudit] = useState(false);

  const handleAuditSearch = async () => {
    if (!auditSearchVal && !auditDateFrom) return;
    setIsAuditTableLoading(true);
    setHasSearchedAudit(true);
    const token = sessionStorage.getItem('access_token');
    
    // Explicitly call the audit search API
    const params = {
      username: auditSearchVal,
      fromDate: auditDateFrom,
      toDate: auditDateTo
    };

    try {
      setAuditTableData([]); // Reset table
      const data = await getAuditTrail(token, params);
      // Backend usually returns list in resultObj.data or as raw array
      let finalData = [];
      if (Array.isArray(data)) {
        finalData = data;
      } else if (data?.resultObj?.data) {
        finalData = Array.isArray(data.resultObj.data) ? data.resultObj.data : [data.resultObj.data];
      }
      setAuditTableData(finalData);
    } catch (error) {
      console.error("Audit Search Failed:", error);
      // Redundant check for 401
      if (error.response?.status == 401 || error.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsAuditTableLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('access_token');
      if (!token) return;

      try {
        const data = await getUserDashboard(token);
        // Robust name extraction
        const firstName = data.firstName || data.first_name || data?.userInfo?.firstName || '';
        const lastName = data.lastName || data.last_name || data?.userInfo?.lastName || '';
        const fullName = data?.userInfo?.userName || data?.userInfo?.name || data?.username || '';

        if (firstName || lastName) {
          setUserName(`${firstName} ${lastName}`.trim());
        } else if (fullName) {
          setUserName(fullName);
        } else {
          setUserName('User');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // If the initial fetch is unauthorized, boot the user out immediately
        if (error.response?.status == 401 || error.message?.includes('401')) {
          handleLogout();
          return;
        }
        const userData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
        setUserName(userData?.userInfo?.username || userData?.username || 'User');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loginTime = sessionStorage.getItem('login_timestamp');
    if (!loginTime) return;

    const timeoutDuration = 20 * 60 * 1000; // 20 minutes
    const elapsed = Date.now() - parseInt(loginTime);
    const remainingTime = timeoutDuration - elapsed;

    if (remainingTime <= 0) {
      handleLogout();
    } else {
      const timer = setTimeout(() => {
        alert("Session Expired: You have been logged out for security purposes. Please login again.");
        handleLogout();
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (activeMenu === 'user-list-report' || activeMenu === 'audit-trail') {
      loadAuditLogs();
    }
  }, [activeMenu, filters.fromDate, filters.toDate]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setShowProfileMenu(false);
      setShowNotifications(false);
      setShowUserTypeDropdown(false);
      setShowStatusDropdown(false);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    const token = sessionStorage.getItem('access_token');
    try {
      const userDataStr = sessionStorage.getItem('user_data');
      let defaultUser = "CBC000095";
      let defaultRole = "CBC";

      if (userDataStr) {
        const parsed = JSON.parse(userDataStr);
        defaultUser = parsed?.userInfo?.username || parsed?.username || defaultUser;
        defaultRole = parsed?.userInfo?.userRole || parsed?.userRole || defaultRole;
      }

      let payload = {
        username: filters.username || defaultUser,
        userRole: filters.userType === 'ALL' ? defaultRole : filters.userType
      };

      const data = await getUserListReport(token, payload);
      let parsedData = Array.isArray(data) ? data : (data?.content || []);
      setAuditData(parsedData);
    } catch (error) {
      console.error('Audit trail fetch failed:', error);
      if (error.response?.status == 401 || error.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      await logoutUser(token);
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace(window.location.origin);
  };

  const renderDashboard = () => (
    <div className="welcome-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <h1 className="welcome-title" style={{ fontSize: '20px', fontWeight: 600, color: '#262626', margin: 0 }}>Welcome to NSDL</h1>
      <p className="welcome-subtitle" style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '8px' }}>Banking made easy - JUST IN A JIFFY ·</p>
    </div>
  );

  const renderAuditTrail = () => {
    return (
      <div className="audit-trail-view p-24">
        <div className="user-management-header" style={{ marginBottom: '24px' }}>
          <div className="breadcrumb text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>User Management  /  <span style={{ color: '#262626' }}>Audit Trail</span></div>
          <h2 className="page-title m-0" style={{ fontSize: '20px', fontWeight: 600, color: '#262626' }}>Audit Trail</h2>
        </div>

        {/* Action Bar */}
        <div className="audit-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Search by User Name */}
            <div className="search-input-wrapper" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px', height: '38px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input 
                type="text" 
                placeholder="Search by User Name" 
                value={auditSearchVal}
                onChange={(e) => {
                  setAuditSearchVal(e.target.value);
                  // "Immediately call the API" - though we usually want some debounce or manual trigger, 
                  // I'll add a check or the user can just type then hit Enter.
                }}
                onKeyUp={(e) => { if (e.key === 'Enter') handleAuditSearch(); }}
                style={{ width: '180px', border: 'none', outline: 'none', marginLeft: '8px', fontSize: '14px' }}
              />
            </div>

            {/* Date Range Picker */}
            <div className="date-range-picker" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '8px 12px', height: '38px' }}>
              <input 
                type="text" 
                placeholder="Start date" 
                value={auditDateFrom}
                onChange={(e) => setAuditDateFrom(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c', fontSize: '14px' }} 
              />
              <span style={{ color: '#bfbfbf', margin: '0 8px' }}>→</span>
              <input 
                type="text" 
                placeholder="End date" 
                value={auditDateTo}
                onChange={(e) => setAuditDateTo(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c', fontSize: '14px' }} 
              />
              <svg onClick={handleAuditSearch} style={{ cursor: 'pointer', marginLeft: '8px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>

          <button className="download-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#810e0e', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 16px', height: '38px', cursor: 'pointer', fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download Sample File
          </button>
        </div>

        {/* Table Area */}
        <div className="table-card" style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          <div className="nsdl-table-container">
            <table className="nsdl-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ width: '40px', textAlign: 'center', padding: '12px' }}><div className="checkbox-cell"><input type="checkbox" /></div></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Field Name <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>User Name <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>User ID <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Admin Name <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Admin ID <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Created Date <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Updated Date <span className="sort-icons">↕</span></th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase' }}>Operation Performed <span className="sort-icons">↕</span></th>
                </tr>
              </thead>
              <tbody>
                {isAuditTableLoading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#a80000' }}>Loading dynamic audit data...</td></tr>
                ) : auditTableData.length > 0 ? (
                  auditTableData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', height: '56px' }}>
                      <td style={{ textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" /></div></td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.fieldName || row.role || 'Maker'}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500 }}>{row.userName || row.username || 'Krishna'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.userId || row.userRole || 'CBC'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '32px', height: '32px', background: '#e6f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff' }}>👤</div>
                           {row.adminName || 'Carson Darrin'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.adminId || 'Das'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.createdDate || '19/06/2024'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.updatedDate || '19/06/2024'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{row.operationPerformed || row.mobileNumber || '809829919'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#bfbfbf' }}>
                      <div style={{ fontSize: '14px' }}>{hasSearchedAudit ? 'No matching audit records found for this user.' : 'Enter a username to begin auditing.'}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination from Screenshot */}
        <div className="pagination-bar" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#8c8c8c' }}>
            <span>Row per page</span>
            <select style={{ border: '1px solid #d9d9d9', borderRadius: '4px', padding: '2px 8px', height: '32px' }}>
              <option>3</option>
              <option>10</option>
              <option>20</option>
            </select>
            <span style={{ marginLeft: '12px' }}>Go to</span>
            <input type="text" defaultValue="9" style={{ width: '40px', height: '32px', border: '1px solid #d9d9d9', borderRadius: '4px', textAlign: 'center', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ border: '1px solid #f0f0f0', background: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', cursor: 'pointer' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span style={{ fontSize: '14px', margin: '0 8px' }}>1  ...  4  5  <span style={{ background: '#fff', border: '1px solid #a80000', color: '#a80000', padding: '4px 10px', borderRadius: '4px' }}>6</span>  7  8  ...  50</span>
            <button style={{ border: '1px solid #f0f0f0', background: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', cursor: 'pointer' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [requestSearchVal, setRequestSearchVal] = useState('');
  const [requestSelectedRole, setRequestSelectedRole] = useState('ALL');
  const [requestTableData, setRequestTableData] = useState([]);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);

  const [hasSearched, setHasSearched] = useState(false);

  // User Request Advanced Filters
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [requestSelectedStatus, setRequestSelectedStatus] = useState('ALL');

  // User List Report State (Clone of User Request as requested)
  const [listReportSearchVal, setListReportSearchVal] = useState('');
  const [listReportSelectedRole, setListReportSelectedRole] = useState('ALL');
  const [listReportTableData, setListReportTableData] = useState([]);
  const [isListReportLoading, setIsListReportLoading] = useState(false);
  const [hasSearchedListReport, setHasSearchedListReport] = useState(false);
  const [listReportStartDate, setListReportStartDate] = useState('');
  const [listReportEndDate, setListReportEndDate] = useState('');
  const [listReportSelectedStatus, setListReportSelectedStatus] = useState('ALL');
  const [listReportSearchMode, setListReportSearchMode] = useState('date');

  const handleUserListReportSearch = async () => {
    setIsListReportLoading(true);
    setHasSearchedListReport(true);
    setListReportPage(1); // Reset to page 1 on new search
    const token = sessionStorage.getItem('access_token');
    
    // Get logged in userName from decrypted login metadata
    const loginData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
    const loggedInUserName = loginData?.userName || loginData?.userInfo?.userName || 'gourab_ops_checker';

    const roleMapping = {
      'Bank User': 'CBC Maker',
      'CBC': 'CBC',
      'CBC Maker': 'CBC Maker',
      'MDS': 'Master Distributor',
      'DS': 'Distributor',
      'Agent': 'Retailer',
      'ALL': 'ALL'
    };

    const currentRole = roleMapping[listReportSelectedRole] || 'ALL';

    try {
      setListReportTableData([]); 
      let data;

      if (listReportSearchMode === 'date') {
        const params = {
          startDate: listReportStartDate,
          endDate: listReportEndDate,
          status: listReportSelectedStatus,
          role: currentRole,
          username: loggedInUserName
        };
        data = await getUserListByDateRange(token, params);
      } else {
        const payload = {
          username: listReportSearchVal,
          userRole: currentRole
        };
        data = await getUserListReport(token, payload);
      }

      let finalData = [];
      if (data?.resultObj?.result) {
        finalData = Array.isArray(data.resultObj.result) ? data.resultObj.result : [data.resultObj.result];
      } else if (data?.resultObj?.data) {
        finalData = Array.isArray(data.resultObj.data) ? data.resultObj.data : [data.resultObj.data];
      } else if (Array.isArray(data)) {
        finalData = data;
      }
      setListReportTableData(finalData);
    } catch (error) {
      console.error('List Report Search API failed:', error);
      const status = error.response?.status;
      if (status == 401 || status == 403 || error.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsListReportLoading(false);
    }
  };

  const handleUserRequestSearch = async () => {
    setIsRequestLoading(true);
    setHasSearched(true);
    setRequestPage(1); // Reset to page 1 on new search
    const token = sessionStorage.getItem('access_token');
    
    // Get logged in userName from decrypted login metadata
    const loginData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
    const loggedInUserName = loginData?.userName || loginData?.userInfo?.userName || 'gourab_ops_checker';

    const roleMapping = {
      'Bank User': 'CBC Maker',
      'CBC': 'CBC',
      'CBC Maker': 'CBC Maker',
      'MDS': 'Master Distributor',
      'DS': 'Distributor',
      'Agent': 'Retailer',
      'ALL': 'ALL'
    };

    const currentRole = roleMapping[requestSelectedRole] || 'ALL';

    try {
      setRequestTableData([]); 
      let data;

      if (userReqSearchMode === 'date') {
        const params = {
          startDate: reqStartDate,
          endDate: reqEndDate,
          status: requestSelectedStatus,
          role: currentRole,
          username: loggedInUserName
        };
        data = await getUserListByDateRange(token, params);
      } else {
        const payload = {
          username: requestSearchVal,
          userRole: currentRole
        };
        data = await getUserListReport(token, payload);
      }

      let finalData = [];
      if (data?.resultObj?.result) {
        finalData = Array.isArray(data.resultObj.result) ? data.resultObj.result : [data.resultObj.result];
      } else if (data?.resultObj?.data) {
        finalData = Array.isArray(data.resultObj.data) ? data.resultObj.data : [data.resultObj.data];
      } else if (Array.isArray(data)) {
        finalData = data;
      }
      setRequestTableData(finalData);
    } catch (error) {
      console.error('Search API failed:', error);
      const status = error.response?.status;
      if (status == 401 || status == 403 || error.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsRequestLoading(false);
    }
  };

  const renderUserRequest = () => {
    const userTypes = ['Bank User', 'CBC', 'CBC Maker', 'MDS', 'DS', 'Agent'];
    const statuses = ['ALL', 'APPROVED', 'PENDING', 'REJECTED'];

    return (
      <div className="audit-trail-view p-24">
        <div className="user-management-header" style={{ marginBottom: '24px' }}>
          <div className="breadcrumb text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>User Management  /  <span style={{ color: '#262626' }}>User Request</span></div>
          <h2 className="page-title m-0" style={{ fontSize: '20px', fontWeight: 600, color: '#262626' }}>User Request</h2>
        </div>

        {/* Radio Selection */}
        <div className="search-radio-group mb-24" style={{ display: 'flex', gap: '24px' }}>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="req_search_mode"
              checked={userReqSearchMode === 'date'}
              onChange={() => setUserReqSearchMode('date')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by Date Range
          </label>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="req_search_mode"
              checked={userReqSearchMode === 'username'}
              onChange={() => setUserReqSearchMode('username')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by User Name
          </label>
        </div>

        {/* Action Bar */}
        <div className="audit-top-bar mb-24" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {userReqSearchMode === 'date' ? (
            <div className="date-range-wrapper date-range-picker" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '8px 12px', height: '38px' }}>
              <input 
                type="date" 
                value={reqStartDate}
                onChange={(e) => setReqStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ border: 'none', outline: 'none', width: '140px', color: '#595959', fontSize: '13px', cursor: 'pointer' }} 
              />
              <span style={{ color: '#bfbfbf', margin: '0 8px' }}>→</span>
              <input 
                type="date" 
                value={reqEndDate}
                onChange={(e) => setReqEndDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ border: 'none', outline: 'none', width: '140px', color: '#595959', fontSize: '13px', cursor: 'pointer' }} 
              />
            </div>
          ) : (
            <div className="search-input-wrapper dynamic-search" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px', height: '38px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search User Name"
                value={requestSearchVal}
                onChange={(e) => setRequestSearchVal(e.target.value)}
                style={{ width: '180px', border: 'none', outline: 'none', marginLeft: '8px', fontSize: '14px' }}
              />
            </div>
          )}

          {/* User Type Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px', minWidth: '140px' }}
            >
              {requestSelectedRole === 'ALL' ? 'ALL' : requestSelectedRole}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showUserTypeDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '160px', marginTop: '4px' }}>
                <div onClick={() => { setRequestSelectedRole('ALL'); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', color: requestSelectedRole === 'ALL' ? '#A51010' : '#262626', fontWeight: requestSelectedRole === 'ALL' ? '600' : '400' }}>ALL Types</div>
                {userTypes.map((type, i) => (
                  <div key={i} onClick={() => { setRequestSelectedRole(type); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < userTypes.length - 1 ? '1px solid #f5f5f5' : 'none', color: requestSelectedRole === type ? '#A51010' : '#262626', fontWeight: requestSelectedRole === type ? '600' : '400' }}>{type}</div>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px', minWidth: '120px' }}
            >
              {requestSelectedStatus}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showStatusDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 101, width: '140px', marginTop: '4px' }}>
                {statuses.map((status, i) => (
                  <div key={i} onClick={() => { setRequestSelectedStatus(status); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < statuses.length - 1 ? '1px solid #f5f5f5' : 'none', color: requestSelectedStatus === status ? '#A51010' : '#262626', fontWeight: requestSelectedStatus === status ? '600' : '400' }}>{status}</div>
                ))}
              </div>
            )}
          </div>

          {/* Search Trigger */}
          <button
            onClick={handleUserRequestSearch}
            disabled={isRequestLoading}
            style={{ padding: '0 24px', height: '38px', background: '#a80000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            {isRequestLoading ? '...' : 'Search'}
          </button>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="nsdl-table-container">
            <table className="nsdl-table nsdl-user-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" /></div></th>
                  <th>first Name <span className="sort-icons">↕</span></th>
                  <th>Last Name <span className="sort-icons">↕</span></th>
                  <th>User Name <span className="sort-icons">↕</span></th>
                  <th>Mobile No. <span className="sort-icons">↕</span></th>
                  <th>Email ID <span className="sort-icons">↕</span></th>
                  <th>Role <span className="sort-icons">↕</span></th>
                  <th>Date Created <span className="sort-icons">↕</span></th>
                  <th>Status <span className="sort-icons">↕</span></th>
                  <th>Action <span className="sort-icons">↕</span></th>
                </tr>
              </thead>
              <tbody>
                {isRequestLoading ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>Loading dynamic data...</td></tr>
                ) : requestTableData.length > 0 ? (
                  requestTableData.slice((requestPage - 1) * requestRowsPerPage, requestPage * requestRowsPerPage).map((row, idx) => (
                    <tr key={idx} style={{ height: '56px' }}>
                      <td style={{ textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" style={{ accentColor: '#a80000' }} /></div></td>
                      <td>{row["1"]?.firstName || '---'}</td>
                      <td>{row["1"]?.lastName || '---'}</td>
                      <td>{row.username || '---'}</td>
                      <td>{row["1"]?.mobileNumber || '---'}</td>
                      <td>{row["1"]?.email || '---'}</td>
                      <td>{row.userRole || '---'}</td>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : '---'}</td>
                      <td>
                        <span style={{ 
                          color: row.status === 'REJECTED' ? '#f5222d' : row.status === 'PENDING' ? '#faad14' : '#52c41a', 
                          background: row.status === 'REJECTED' ? '#fff1f0' : row.status === 'PENDING' ? '#fff7e6' : '#f6ffed', 
                          padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 
                        }}>
                          {row.status || 'Active'}
                        </span>
                      </td>
                      <td><span onClick={() => { setSelectedUserData(row); setActiveMenu('profile'); }} style={{ color: '#a80000', cursor: 'pointer', fontWeight: '500' }}>View Details</span></td>
                    </tr>
                  ))
                ) : hasSearched ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>No matching records found.</td></tr>
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: '#bfbfbf' }}>
                      <div style={{ fontSize: '14px' }}>Please perform a search to view user requests.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-bar" style={{ marginTop: '24px' }}>
          <div className="pagination-left">
            <span className="page-text">Row per page</span>
            <select className="page-select" defaultValue="3">
              <option value="3">3</option>
              <option value="10">10</option>
            </select>
          </div>
          <div className="pagination-right">
            <button className="page-btn active">1</button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const profileTabs = ['Basic Details', 'PAN Details', 'Aadhar Details', 'Matching Details', 'Geo-Tagging  Analysis', 'Browser Data'];
    const d = selectedUserData || {};
    const isPending = d.status === 'PENDING';

    return (
      <div className="profile-page p-24">
        {/* Breadcrumb & Header */}
        <div className="user-management-header" style={{ marginBottom: '32px' }}>
          <div className="breadcrumb text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
            User Management  /  <span style={{ color: '#262626' }}>User Request</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg onClick={() => setActiveMenu('user-request')} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ cursor: 'pointer' }}><polyline points="15 18 9 12 15 6"></polyline></svg>
            <h2 className="page-title m-0" style={{ fontSize: '20px', fontWeight: 600, color: '#262626' }}>Profile Details</h2>
          </div>
        </div>

        {/* Top Section: Essential Identity */}
        <div className="profile-top" style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
          {/* Left Summary Card */}
          <div className="profile-card left" style={{ width: '320px', background: '#fff', borderRadius: '6px', padding: '24px', position: 'relative', border: '1px solid #f0f0f0' }}>
            <span className="status-badge" style={{ position: 'absolute', top: '16px', right: '16px', background: d.status === 'PENDING' ? '#fff7e6' : '#f6ffed', color: d.status === 'PENDING' ? '#faad14' : '#52c41a', padding: '2px 10px', fontSize: '12px', borderRadius: '4px', fontWeight: 500 }}>{d.status || 'Active'}</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', background: '#1890ff', borderRadius: '50%', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>👩🏽‍💼</div>
              <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: 500 }}>{d["1"]?.firstName || 'Adeline'} {d["1"]?.lastName || 'Ballard'}</p>
              <p style={{ color: '#8c8c8c', fontSize: '13px', marginTop: '2px' }}>User Name : {d.username || 'Adeline'}</p>
            </div>
            <div style={{ height: '1px', background: '#f0f0f0', margin: '16px 0' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Email:</span><span style={{ color: '#595959' }}>{d["1"]?.email || 'Adeline@gmail.com'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mobile:</span><span style={{ color: '#595959' }}>{d["1"]?.mobileNumber || '+91-9999888800'}</span></div>
            </div>
          </div>

          {/* Right Personal Details Card */}
          <div className="profile-card right" style={{ flex: 1, background: '#fff', borderRadius: '6px', padding: '24px', border: '1px solid #f0f0f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '20px', margin: '0' }}>Personal Details</h3>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div><label style={{ fontSize: '12px', color: '#8c8c8c' }}>PAN</label><p style={{ fontWeight: 500, marginTop: '4px' }}>{d["2"]?.pan || d["5"]?.entityPanCard || 'XXXXXX67F'}</p></div>
                <div><label style={{ fontSize: '12px', color: '#8c8c8c' }}>Aadhaar</label><p style={{ fontWeight: 500, marginTop: '4px' }}>XXXX XXXX XXXX 7463</p></div>
                <div><label style={{ fontSize: '12px', color: '#8c8c8c' }}>Created Date</label><p style={{ fontWeight: 500, marginTop: '4px' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : '12/09/2025'}</p></div>
                <div><label style={{ fontSize: '12px', color: '#8c8c8c' }}>GST Number</label><p style={{ fontWeight: 500, marginTop: '4px' }}>{d["2"]?.gstNumber || '27RJJTS8977Z5Z9'}</p></div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <label style={{ fontSize: '12px', color: '#8c8c8c' }}>Address</label>
                <p style={{ fontWeight: 500, marginTop: '4px', lineHeight: '1.5' }}>{d["2"]?.businessAddress || `${d["1"]?.city}, ${d["1"]?.state} ${d["1"]?.pinCode}` || 'Plot No. E-12, SRB Tower, 11th Floor Infocity'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Tabs */}
        <div className="profile-tabs-card" style={{ background: '#fff', marginTop: '24px', borderRadius: '6px', padding: '16px 24px', border: '1px solid #f0f0f0' }}>
          <div className="tabs" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px', fontSize: '14px' }}>
            {profileTabs.map(tab => (
              <span key={tab} onClick={() => setActiveProfileTab(tab)} className={activeProfileTab === tab ? 'active' : ''}
                style={{ cursor: 'pointer', color: activeProfileTab === tab ? '#a51010' : '#595959', borderBottom: activeProfileTab === tab ? '2px solid #a51010' : 'none', fontWeight: activeProfileTab === tab ? 500 : 400, paddingBottom: '6px' }}
              >{tab}</span>
            ))}
          </div>

          <div style={{ marginTop: '24px', minHeight: '200px' }}>
            {activeProfileTab === 'Basic Details' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex' }}><span style={{ width: '120px', color: '#8c8c8c' }}>Name:</span><span>{d["1"]?.firstName} {d["1"]?.lastName}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '120px', color: '#8c8c8c' }}>City:</span><span>{d["1"]?.city}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '120px', color: '#8c8c8c' }}>State:</span><span>{d["1"]?.state}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '120px', color: '#8c8c8c' }}>PIN:</span><span>{d["1"]?.pinCode}</span></div>
              </div>
            )}

            {activeProfileTab === 'PAN Details' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', marginBottom: '16px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>PAN Name:</span><span>{d["2"]?.companyName || `${d["1"]?.firstName} ${d["1"]?.lastName}`}</span></div>
                  <div style={{ display: 'flex', marginBottom: '16px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>PAN Number:</span><span>{d["2"]?.pan || d["5"]?.entityPanCard}</span></div>
                  <div style={{ display: 'flex', marginBottom: '16px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>GST NO:</span><span>{d["2"]?.gstNumber}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    {d["5"]?.certificateOfIncorporationDocumentPdf ? (
                      <div style={{ position: 'relative' }}>
                        <img src={d["5"].certificateOfIncorporationDocumentPdf} alt="Inc Doc" style={{ width: '180px', height: '110px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'contain', background: '#f5f5f5' }} />
                        <a href={d["5"].certificateOfIncorporationDocumentPdf} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '2px', textDecoration: 'none' }}>View Full</a>
                      </div>
                    ) : (
                      <div style={{ width: '180px', height: '110px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: '12px' }}>No Incorporation Doc</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {d["5"]?.businessProposal ? (
                      <div style={{ position: 'relative' }}>
                        <img src={d["5"].businessProposal} alt="Prop Doc" style={{ width: '180px', height: '110px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'contain', background: '#f5f5f5' }} />
                        <a href={d["5"].businessProposal} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '2px', textDecoration: 'none' }}>View Full</a>
                      </div>
                    ) : (
                      <div style={{ width: '180px', height: '110px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: '12px' }}>No Proposal Doc</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'Aadhar Details' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', marginBottom: '12px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>Full Name:</span><span>{d["1"]?.firstName} {d["1"]?.lastName}</span></div>
                  <div style={{ display: 'flex', marginBottom: '12px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>Aadhaar No:</span><span>XXXX XXXX 7685</span></div>
                  <div style={{ display: 'flex', marginBottom: '12px' }}><span style={{ width: '140px', color: '#8c8c8c' }}>DOB:</span><span>21-02-2000</span></div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    {d["5"]?.authorizedSignatoryKyc ? (
                      <div style={{ position: 'relative' }}>
                        <img src={d["5"].authorizedSignatoryKyc} alt="KYC Doc" style={{ width: '180px', height: '120px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'contain', background: '#f5f5f5' }} />
                        <a href={d["5"].authorizedSignatoryKyc} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '2px', textDecoration: 'none' }}>View Full</a>
                      </div>
                    ) : (
                      <div style={{ width: '180px', height: '120px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: '12px' }}>No KYC Doc</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {d["5"]?.firstAndLastPageAgreement ? (
                      <div style={{ position: 'relative' }}>
                        <img src={d["5"].firstAndLastPageAgreement} alt="Agr Doc" style={{ width: '180px', height: '120px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'contain', background: '#f5f5f5' }} />
                        <a href={d["5"].firstAndLastPageAgreement} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '2px', textDecoration: 'none' }}>View Full</a>
                      </div>
                    ) : (
                      <div style={{ width: '180px', height: '120px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: '12px' }}>No Agreement Doc</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'Matching Details' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{ flex: 1, fontSize: '15px' }}>
                  <div style={{ display: 'flex', marginBottom: '20px' }}><span style={{ width: '160px', color: '#8c8c8c' }}>PAN Name Match:</span><span style={{ color: '#52c41a', fontWeight: 'bold' }}>100%</span></div>
                  <div style={{ display: 'flex', marginBottom: '20px' }}><span style={{ width: '160px', color: '#8c8c8c' }}>DOB Match:</span><span style={{ color: '#52c41a', fontWeight: 'bold' }}>Matched</span></div>
                  <div style={{ display: 'flex', marginBottom: '20px' }}><span style={{ width: '160px', color: '#8c8c8c' }}>Photo Match:</span><span style={{ color: '#1890ff', fontWeight: 'bold' }}>98.5%</span></div>
                </div>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '8px solid #52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>100%</div>
              </div>
            )}

            {activeProfileTab === 'Geo-Tagging  Analysis' && (
              <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ flex: 1, fontSize: '14px' }}>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>Coordinates:</span> <span style={{ fontWeight: 500 }}>{d["2"]?.latitude || '20.2961'}° N, {d["2"]?.longitude || '85.8245'}° E</span></div>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>IP Address:</span> <span style={{ fontWeight: 500 }}>192.168.1.45</span></div>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>Location:</span> <span style={{ fontWeight: 500 }}>{d["2"]?.businessAddress || 'Nasik'}</span></div>
                </div>
                <div style={{ width: '400px', height: '180px', background: '#e8e4d8', borderRadius: '8px', border: '1px solid #d9d9d9', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #e8e4d8 25%, #d9d4c8 25%, #d9d4c8 50%, #e8e4d8 50%, #e8e4d8 75%, #d9d4c8 75%)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <svg width="24" height="32" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#ea4335" /><circle cx="12" cy="12" r="5" fill="white" /></svg>
                  </div>
                </div>
              </div>
            )}

            {activeProfileTab === 'Browser Data' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
                <div style={{ flex: 1, fontSize: '14px' }}>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>Browser:</span> <span>Chrome 123.0.0</span></div>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>OS:</span> <span>Windows 11</span></div>
                  <div style={{ marginBottom: '12px' }}><span style={{ color: '#8c8c8c' }}>Cookies:</span> <span style={{ color: '#52c41a' }}>Enabled</span></div>
                </div>
                <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#4CAF50" /><path d="M24 13.5c5.8 0 10.5 4.7 10.5 10.5h-10.5V13.5z" fill="#F44336" /><circle cx="24" cy="24" r="7" fill="#F5F5F5" /><circle cx="24" cy="24" r="5.5" fill="#2196F3" /></svg>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <button 
              disabled={!isPending}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isPending ? '#a51010' : '#8c8c8c', 
                fontWeight: 500, 
                cursor: isPending ? 'pointer' : 'not-allowed',
                opacity: isPending ? 1 : 0.6
              }}
            >
              Reject
            </button>
            <button 
              disabled={!isPending}
              style={{ 
                background: isPending ? '#52c41a' : '#f5f5f5', 
                border: isPending ? 'none' : '1px solid #d9d9d9', 
                color: isPending ? '#fff' : '#bfbfbf', 
                padding: '8px 24px', 
                borderRadius: '4px', 
                fontWeight: 500, 
                cursor: isPending ? 'pointer' : 'not-allowed',
                filter: isPending ? 'none' : 'grayscale(1)'
              }}
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUserListReport = () => {
    const userTypes = ['Bank User', 'CBC', 'CBC Maker', 'MDS', 'DS', 'Agent'];
    const statuses = ['ALL', 'APPROVED', 'PENDING', 'REJECTED'];

    return (
      <div className="audit-trail-view p-24">
        <div className="user-management-header" style={{ marginBottom: '24px' }}>
          <div className="breadcrumb text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>User Management  /  <span style={{ color: '#262626' }}>User list report</span></div>
          <h2 className="page-title m-0" style={{ fontSize: '20px', fontWeight: 600, color: '#262626' }}>User list report</h2>
        </div>

        {/* Radio Selection */}
        <div className="search-radio-group mb-24" style={{ display: 'flex', gap: '24px' }}>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="list_report_search_mode"
              checked={listReportSearchMode === 'date'}
              onChange={() => setListReportSearchMode('date')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by Date Range
          </label>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="list_report_search_mode"
              checked={listReportSearchMode === 'username'}
              onChange={() => setListReportSearchMode('username')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by User Name
          </label>
        </div>

        {/* Action Bar */}
        <div className="audit-top-bar mb-24" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {listReportSearchMode === 'date' ? (
            <div className="date-range-wrapper date-range-picker" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '8px 12px', height: '38px' }}>
              <input 
                type="date" 
                value={listReportStartDate}
                onChange={(e) => setListReportStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ border: 'none', outline: 'none', width: '140px', color: '#595959', fontSize: '13px', cursor: 'pointer' }} 
              />
              <span style={{ color: '#bfbfbf', margin: '0 8px' }}>→</span>
              <input 
                type="date" 
                value={listReportEndDate}
                onChange={(e) => setListReportEndDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ border: 'none', outline: 'none', width: '140px', color: '#595959', fontSize: '13px', cursor: 'pointer' }} 
              />
            </div>
          ) : (
            <div className="search-input-wrapper dynamic-search" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px', height: '38px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search User Name"
                value={listReportSearchVal}
                onChange={(e) => setListReportSearchVal(e.target.value)}
                style={{ width: '180px', border: 'none', outline: 'none', marginLeft: '8px', fontSize: '14px' }}
              />
            </div>
          )}

          {/* User Type Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px', minWidth: '140px' }}
            >
              {listReportSelectedRole === 'ALL' ? 'ALL' : listReportSelectedRole}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showUserTypeDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '160px', marginTop: '4px' }}>
                <div onClick={() => { setListReportSelectedRole('ALL'); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', color: listReportSelectedRole === 'ALL' ? '#A51010' : '#262626', fontWeight: listReportSelectedRole === 'ALL' ? '600' : '400' }}>ALL Types</div>
                {userTypes.map((type, i) => (
                  <div key={i} onClick={() => { setListReportSelectedRole(type); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < userTypes.length - 1 ? '1px solid #f5f5f5' : 'none', color: listReportSelectedRole === type ? '#A51010' : '#262626', fontWeight: listReportSelectedRole === type ? '600' : '400' }}>{type}</div>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px', minWidth: '120px' }}
            >
              {listReportSelectedStatus}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showStatusDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 101, width: '140px', marginTop: '4px' }}>
                {statuses.map((status, i) => (
                  <div key={i} onClick={() => { setListReportSelectedStatus(status); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < statuses.length - 1 ? '1px solid #f5f5f5' : 'none', color: listReportSelectedStatus === status ? '#A51010' : '#262626', fontWeight: listReportSelectedStatus === status ? '600' : '400' }}>{status}</div>
                ))}
              </div>
            )}
          </div>

          {/* Search Trigger */}
          <button
            onClick={handleUserListReportSearch}
            disabled={isListReportLoading}
            style={{ padding: '0 24px', height: '38px', background: '#a80000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            {isListReportLoading ? '...' : 'Search'}
          </button>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="nsdl-table-container">
            <table className="nsdl-table nsdl-user-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" /></div></th>
                  <th>first Name <span className="sort-icons">↕</span></th>
                  <th>Last Name <span className="sort-icons">↕</span></th>
                  <th>User Name <span className="sort-icons">↕</span></th>
                  <th>Mobile No. <span className="sort-icons">↕</span></th>
                  <th>Email ID <span className="sort-icons">↕</span></th>
                  <th>Role <span className="sort-icons">↕</span></th>
                  <th>Date Created <span className="sort-icons">↕</span></th>
                  <th>Status <span className="sort-icons">↕</span></th>
                </tr>
              </thead>
              <tbody>
                {isListReportLoading ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading dynamic data...</td></tr>
                ) : listReportTableData.length > 0 ? (
                  listReportTableData.slice((listReportPage - 1) * listReportRowsPerPage, listReportPage * listReportRowsPerPage).map((row, idx) => (
                    <tr key={idx} style={{ height: '56px' }}>
                      <td style={{ textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" style={{ accentColor: '#a80000' }} /></div></td>
                      <td>{row["1"]?.firstName || '---'}</td>
                      <td>{row["1"]?.lastName || '---'}</td>
                      <td>{row.username || '---'}</td>
                      <td>{row["1"]?.mobileNumber || '---'}</td>
                      <td>{row["1"]?.email || '---'}</td>
                      <td>{row.userRole || '---'}</td>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : '---'}</td>
                      <td>
                        <span style={{ 
                          color: row.status === 'REJECTED' ? '#f5222d' : row.status === 'PENDING' ? '#faad14' : '#52c41a', 
                          background: row.status === 'REJECTED' ? '#fff1f0' : row.status === 'PENDING' ? '#fff7e6' : '#f6ffed', 
                          padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 
                        }}>
                          {row.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : hasSearchedListReport ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>No matching records found.</td></tr>
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#bfbfbf' }}>
                      <div style={{ fontSize: '14px' }}>Please perform a search to view user list reports.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-bar" style={{ marginTop: '24px' }}>
          <div className="pagination-left">
            <span className="page-text">Row per page</span>
            <select className="page-select" value={listReportRowsPerPage} onChange={(e) => { setListReportRowsPerPage(Number(e.target.value)); setListReportPage(1); }}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span style={{ marginLeft: '16px', fontSize: '13px', color: '#8c8c8c' }}>
              Showing {(listReportPage - 1) * listReportRowsPerPage + 1} - {Math.min(listReportPage * listReportRowsPerPage, listReportTableData.length)} of {listReportTableData.length}
            </span>
          </div>
          <div className="pagination-right">
             <button disabled={listReportPage === 1} onClick={() => setListReportPage(p => p - 1)} className="page-btn nav-btn">{"<"}</button>
             {Array.from({ length: Math.ceil(listReportTableData.length / listReportRowsPerPage) }, (_, i) => i + 1).map(p => (
               <button key={p} onClick={() => setListReportPage(p)} className={`page-btn ${listReportPage === p ? 'active' : ''}`}>{p}</button>
             ))}
             <button disabled={listReportPage === Math.ceil(listReportTableData.length / listReportRowsPerPage)} onClick={() => setListReportPage(p => p + 1)} className="page-btn nav-btn">{">"}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {sidebarOpen && (
        <aside className="sider">
          <div className="logo-section">
            <img src={nsdlLogo} alt="NSDL" style={{ height: '28px' }} />
          </div>
          <nav className="menu-nav">
            <div className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenu('dashboard')}>
              <span className="icon">🏠</span> Dashboard
            </div>
            <div className="menu-item menu-parent" onClick={() => setUserMgmtOpen(!userMgmtOpen)} style={{ cursor: 'pointer' }}>
              <span className="icon">👥</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                <span>User Management</span>
                <span style={{ fontSize: '10px' }}>{userMgmtOpen ? '▲' : '▼'}</span>
              </div>
            </div>
            {userMgmtOpen && (
              <>
                <div className={`menu-item ${activeMenu === 'user-request' ? 'active' : ''}`} style={{ paddingLeft: '40px' }} onClick={() => setActiveMenu('user-request')}>User Request</div>
                <div className={`menu-item ${activeMenu === 'user-list-report' ? 'active' : ''}`} style={{ paddingLeft: '40px' }} onClick={() => setActiveMenu('user-list-report')}>User List Report</div>
              </>
            )}
            <div className={`menu-item ${activeMenu === 'audit-trail' ? 'active' : ''}`} onClick={() => setActiveMenu('audit-trail')}><span className="icon">📜</span> Audit Trail</div>
          </nav>
        </aside>
      )}

      <div className="dashboard-frame">
        <header className="global-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: 'pointer', padding: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </div>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="notification-icon" onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }} style={{ position: 'relative', cursor: 'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {notifications.filter(n => n.unread).length > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#a80000', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
              
              {showNotifications && (
                <div className="notifications-dropdown" style={{ position: 'absolute', top: '40px', right: '-10px', width: '300px', background: '#fff', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                    <span style={{ fontSize: '12px', color: '#a80000', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setNotifications(notifications.map(n => ({...n, unread: false}))); }}>Mark all as read</span>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9f9f9', background: n.unread ? '#fff9f9' : '#fff', position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.type === 'APPROVED' ? '#52c41a' : n.type === 'PENDING' ? '#faad14' : n.type === 'REJECTED' ? '#f5222d' : '#1890ff', marginTop: '6px' }}></div>
                             <div style={{ flex: 1 }}>
                               <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#262626' }}>{n.title}</p>
                               <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#595959', lineHeight: '1.4' }}>{n.message}</p>
                               <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#bfbfbf' }}>{n.time}</p>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#bfbfbf', fontSize: '13px' }}>No notifications to show.</div>
                    )}
                  </div>
                  <div style={{ padding: '12px', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#595959', cursor: 'pointer' }}>View All Activity</span>
                  </div>
                </div>
              )}
            </div>
            <div className="profile-section" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} style={{ position: 'relative' }}>
              <div className="avatar" style={{ background: '#ffeef0', color: '#a80000' }}>{userName.charAt(0).toUpperCase()}</div>
              <span className="user-name" style={{ fontWeight: 500 }}>{userName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2" style={{ marginLeft: '4px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              {showProfileMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">Change Password</div>
                  <div className="dropdown-item" onClick={() => setShowLogoutModal(true)}>Logout</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          {activeMenu === 'dashboard' && renderDashboard()}
          {activeMenu === 'user-list-report' && renderUserListReport()}
          {activeMenu === 'user-request' && renderUserRequest()}
          {activeMenu === 'audit-trail' && renderAuditTrail()} 
          {activeMenu === 'profile' && renderProfile()}
        </main>
      </div>

      {showLogoutModal && (
        <div className="logout-confirm-overlay">
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px' }}>Confirm Logout</h3>
            <p style={{ color: '#8c8c8c', marginBottom: '32px' }}>Are you sure you want to logout?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#A51010', color: '#fff', cursor: 'pointer' }}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
