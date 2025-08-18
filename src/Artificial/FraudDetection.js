import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';


const FraudDetection = ({ contract, provider, userList, onBlacklist, account, isOwner, onUserListUpdate }) => {
  const [fraudData, setFraudData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [blacklistedAddresses, setBlacklistedAddresses] = useState([]);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [showFraudSection, setShowFraudSection] = useState(false);
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [searchAddress, setSearchAddress] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Enhanced API configuration with fallbacks
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
  const FALLBACK_API_URL = 'http://127.0.0.1:3001/api';

  useEffect(() => {
    initializeComponent();
  }, []);

  // Load blacklisted addresses from smart contract
  useEffect(() => {
    if (contract && userList.length > 0) {
      loadBlacklistedAddressesFromContract();
    }
  }, [contract, userList]);

  const initializeComponent = async () => {
    await checkBackendHealth();
    await loadFraudData();
  };

  // Load blacklisted addresses from smart contract
  const loadBlacklistedAddressesFromContract = async () => {
    if (!contract || !userList) return;
    
    try {
      console.log('🔍 Loading blacklisted addresses from smart contract...');
      const blacklisted = [];
      
      // Check each user address for blacklist status
      for (const user of userList) {
        try {
          const isBlacklisted = await contract.isBlacklisted(user.address);
          if (isBlacklisted) {
            blacklisted.push(user.address);
          }
        } catch (error) {
          console.error(`Error checking blacklist status for ${user.address}:`, error);
        }
      }
      
      setBlacklistedAddresses(blacklisted);
      console.log(`✅ Found ${blacklisted.length} blacklisted addresses from smart contract`);
      
    } catch (error) {
      console.error('❌ Error loading blacklisted addresses from contract:', error);
    }
  };

  // Enhanced backend health check
  const checkBackendHealth = async () => {
    console.log('🔍 Checking backend health...');
    
    const urls = [API_BASE_URL, FALLBACK_API_URL];
    
    for (const baseUrl of urls) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend health check passed:', data);
          setConnectionStatus('connected');
          return;
        }
      } catch (error) {
        console.log(`❌ Health check failed for ${baseUrl}:`, error.message);
      }
    }
    
    setConnectionStatus('disconnected');
    console.error('❌ All backend health checks failed');
  };

  const makeApiRequest = async (endpoint, options = {}) => {
    const urls = [API_BASE_URL, FALLBACK_API_URL];
    
    for (const baseUrl of urls) {
      try {
        const url = `${baseUrl}${endpoint}`;
        console.log(`📡 Making request to: ${url}`);
        console.log(`📤 Request options:`, options);
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          ...options
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error Response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ API Success Response:`, result);
        return result;
        
      } catch (error) {
        console.error(`❌ Request failed for ${baseUrl}: ${error.message}`);
        if (urls.indexOf(baseUrl) === urls.length - 1) {
          throw error;
        }
      }
    }
  };

  const loadFraudData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading fraud data...');
      
      const data = await makeApiRequest('/fraud-detection');
      
      if (data.success) {
        setFraudData(data.data);
        setLastAnalysis(data.lastAnalysis);
        console.log('✅ Fraud data loaded successfully');
      } else {
        console.warn('⚠️ Fraud data load failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error loading fraud data:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const runFraudAnalysis = async () => {
    console.log('🔍 === STARTING ENHANCED FRAUD ANALYSIS ===');
    
    if (!contract || !contract.address) {
      alert('❌ Smart contract not connected');
      return;
    }

    try {
      setAnalyzing(true);
      setConnectionStatus('analyzing');
      
      // Enhanced request preparation
      const requestData = {
        contractAddress: contract.address,
        rpcUrl: 'https://sepolia.infura.io/v3/cb713103d75f44a39ea5e0ccfd711a5b',
        analysisType: 'comprehensive',
        includePatterns: true,
        riskThreshold: 30
      };
      
      console.log('📤 Analysis request data:', requestData);
      
      const data = await makeApiRequest('/fraud-detection/analyze', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (data.success) {
        console.log('✅ Analysis completed successfully!');
        console.log('📊 Analysis results:', data.data);
        
        setFraudData(data.data);
        setLastAnalysis(new Date().toISOString());
        setShowFraudSection(true);
        setConnectionStatus('connected');
        
        // Enhanced success message with details
        const suspiciousCount = data.data.fraud_report.suspicious_addresses;
        const highRiskCount = data.data.fraud_report.high_risk_addresses;
        
        alert(`🤖 AI Fraud Analysis Completed!
        
📊 Results:
• Total addresses analyzed: ${data.data.fraud_report.total_addresses}
• Suspicious addresses found: ${suspiciousCount}
• High risk addresses: ${highRiskCount}

${suspiciousCount > 0 ? '⚠️ Review the suspicious addresses below!' : '✅ No major risks detected!'}`);
        
      } else {
        console.error('❌ Analysis failed:', data.message);
        alert(`❌ Analysis failed: ${data.message}`);
        setConnectionStatus('error');
      }
      
    } catch (error) {
      console.error('💥 Analysis error:', error);
      setConnectionStatus('error');
      
      let errorMessage = '❌ Analysis failed: ';
      if (error.message.includes('fetch')) {
        errorMessage += 'Cannot connect to backend server. Please check:\n';
        errorMessage += '1. Backend server is running\n';
        errorMessage += '2. No firewall blocking port 3001\n';
        errorMessage += '3. Try restarting the backend server';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

// FIXED: ADD TO BLACKLIST
const addToBlacklist = async (address, reason = 'Manual blacklist from fraud detection') => {
  if (!contract || !isOwner) {
    alert('❌ Only contract owner can blacklist addresses');
    return;
  }
  if (!ethers.utils.isAddress(address)) {
    alert('❌ Invalid Ethereum address');
    return;
  }

  try {
    setLoading(true);
    console.log(`🚫 Blacklisting address: ${address}`);
    
    // 1. First, execute blockchain transaction
    const tx = await contract.blacklistAddress(address);
    console.log('📝 Transaction sent:', tx.hash);
    
    await tx.wait();
    console.log('✅ Blockchain transaction confirmed');
    
    // 2. Then update backend API
    try {
      await makeApiRequest('/blacklist/add', {
        method: 'POST',
        body: JSON.stringify({ 
          address, 
          reason: `${reason} - Confirmed on blockchain` 
        })
      });
      console.log('✅ Backend updated successfully');
    } catch (apiError) {
      console.warn('⚠️ Backend update failed but blockchain succeeded:', apiError);
    }

    // 3. Update UI optimistically
    setBlacklistedAddresses(prev => [...new Set([...prev, address])]);

    alert(`✅ Address ${address.substring(0, 10)}... successfully blacklisted on blockchain!`);

  } catch (error) {
    console.error('❌ Error blacklisting address:', error);
    alert(`❌ Failed to blacklist: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// FIXED: REMOVE FROM BLACKLIST
const removeFromBlacklist = async (address) => {
  if (!contract || !isOwner) {
    alert('❌ Only contract owner can unblacklist addresses');
    return;
  }
  if (!ethers.utils.isAddress(address)) {
    alert('❌ Invalid Ethereum address');
    return;
  }

  try {
    setLoading(true);
    console.log(`✅ Starting unblacklist process for: ${address}`);
    
    // 1. First, execute blockchain transaction
    const tx = await contract.unblacklistAddress(address);
    console.log('📝 Unblacklist transaction sent:', tx.hash);
    
    await tx.wait();
    console.log('✅ Blockchain transaction confirmed - address unblacklisted');
    
    // 2. Then update backend API
    try {
      console.log('📡 Updating backend API...');
      await makeApiRequest('/blacklist/remove', {
        method: 'POST',
        body: JSON.stringify({ address })
      });
      console.log('✅ Backend API updated successfully');
    } catch (apiError) {
      console.warn('⚠️ Backend API update failed but blockchain succeeded:', apiError);
      // This is not critical - blockchain is the source of truth
    }

    // 3. Update UI optimistically
    setBlacklistedAddresses(prev => 
      prev.filter(addr => addr.toLowerCase() !== address.toLowerCase())
    );

    alert(`✅ Address ${address.substring(0, 10)}... successfully unblacklisted on blockchain!`);

  } catch (error) {
    console.error('❌ Error unblacklisting address:', error);
    alert(`❌ Failed to unblacklist: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // Enhanced risk level calculation with lower thresholds
  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'Critical', color: 'critical-risk', bgColor: 'critical-bg' };
    if (score >= 50) return { level: 'High', color: 'high-risk', bgColor: 'high-bg' };
    if (score >= 30) return { level: 'Medium', color: 'medium-risk', bgColor: 'medium-bg' };
    return { level: 'Low', color: 'low-risk', bgColor: 'low-bg' };
  };

  const getFilteredSuspiciousAddresses = () => {
    if (!fraudData || !fraudData.fraud_report.suspicious_list) return [];
    
    let filtered = fraudData.fraud_report.suspicious_list;
    
    // Filter by risk level
    if (filterRiskLevel !== 'all') {
      filtered = filtered.filter(addr => {
        const risk = getRiskLevel(addr.risk_score);
        return risk.level.toLowerCase() === filterRiskLevel;
      });
    }
    
    // Filter by search address
    if (searchAddress) {
      filtered = filtered.filter(addr => 
        addr.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }
    
    return filtered;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPatternChartData = (data, maxValue) => {
    return Object.entries(data).map(([key, value]) => ({
      key,
      value,
      percentage: (value / maxValue) * 100
    }));
  };

  // Enhanced connection status indicator
  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: '🟢', text: 'Connected', className: 'status-connected' };
      case 'analyzing':
        return { icon: '🔄', text: 'Analyzing...', className: 'status-analyzing' };
      case 'disconnected':
        return { icon: '🔴', text: 'Disconnected', className: 'status-disconnected' };
      case 'error':
        return { icon: '⚠️', text: 'Error', className: 'status-error' };
      default:
        return { icon: '🟡', text: 'Unknown', className: 'status-unknown' };
    }
  };

  const status = getConnectionStatusIndicator();

  return (
    <div className="fraud-detection-container">
      {/* Enhanced Header Section */}
      <div className="fraud-header">
        <div className="fraud-header-content">
          <h2 className="fraud-title">🤖 AI Fraud Detection System</h2>
          <p className="fraud-subtitle">Advanced machine learning powered fraud analysis with blockchain integration</p>
          
          {/* Connection Status Indicator */}
          <div className={`connection-status ${status.className}`}>
            <span className="status-icon">{status.icon}</span>
            <span className="status-text">Backend: {status.text}</span>
          </div>
          
          {/* Smart Contract Status */}
          <div className="contract-status">
            <span className="status-icon">{contract ? '🟢' : '🔴'}</span>
            <span className="status-text">
              Contract: {contract ? 'Connected' : 'Not Connected'}
            </span>
            {contract && (
              <span className="contract-address">
                ({contract.address.substring(0, 8)}...{contract.address.substring(contract.address.length - 6)})
              </span>
            )}
          </div>
          
          <div className="fraud-controls">
            <button
              onClick={runFraudAnalysis}
              disabled={analyzing || !contract || connectionStatus === 'disconnected'}
              className="action-btn fraud-analyze-btn"
            >
              {analyzing ? (
                <span className="analyzing-text">
                  <span className="spinner"></span>
                  Analyzing Smart Contract...
                </span>
              ) : (
                '🔍 Run Enhanced AI Analysis'
              )}
            </button>
            
            <button
              onClick={() => setShowFraudSection(!showFraudSection)}
              className="action-btn toggle-btn"
            >
              {showFraudSection ? '📊 Hide Analysis' : '📊 Show Analysis'}
            </button>
            
            <button
              onClick={checkBackendHealth}
              className="action-btn health-check-btn"
              disabled={analyzing}
            >
              🔍 Check Backend
            </button>
            
            <button
              onClick={loadBlacklistedAddressesFromContract}
              className="action-btn refresh-btn"
              disabled={!contract || loading}
            >
              🔄 Refresh Blacklist
            </button>
          </div>
          
          {lastAnalysis && (
            <div className="last-analysis">
              <span className="analysis-time">
                🕒 Last analysis: {formatTimestamp(lastAnalysis)}
              </span>
            </div>
          )}
          
          {/* Backend Connection Help */}
          {connectionStatus === 'disconnected' && (
            <div className="connection-help">
              <div className="help-content">
                <h4>❌ Backend Connection Failed</h4>
                <p>Please ensure the backend server is running:</p>
                <div className="help-commands">
                  <code>cd backend && node fraud-api-server.js</code>
                </div>
                <p>Or check if the server is running on port 3001</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Statistics Dashboard */}
      {fraudData && showFraudSection && (
        <div className="fraud-dashboard">
          <div className="stats-grid">
            <div className="stat-card total-addresses">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Total Addresses</h3>
                <p className="stat-number">{fraudData.fraud_report.total_addresses}</p>
                <p className="stat-description">Analyzed addresses</p>
              </div>
            </div>
            
            <div className="stat-card suspicious-addresses">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>Suspicious</h3>
                <p className="stat-number">{fraudData.fraud_report.suspicious_addresses}</p>
                <p className="stat-description">Risk score &gt; 30</p>
              </div>
            </div>
            
            <div className="stat-card high-risk-addresses">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <h3>High Risk</h3>
                <p className="stat-number">{fraudData.fraud_report.high_risk_addresses}</p>
                <p className="stat-description">Risk score &gt; 60</p>
              </div>
            </div>
            
            <div className="stat-card blacklisted-addresses">
              <div className="stat-icon">🚫</div>
              <div className="stat-content">
                <h3>Blacklisted</h3>
                <p className="stat-number">{blacklistedAddresses.length}</p>
                <p className="stat-description">Blocked on blockchain</p>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="fraud-filters">
            <div className="filter-group">
              <label>Filter by Risk Level:</label>
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical (≥70)</option>
                <option value="high">High (50-69)</option>
                <option value="medium">Medium (30-49)</option>
                <option value="low">Low (&lt;30)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Search Address:</label>
              <input
                type="text"
                placeholder="0x... or partial address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-stats">
              <span>Showing {getFilteredSuspiciousAddresses().length} of {fraudData.fraud_report.suspicious_list.length} suspicious addresses</span>
            </div>
          </div>

          {/* Enhanced Suspicious Addresses Table */}
          <div className="suspicious-section">
            <h3>⚠️ Suspicious Addresses Analysis</h3>
            
            {getFilteredSuspiciousAddresses().length > 0 ? (
              <div className="table-container">
                <table className="fraud-table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Risk Score</th>
                      <th>Risk Level</th>
                      <th>Transactions</th>
                      <th>Repay Rate</th>
                      <th>Night Activity</th>
                      <th>Loans</th>
                      <th>Blockchain Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredSuspiciousAddresses().map((addr, index) => {
                      const risk = getRiskLevel(addr.risk_score);
                      const isBlacklisted = blacklistedAddresses.includes(addr.address);
                      
                      return (
                        <tr key={index} className={`table-row ${risk.bgColor}`}>
                          <td className="address-cell">
                            <div className="address-container">
                              <span className="address-text">
                                {addr.address.substring(0, 10)}...{addr.address.substring(addr.address.length - 8)}
                              </span>
                              <button 
                                className="copy-btn"
                                onClick={() => navigator.clipboard.writeText(addr.address)}
                                title="Copy full address"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="risk-score-cell">
                            <span className={`risk-score ${risk.color}`}>
                              {addr.risk_score.toFixed(1)}
                            </span>
                          </td>
                          <td className="risk-level-cell">
                            <span className={`risk-badge ${risk.bgColor}`}>
                              {risk.level}
                            </span>
                          </td>
                          <td className="transaction-cell">
                            <span className={addr.total_transactions > 100 ? 'high-transactions' : ''}>
                              {addr.total_transactions}
                            </span>
                          </td>
                          <td className={`repay-rate-cell ${addr.repay_rate < 0.7 ? 'low-repay' : ''}`}>
                            {(addr.repay_rate * 100).toFixed(1)}%
                          </td>
                          <td className={`night-activity-cell ${addr.night_ratio > 0.4 ? 'high-night' : ''}`}>
                            {(addr.night_ratio * 100).toFixed(1)}%
                          </td>
                          <td className="loans-cell">
                            <div className="loan-info">
                              <span className="loan-taken">{addr.total_loans}</span>
                              <span className="loan-separator">/</span>
                              <span className="loan-repaid">{addr.total_repays}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${isBlacklisted ? 'blacklisted' : 'active'}`}>
                              {isBlacklisted ? '🚫 Blacklisted' : '✅ Active'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {isBlacklisted ? (
                              <button
                                onClick={() => removeFromBlacklist(addr.address)}
                                className="action-btn small unblock-btn"
                                disabled={loading || !isOwner}
                                title={!isOwner ? 'Only contract owner can unblacklist' : 'Unblacklist address on blockchain'}
                              >
                                {loading ? 'Processing...' : 'Unblock'}
                              </button>
                            ) : (
                              <button
                                onClick={() => addToBlacklist(addr.address, `High risk score: ${addr.risk_score.toFixed(1)}`)}
                                className="action-btn small block-btn"
                                disabled={loading || !isOwner}
                                title={!isOwner ? 'Only contract owner can blacklist' : 'Blacklist address on blockchain'}
                              >
                                {loading ? 'Processing...' : ' Block'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">
                  {fraudData.fraud_report.suspicious_list.length === 0 ? '🎉' : '🔍'}
                </div>
                <p>
                  {fraudData.fraud_report.suspicious_list.length === 0 
                    ? 'No suspicious addresses found! Your contract looks clean.' 
                    : 'No addresses match current filters.'}
                </p>
                {fraudData.fraud_report.suspicious_list.length > 0 && (
                  <button 
                    onClick={() => {
                      setFilterRiskLevel('all');
                      setSearchAddress('');
                    }}
                    className="action-btn clear-filters-btn"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Transaction Patterns */}
          <div className="patterns-section">
            <h3>📊 Transaction Patterns Analysis</h3>
            
            <div className="patterns-grid">
              {/* Hourly Distribution */}
              <div className="pattern-card">
                <h4>⏰ Hourly Distribution</h4>
                <div className="pattern-chart">
                  {fraudData.patterns.hourly_distribution && 
                    getPatternChartData(
                      fraudData.patterns.hourly_distribution,
                      Math.max(...Object.values(fraudData.patterns.hourly_distribution))
                    ).map(({ key, value, percentage }) => (
                      <div key={key} className="chart-item">
                        <span className="chart-label">{key}:00</span>
                        <div className="chart-bar-container">
                          <div 
                            className={`chart-bar hourly-bar ${(key >= 22 || key <= 6) ? 'night-hours' : ''}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="chart-value">{value}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="pattern-insights">
                  <p>🌙 Night hours (22:00-06:00) activity may indicate automated behavior</p>
                </div>
              </div>

              {/* Transaction Types */}
              <div className="pattern-card">
                <h4>📈 Transaction Types</h4>
                <div className="pattern-chart">
                  {fraudData.patterns.transaction_types &&
                    getPatternChartData(
                      fraudData.patterns.transaction_types,
                      Math.max(...Object.values(fraudData.patterns.transaction_types))
                    ).map(({ key, value, percentage }) => (
                      <div key={key} className="chart-item">
                        <span className="chart-label">{key.replace('_', ' ')}</span>
                        <div className="chart-bar-container">
                          <div 
                            className={`chart-bar type-bar ${key.includes('loan') ? 'loan-type' : ''}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="chart-value">{value}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="pattern-insights">
                  <p>📊 High loan_taken vs loan_repaid ratio may indicate risk</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Manual Blacklist Management - REMOVED */}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner-large"></div>
            <p>Processing blockchain transaction...</p>
            <p className="loading-sub">Please confirm the transaction in MetaMask</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDetection;