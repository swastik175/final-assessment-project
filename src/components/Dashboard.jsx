import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { getUserDashboard, getAuditTrail, getUserListReport } from '../services/authService';
import nsdlLogo from '../assets/nsdl_logo.png';

const Dashboard = () => {
  const [userName, setUserName] = useState('Loading...');
  const [activeMenu, setActiveMenu] = useState('user-list-report');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // User List Report state
  const [auditData, setAuditData] = useState([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [searchMode, setSearchMode] = useState('date');
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', username: '', userType: 'ALL', status: 'ALL' });

  // UI State for Audit Trail
  const [selectedRows, setSelectedRows] = useState([2]); // Default checked index from image
  const [currentPage, setCurrentPage] = useState(6);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('access_token');
      if (!token) return;

      try {
        const data = await getUserDashboard(token);
        const firstName = data.firstName || data.first_name || data.userInfo?.firstName || '';
        const lastName = data.lastName || data.last_name || data.userInfo?.lastName || '';
        const fullName = data.userInfo?.userName || data.userInfo?.name || '';

        if (firstName || lastName) {
          setUserName(`${firstName} ${lastName}`.trim());
        } else if (fullName) {
          setUserName(fullName);
        } else {
          setUserName(data.username || data.userInfo?.userId || 'User');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);

        // Ensure that if the interceptor destroyed the expired token, we bounce the user layout entirely!
        if (!sessionStorage.getItem('access_token')) {
          window.location.href = '/login';
          return;
        }

        const userData = JSON.parse(sessionStorage.getItem('user_data') || '{}');
        setUserName(userData.username || 'User');
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

      let payload = {};
      if (searchMode === 'date') {
        payload = {
          status: 'ALL',
          username: defaultUser,
          startDate: filters.fromDate,
          endDate: filters.toDate,
          role: 'ALL'
        };
      } else {
        payload = {
          username: filters.username || defaultUser,
          userRole: filters.userType === 'ALL' ? defaultRole : filters.userType
        };
      }

      const data = await getUserListReport(token, payload);

      let parsedData = [];
      if (data?.resultObj?.data) {
        parsedData = [data.resultObj.data];
      } else if (Array.isArray(data)) {
        parsedData = data;
      } else if (data?.content) {
        parsedData = Array.isArray(data.content) ? data.content : [];
      } else if (data?.data) {
        parsedData = Array.isArray(data.data) ? data.data : [data.data];
      }

      setAuditData(parsedData);
    } catch (error) {
      console.error('Audit trail fetch failed:', error);
      // Ensure Dashboard drops the layout if interceptor forced token wipeout
      if (!sessionStorage.getItem('access_token')) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const renderDashboard = () => (
    <div className="welcome-section">
      <h1 className="welcome-title">Welcome to NSDL</h1>
      <p className="welcome-subtitle">Banking made easy - JUST IN A JIFFY ·</p>
    </div>
  );

  const toggleRowSelect = (idx) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

  const renderAuditTrail = () => {
    const dummyAuditData = [
      { userName: 'Carson Darrin', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Carson', updatedDate: '19/06/2024', updatedBy: 'Carson' },
      { userName: 'Ashy Handgun', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Ashy', updatedDate: '19/06/2024', updatedBy: 'Ashy' },
      { userName: 'Ashy Handgun', userType: 'Maker', firstName: 'Krishna', lastName: 'Das', dateCreated: '19/06/2024', createdBy: 'Ashy', updatedDate: '19/06/2024', updatedBy: 'Ashy' }
    ];
    const displayData = auditData && auditData.length > 0
      ? auditData.map(row => {
        const det = row["1"] || {};
        const createdString = row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : '19/06/2024';
        const updatedString = row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-GB') : '19/06/2024';

        return {
          userName: row.username || row.adminName || 'Unknown',
          userType: row.userRole === 'ROLE_ADMIN' ? 'Maker' : (row.userRole || 'Maker'),
          firstName: det.firstName || row.firstName || 'Krishna',
          lastName: det.lastName || row.lastName || 'Das',
          dateCreated: createdString,
          createdBy: row.createdBy || 'System',
          updatedDate: updatedString,
          updatedBy: row.updatedBy || 'System'
        };
      })
      : (!isLoadingAudit ? [] : dummyAuditData); // Show dummy only while initially loading or empty

    return (
      <div className="audit-trail-view">
        <div className="user-management-header">
          <div className="breadcrumb">User Management / <span>User List Report</span></div>
          <h2 className="page-title">User List Report</h2>
        </div>

        <div className="search-radio-group" style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
            <input
              type="radio"
              name="search_mode"
              checked={searchMode === 'date'}
              onChange={() => setSearchMode('date')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by Date Range
          </label>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
            <input
              type="radio"
              name="search_mode"
              checked={searchMode === 'username'}
              onChange={() => setSearchMode('username')}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by User Name
          </label>
        </div>

        <div className="audit-top-bar">
          <div className="audit-search-inputs">
            {searchMode === 'date' ? (
              <div className="date-range-wrapper date-range-picker">
                <input
                  type="date"
                  placeholder="Start date"
                  className="date-text-input"
                  value={filters.fromDate}
                  onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                />
                <span className="date-separator">→</span>
                <input
                  type="date"
                  placeholder="End date"
                  className="date-text-input"
                  value={filters.toDate}
                  onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="search-input-wrapper dynamic-search">
                  <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input
                    type="text"
                    placeholder="Search by User Name"
                    value={filters.username}
                    onChange={e => setFilters({ ...filters, username: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && loadAuditLogs()}
                    style={{ width: '220px', border: 'none', outline: 'none' }}
                  />
                </div>
                <div className="dropdown-filter" style={{ padding: '0', border: 'none', background: 'transparent' }}>
                  <select
                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #d9d9d9', outline: 'none', background: '#fff', cursor: 'pointer', color: '#595959' }}
                    value={filters.userType}
                    onChange={e => setFilters({ ...filters, userType: e.target.value })}
                  >
                    <option value="ALL">User Type</option>
                    <option value="CBC">CBC</option>
                    <option value="Agent">Agent</option>
                    <option value="CBC Maker">CBC Maker</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <button className="btn-download">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download Sample File
          </button>
        </div>

        <div className="table-card">
          <div className="nsdl-table-container">
            <table className="nsdl-table nsdl-user-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <div className="checkbox-cell">
                      <input type="checkbox" />
                    </div>
                  </th>
                  <th>User Name <span className="sort-icons">↕</span></th>
                  <th>User Type <span className="sort-icons">↕</span></th>
                  <th>first Name <span className="sort-icons">↕</span></th>
                  <th>Last Name <span className="sort-icons">↕</span></th>
                  <th>Date Created <span className="sort-icons">↕</span></th>
                  <th>Created By <span className="sort-icons">↕</span></th>
                  <th>Updated Date <span className="sort-icons">↕</span></th>
                  <th>Updated By <span className="sort-icons">↕</span></th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, idx) => (
                  <tr key={idx} className={selectedRows.includes(idx) ? 'selected-row' : ''}>
                    <td>
                      <div className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(idx)}
                          onChange={() => toggleRowSelect(idx)}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="admin-avatar-cell">
                        <div className="mini-avatar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        {row.userName}
                      </div>
                    </td>
                    <td>{row.userType}</td>
                    <td>{row.firstName}</td>
                    <td>{row.lastName}</td>
                    <td>{row.dateCreated}</td>
                    <td>{row.createdBy}</td>
                    <td>{row.updatedDate}</td>
                    <td>{row.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-bar">
          <div className="pagination-left">
            <span className="page-text">Row per page</span>
            <select className="page-select" value={rowsPerPage} onChange={(e) => setRowsPerPage(e.target.value)}>
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

  const renderUserRequest = () => {
    // Dummy Data structurally cloned perfectly to Figma layout provided
    const requestData = [
      { firstName: 'Krishna', lastName: 'Das', userName: 'SP028', mobile: '809829919', email: 'Krishna@gmail.com', role: 'Maker', dateCreated: '19/06/2024', status: 'Active' },
      { firstName: 'Krishna', lastName: 'Das', userName: 'SP028', mobile: '809829919', email: 'Krishna@gmail.com', role: 'Maker', dateCreated: '19/06/2024', status: 'Active' },
      { firstName: 'Krishna', lastName: 'Das', userName: 'SP028', mobile: '809829919', email: 'Krishna@gmail.com', role: 'Maker', dateCreated: '19/06/2024', status: 'Active' }
    ];

    return (
      <div className="audit-trail-view">
        <div className="user-management-header">
          <div className="breadcrumb">User Management / <span>User Request</span></div>
          <h2 className="page-title">User Request</h2>
        </div>

        <div className="search-radio-group" style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
            <input
              type="radio"
              name="req_search_mode"
              defaultChecked={false}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by Date Range
          </label>
          <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
            <input
              type="radio"
              name="req_search_mode"
              defaultChecked={true}
              style={{ accentColor: '#a80000', cursor: 'pointer', width: '16px', height: '16px', margin: 0 }}
            />
            Search by User Name
          </label>
        </div>

        <div className="audit-top-bar" style={{ marginTop: '16px', background: 'transparent', boxShadow: 'none', padding: '0' }}>
          <div className="audit-search-inputs">
            <div className="search-input-wrapper dynamic-search" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Search User Name" style={{ width: '220px', border: 'none', outline: 'none', marginLeft: '8px' }} />
            </div>
          </div>
        </div>

        <div className="table-card" style={{ marginTop: '24px' }}>
          <div className="nsdl-table-container">
            <table className="nsdl-table nsdl-user-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '16px', height: '16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff' }}></div>
                    </div>
                  </th>
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
                {requestData.map((row, idx) => (
                  <tr key={idx} className={idx === 2 ? 'selected-row' : ''} style={{ height: '56px' }}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {idx === 2 ? (
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#a80000', border: '1px solid #a80000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        ) : (
                          <div style={{ width: '16px', height: '16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff' }}></div>
                        )}
                      </div>
                    </td>
                    <td>{row.firstName}</td>
                    <td>{row.lastName}</td>
                    <td>{row.userName}</td>
                    <td>{row.mobile}</td>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    <td>{row.dateCreated}</td>
                    <td><span style={{ color: '#52c41a', background: '#f6ffed', border: '1px solid #b7eb8f', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{row.status}</span></td>
                    <td><span style={{ color: '#a80000', cursor: 'pointer', fontWeight: '500' }}>View Details</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-bar">
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

  const renderTrueAuditTrail = () => {
    // Dummy Data structurally cloned perfectly to Figma layout provided for Audi Trail
    const trackData = [
      { fieldName: 'Maker', userName: 'Krishna', userId: 'CBC', adminAvatar: 'Carson Darrin', adminName: 'Carson Darrin', adminId: 'Das', createdDate: '19/06/2024', updatedDate: '19/06/2024', operation: '809829919' },
      { fieldName: 'Maker', userName: 'Krishna', userId: 'CBC', adminAvatar: 'Ashy Handgun', adminName: 'Ashy Handgun', adminId: 'Das', createdDate: '19/06/2024', updatedDate: '19/06/2024', operation: '809829919' },
      { fieldName: 'Maker', userName: 'Krishna', userId: 'CBC', adminAvatar: 'Ashy Handgun', adminName: 'Ashy Handgun', adminId: 'Das', createdDate: '19/06/2024', updatedDate: '19/06/2024', operation: '809829919' }
    ];

    return (
      <div className="audit-trail-view">
        <div className="user-management-header" style={{ marginBottom: '16px' }}>
          <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>Audit Trail</h2>
        </div>

        <div className="audit-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="audit-search-inputs" style={{ display: 'flex', gap: '16px' }}>
            <div className="search-input-wrapper dynamic-search" style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Search by User Name" style={{ width: '220px', border: 'none', outline: 'none', marginLeft: '8px' }} />
            </div>

            <div className="date-range-wrapper date-range-picker" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '0 12px' }}>
              <input type="text" placeholder="Start date" style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c' }} />
              <span style={{ color: '#bfbfbf', margin: '0 8px' }}>→</span>
              <input type="text" placeholder="End date" style={{ border: 'none', outline: 'none', width: '80px', color: '#8c8c8c' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="2" style={{ marginLeft: '8px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
          </div>

          <button className="btn-download" style={{ background: '#a80000', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download Sample File
          </button>
        </div>

        <div className="table-card" style={{ marginTop: '24px' }}>
          <div className="nsdl-table-container">
            <table className="nsdl-table nsdl-user-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: '16px', height: '16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff' }}></div>
                    </div>
                  </th>
                  <th>Field Name <span className="sort-icons">↕</span></th>
                  <th>User Name <span className="sort-icons">↕</span></th>
                  <th>User ID <span className="sort-icons">↕</span></th>
                  <th>Admin Name <span className="sort-icons">↕</span></th>
                  <th>Admin ID <span className="sort-icons">↕</span></th>
                  <th>Created Date <span className="sort-icons">↕</span></th>
                  <th>Updated Date <span className="sort-icons">↕</span></th>
                  <th>Operation Performed <span className="sort-icons">↕</span></th>
                </tr>
              </thead>
              <tbody>
                {trackData.map((row, idx) => (
                  <tr key={idx} className={idx === 2 ? 'selected-row' : ''} style={{ height: '64px' }}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {idx === 2 ? (
                          <div style={{ width: '16px', height: '16px', backgroundColor: '#a80000', border: '1px solid #a80000', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        ) : (
                          <div style={{ width: '16px', height: '16px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff' }}></div>
                        )}
                      </div>
                    </td>
                    <td>{row.fieldName}</td>
                    <td>{row.userName}</td>
                    <td>{row.userId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#bfbfbf', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        {row.adminName}
                      </div>
                    </td>
                    <td>{row.adminId}</td>
                    <td>{row.createdDate}</td>
                    <td>{row.updatedDate}</td>
                    <td>{row.operation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-bar">
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

  return (
    <div className="dashboard-container">
      {/* ── SIDEBAR ── */}
      <aside className="sider">
        <div className="logo-section" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center' }}>
          <img src={nsdlLogo} alt="NSDL Payments Bank" style={{ height: '28px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>

        <nav className="menu-nav">
          <div
            className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M1.75 1.75H6.125V8.75H1.75V1.75ZM7.875 1.75H12.25V5.25H7.875V1.75ZM7.875 12.25H12.25V7H7.875V12.25ZM1.75 12.25H6.125V10.5H1.75V12.25Z" /></svg>
            </span>
            Dashboard
          </div>

          <div className="menu-item menu-parent">
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <span>User Management</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 5L5 1L9 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          <div
            className={`menu-item ${activeMenu === 'user-request' ? 'active' : ''}`}
            style={{ paddingLeft: '40px' }}
            onClick={() => setActiveMenu('user-request')}
          >
            User Request
          </div>

          <div
            className={`menu-item ${activeMenu === 'user-list-report' ? 'active' : ''}`}
            style={{ paddingLeft: '40px' }}
            onClick={() => setActiveMenu('user-list-report')}
          >
            User List Report
          </div>

          <div
            className={`menu-item ${activeMenu === 'audit-trail' ? 'active' : ''}`}
            style={{ paddingLeft: '40px' }}
            onClick={() => setActiveMenu('audit-trail')}
          >
            <span className="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" /></svg>
            </span>
            Audit Trail
          </div>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="dashboard-frame">
        <header className="global-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '64px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <div className="header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>

          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <div style={{ position: 'absolute', top: '-6px', right: '-4px', background: '#a80000', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>9</div>
            </div>
            <div
              className="profile-section"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffeef0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 'bold', color: '#a80000' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name" style={{ fontSize: '14px', color: '#262626' }}>{userName}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: '4px' }}><path d="M1 1L5 5L9 1" stroke="#8c8c8c" strokeLinecap="round" strokeLinejoin="round" /></svg>

              {showProfileMenu && (
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: '0', background: 'white', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '8px 0', zIndex: 10, width: '180px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div className="dropdown-item" style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#262626' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Profile
                  </div>
                  <div className="dropdown-item" style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#262626' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Change Password
                  </div>
                  <div className="dropdown-item" onClick={() => setShowLogoutModal(true)} style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#262626' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          {activeMenu === 'dashboard' && renderDashboard()}
          {activeMenu === 'user-list-report' && renderAuditTrail()}
          {activeMenu === 'user-request' && renderUserRequest()}
          {activeMenu === 'audit-trail' && renderTrueAuditTrail()}
        </main>
      </div>

      {/* ── LOGOUT MODAL ── */}
      {showLogoutModal && (
        <div className="logout-confirm-overlay">
          <div className="nsdl-modal">
            <div className="nsdl-modal-header">Confirm Logout</div>
            <div className="nsdl-modal-body">Are you sure want to Logout?</div>
            <div className="nsdl-modal-footer">
              <button onClick={() => setShowLogoutModal(false)} style={{ color: '#8c8c8c' }}>Cancel</button>
              <button onClick={handleLogout}>Okay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
