import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { getUserDashboard, getAuditTrail, getUserListReport } from '../services/authService';
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

  // User List Report state
  const [auditData, setAuditData] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [searchMode, setSearchMode] = useState('date');
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', username: '', userType: 'ALL', status: 'ALL' });

  // UI State for Pagination & Selection
  const [selectedRows, setSelectedRows] = useState([2]);
  const [currentPage, setCurrentPage] = useState(6);
  const [rowsPerPage, setRowsPerPage] = useState(3);

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
        const userData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
        setUserName(userData?.userInfo?.username || userData?.username || 'User');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeMenu === 'user-list-report' || activeMenu === 'audit-trail') {
      loadAuditLogs();
    }
  }, [activeMenu, filters.fromDate, filters.toDate]);

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
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const renderDashboard = () => (
    <div className="welcome-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <h1 className="welcome-title" style={{ fontSize: '20px', fontWeight: 600, color: '#262626', margin: 0 }}>Welcome to NSDL</h1>
      <p className="welcome-subtitle" style={{ fontSize: '14px', color: '#8c8c8c', marginTop: '8px' }}>Banking made easy - JUST IN A JIFFY ·</p>
    </div>
  );

  const renderAuditTrail = () => {
    const dummyAuditData = [
      { userName: 'Carson Darrin', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Carson', updatedDate: '19/06/2024', updatedBy: 'Carson' },
      { userName: 'Ashy Handgun', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Ashy', updatedDate: '19/06/2024', updatedBy: 'Ashy' },
      { userName: 'Ashy Handgun', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Ashy', updatedDate: '19/06/2024', updatedBy: 'Ashy' }
    ];
    const displayData = auditData.length > 0 ? auditData : dummyAuditData;

    return (
      <div className="audit-trail-view p-24">
        <div className="user-management-header mb-24">
          <div className="breadcrumb text-secondary mb-8" style={{ fontSize: '12px' }}>User Management / <span style={{ color: '#262626' }}>User List Report</span></div>
          <h2 className="page-title m-0">User List Report</h2>
        </div>

        <div className="search-radio-group mb-24" style={{ display: 'flex', gap: '24px' }}>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="radio" checked={searchMode === 'date'} onChange={() => setSearchMode('date')} style={{ accentColor: '#a80000' }} /> Search by Date Range
          </label>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="radio" checked={searchMode === 'username'} onChange={() => setSearchMode('username')} style={{ accentColor: '#a80000' }} /> Search by User Name
          </label>
        </div>

        <div className="audit-top-bar mb-24" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="search-input-wrapper dynamic-search" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px', height: '38px' }}>
              <input type="text" placeholder="Search User Name" style={{ border: 'none', outline: 'none', fontSize: '14px' }} />
            </div>
          </div>
          <button className="btn-download" style={{ background: '#a80000', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Download Sample File</button>
        </div>

        <div className="table-card" style={{ marginTop: '24px' }}>
          <div className="nsdl-table-container">
            <table className="nsdl-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>User Name</th><th>User Type</th><th>First Name</th><th>Last Name</th><th>Date Created</th><th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, idx) => (
                  <tr key={idx} className={idx === 2 ? 'selected-row' : ''}>
                    <td><input type="checkbox" checked={idx === 2} readOnly /></td>
                    <td>{row.userName}</td><td>{row.userType}</td><td>{row.firstName}</td><td>{row.lastName}</td><td>{row.dateCreated}</td><td>{row.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  const handleUserRequestSearch = async () => {
    setIsRequestLoading(true);
    const token = sessionStorage.getItem('access_token');

    // Map UI labels to precise API role strings
    const roleMapping = {
      'Bank User': 'CBC Maker',
      'CBC': 'CBC',
      'CBC Maker': 'CBC Maker',
      'MDS': 'Master Distributor',
      'DS': 'Distributor',
      'Agent': 'Retailer',
      'ALL': 'ALL'
    };

    const payload = {
      username: requestSearchVal,
      userRole: roleMapping[requestSelectedRole] || 'ALL'
    };

    try {
      const data = await getUserListReport(token, payload);
      // Backend returns data in resultObj.data or as an array
      let finalData = [];
      if (data?.resultObj?.data) {
        finalData = Array.isArray(data.resultObj.data) ? data.resultObj.data : [data.resultObj.data];
      } else if (Array.isArray(data)) {
        finalData = data;
      }
      setRequestTableData(finalData);
    } catch (error) {
      console.error('Search API failed:', error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const renderUserRequest = () => {
    const userTypes = ['Bank User', 'CBC', 'CBC Maker', 'MDS', 'DS', 'Agent'];
    const statuses = ['Active', 'Inactive'];

    return (
      <div className="audit-trail-view p-24">
        <div className="user-management-header mb-24">
          <div className="breadcrumb text-secondary mb-8" style={{ fontSize: '12px' }}>User Management / <span style={{ color: '#262626' }}>User Request</span></div>
          <h2 className="page-title m-0">User Request</h2>
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
              <input type="text" placeholder="Start date" style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c', fontSize: '14px' }} />
              <span style={{ color: '#bfbfbf', margin: '0 8px' }}>→</span>
              <input type="text" placeholder="End date" style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c', fontSize: '14px' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2" style={{ marginLeft: '8px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserTypeDropdown(!showUserTypeDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px' }}
            >
              {requestSelectedRole === 'ALL' ? 'User Type' : requestSelectedRole}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showUserTypeDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '160px', marginTop: '4px' }}>
                <div onClick={() => { setRequestSelectedRole('ALL'); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>All Types</div>
                {userTypes.map((type, i) => (
                  <div key={i} onClick={() => { setRequestSelectedRole(type); setShowUserTypeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < userTypes.length - 1 ? '1px solid #f5f5f5' : 'none' }}>{type}</div>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#262626', height: '38px' }}
            >
              Status
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showStatusDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '140px', marginTop: '4px' }}>
                {statuses.map((status, i) => (
                  <div key={i} onClick={() => setShowStatusDropdown(false)} style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: i < statuses.length - 1 ? '1px solid #f5f5f5' : 'none' }}>{status}</div>
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
                  requestTableData.map((row, idx) => (
                    <tr key={idx} style={{ height: '56px' }}>
                      <td style={{ textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" style={{ accentColor: '#a80000' }} /></div></td>
                      <td>{row["1"]?.firstName || 'Krishna'}</td>
                      <td>{row["1"]?.lastName || 'Das'}</td>
                      <td>{row.username || 'SP028'}</td>
                      <td>{row["1"]?.mobileNumber || '809829919'}</td>
                      <td>{row["1"]?.email || 'Krishna@gmail.com'}</td>
                      <td>{row.userRole || 'Maker'}</td>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : '19/06/2024'}</td>
                      <td><span style={{ color: row.status === 'PENDING' ? '#faad14' : '#52c41a', background: row.status === 'PENDING' ? '#fff7e6' : '#f6ffed', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{row.status || 'Active'}</span></td>
                      <td><span onClick={() => { setSelectedUserData(row); setActiveMenu('profile'); }} style={{ color: '#a80000', cursor: 'pointer', fontWeight: '500' }}>View Details</span></td>
                    </tr>
                  ))
                ) : (
                  // Dummy reference if no search result
                  [1, 2, 3].map((_, idx) => (
                    <tr key={idx} style={{ height: '56px' }}>
                      <td style={{ textAlign: 'center' }}><div className="checkbox-cell"><input type="checkbox" style={{ accentColor: '#a80000' }} /></div></td>
                      <td>Krishna</td><td>Das</td><td>SP028</td><td>809829919</td><td>Krishna@gmail.com</td><td>Maker</td><td>19/06/2024</td>
                      <td><span style={{ color: '#52c41a', background: '#f6ffed', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span></td>
                      <td><span onClick={() => setActiveMenu('profile')} style={{ color: '#a80000', cursor: 'pointer', fontWeight: '500' }}>View Details</span></td>
                    </tr>
                  ))
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
            <span className="page-text" style={{ marginLeft: '12px' }}>Go to</span>
            <input type="text" className="page-goto" defaultValue="9" />
          </div>
          <div className="pagination-right">
            <button className="page-btn nav-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
            <button className="page-btn">1</button>
            <span className="page-dots">...</span>
            <button className="page-btn">4</button>
            <button className="page-btn">5</button>
            <button className="page-btn active">6</button>
            <button className="page-btn">7</button>
            <button className="page-btn">8</button>
            <span className="page-dots">...</span>
            <button className="page-btn">50</button>
            <button className="page-btn nav-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c8c8c" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg></button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const profileTabs = ['Basic Details', 'PAN Details', 'Aadhar Details', 'Matching Details', 'Geo-Tagging  Analysis', 'Browser Data'];
    const d = selectedUserData || {};

    return (
      <div className="profile-page p-24">
        {/* Breadcrumb & Header */}
        <div className="user-management-header mb-24">
          <div className="breadcrumb text-secondary mb-8" style={{ fontSize: '12px' }}>
            User Management  /  <span style={{ color: '#262626' }}>User Request</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg onClick={() => setActiveMenu('user-request')} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" style={{ cursor: 'pointer' }}><polyline points="15 18 9 12 15 6"></polyline></svg>
            <h2 className="page-title m-0" style={{ fontSize: '20px', fontWeight: 600 }}>Profile Details</h2>
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
                <div style={{ display: 'flex', gap: '12px' }}>
                  {d["5"]?.certificateOfIncorporationDocumentPdf ? (
                    <img src={d["5"].certificateOfIncorporationDocumentPdf} alt="Incorporation" style={{ width: '180px', height: '110px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '180px', height: '110px', background: 'linear-gradient(135deg, #f5f0e1 0%, #e8dcc8 100%)', borderRadius: '4px', border: '1px solid #d9d9d9' }}></div>
                  )}
                  {d["5"]?.businessProposal ? (
                    <img src={d["5"].businessProposal} alt="Proposal" style={{ width: '180px', height: '110px', borderRadius: '4px', border: '1px solid #d9d9d9', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '180px', height: '110px', background: 'linear-gradient(135deg, #f5f0e1 0%, #e8dcc8 100%)', borderRadius: '4px', border: '1px solid #d9d9d9' }}></div>
                  )}
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
                <div style={{ display: 'flex', gap: '12px' }}>
                  {d["5"]?.authorizedSignatoryKyc ? (
                    <img src={d["5"].authorizedSignatoryKyc} alt="KYC" style={{ width: '180px', height: '120px', borderRadius: '4px', border: '1px solid #e8e8e8', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '180px', height: '120px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e8e8e8' }}></div>
                  )}
                  {d["5"]?.firstAndLastPageAgreement ? (
                    <img src={d["5"].firstAndLastPageAgreement} alt="Agreement" style={{ width: '180px', height: '120px', borderRadius: '4px', border: '1px solid #e8e8e8', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '180px', height: '120px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e8e8e8' }}></div>
                  )}
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
            <button style={{ background: 'transparent', border: 'none', color: '#a51010', fontWeight: 500, cursor: 'pointer' }}>Reject</button>
            <button style={{ background: '#52c41a', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>Approve</button>
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
            <div className="notification-icon" style={{ position: 'relative', cursor: 'pointer' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#a80000', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>9</span>
            </div>
            <div className="profile-section" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ position: 'relative' }}>
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
          {activeMenu === 'user-list-report' && renderAuditTrail()}
          {activeMenu === 'user-request' && renderUserRequest()}
          {activeMenu === 'audit-trail' && renderAuditTrail()} {/* Reusing for demo */}
          {activeMenu === 'profile' && renderProfile()}
        </main>
      </div>

      {showLogoutModal && (
        <div className="logout-confirm-overlay">
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px' }}>Confirm Logout</h3>
            <p style={{ color: '#8c8c8c', marginBottom: '32px' }}>Are you sure you want to logout?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>Cancel</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#A51010', color: '#fff' }}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
