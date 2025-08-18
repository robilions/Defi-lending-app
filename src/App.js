import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import FraudDetection from './Artificial/FraudDetection';
import './App.css';

// Contract ABI
const contractABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function takeLoan(uint256 amount)",
  "function repayLoan()",
  "function getLoanInfo(address borrower) view returns (uint256 amount, uint256 dueDate, bool isActive)",
  "function isBlacklisted(address account) view returns (bool)",
  "function owner() view returns (address)",
  "function blacklistAddress(address account)",
  "function unblacklistAddress(address account)",
  "function isLoanOverdue(address borrower) view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Mint(address indexed to, uint256 amount)",
  "event Burn(address indexed from, uint256 amount)",
  "event LoanTaken(address indexed borrower, uint256 amount, uint256 dueDate)",
  "event LoanRepaid(address indexed borrower, uint256 amount)",
  "event AddressBlacklisted(address indexed account)",
  "event AddressUnblacklisted(address indexed account)"
];

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x2a9aB2f9f1acef36E455254754f422208fb46D7F"; // Ganti dengan alamat contract Anda

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isOwner, setIsOwner] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [loanInfo, setLoanInfo] = useState({ amount: '0', dueDate: 0, isActive: false });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);

  
  // Form states
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [transferFromOwner, setTransferFromOwner] = useState('');
  const [transferFromTo, setTransferFromTo] = useState('');
  const [transferFromAmount, setTransferFromAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [allowanceOwner, setAllowanceOwner] = useState('');
  const [allowanceSpender, setAllowanceSpender] = useState('');
  const [allowanceResult, setAllowanceResult] = useState('0');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [unblacklistAddress, setUnblacklistAddress] = useState('');

  
useEffect(() => {
  const loadData = async () => {
    if (contract && account) {
      await loadUserData(contract, account);
      if (isOwner) {
        await loadUsersData();
      }
    }
  };
  
  loadData();
}, [contract, account, isOwner]);


  // Initialize provider and check connection
  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        
        // Check if already connected
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    };
    
    initializeProvider();
  }, []);

  // Auto disconnect on refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (account) {
        disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [account]);


  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask is required!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      
      // Initialize contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      setContract(contract);
      
      // Load initial data
      await loadUserData(contract, address);
      await loadUsersData();
      
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + error.message);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setBalance('0');
    setIsOwner(false);
    setIsBlacklisted(false);
    setLoanInfo({ amount: '0', dueDate: 0, isActive: false });
    setActivities([]);
  };

  // Load user data
  const loadUserData = async (contract, address) => {
    try {
      setLoading(true);
      
      // Get balance
      const balance = await contract.balanceOf(address);
      setBalance(ethers.utils.formatEther(balance));
      
      // Check if owner
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
      
      // Check if blacklisted
      const blacklisted = await contract.isBlacklisted(address);
      setIsBlacklisted(blacklisted);
      
      // Get loan info
      const loan = await contract.getLoanInfo(address);
      setLoanInfo({
        amount: ethers.utils.formatEther(loan.amount),
        dueDate: loan.dueDate.toNumber(),
        isActive: loan.isActive
      });
      
      // Load activities
      await loadActivities(contract, address);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load activities from events
  const loadActivities = async (contract, address) => {
    try {
      const provider = contract.provider;
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10000 blocks
      
      const activities = [];
      
      // Get Transfer events
      const transferFilter = contract.filters.Transfer();
      const transferEvents = await contract.queryFilter(transferFilter, fromBlock, currentBlock);
      
      // Get Mint events
      const mintFilter = contract.filters.Mint();
      const mintEvents = await contract.queryFilter(mintFilter, fromBlock, currentBlock);
      
      // Get Burn events
      const burnFilter = contract.filters.Burn();
      const burnEvents = await contract.queryFilter(burnFilter, fromBlock, currentBlock);
      
      // Get Loan events
      const loanTakenFilter = contract.filters.LoanTaken();
      const loanTakenEvents = await contract.queryFilter(loanTakenFilter, fromBlock, currentBlock);
      
      const loanRepaidFilter = contract.filters.LoanRepaid();
      const loanRepaidEvents = await contract.queryFilter(loanRepaidFilter, fromBlock, currentBlock);
      
      // Process Transfer events
      for (const event of transferEvents) {
        if (event.args.from.toLowerCase() === address.toLowerCase() || 
            event.args.to.toLowerCase() === address.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          activities.push({
            type: 'Transfer',
            from: event.args.from,
            to: event.args.to,
            amount: ethers.utils.formatEther(event.args.value),
            timestamp: block.timestamp,
            hash: event.transactionHash
          });
        }
      }
      
      // Process Mint events
      for (const event of mintEvents) {
        if (event.args.to.toLowerCase() === address.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          activities.push({
            type: 'Mint',
            to: event.args.to,
            amount: ethers.utils.formatEther(event.args.amount),
            timestamp: block.timestamp,
            hash: event.transactionHash
          });
        }
      }
      
      // Process Burn events
      for (const event of burnEvents) {
        if (event.args.from.toLowerCase() === address.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          activities.push({
            type: 'Burn',
            from: event.args.from,
            amount: ethers.utils.formatEther(event.args.amount),
            timestamp: block.timestamp,
            hash: event.transactionHash
          });
        }
      }
      
      // Process Loan events
      for (const event of loanTakenEvents) {
        if (event.args.borrower.toLowerCase() === address.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          activities.push({
            type: 'Loan Taken',
            borrower: event.args.borrower,
            amount: ethers.utils.formatEther(event.args.amount),
            dueDate: event.args.dueDate.toNumber(),
            timestamp: block.timestamp,
            hash: event.transactionHash
          });
        }
      }
      
      for (const event of loanRepaidEvents) {
        if (event.args.borrower.toLowerCase() === address.toLowerCase()) {
          const block = await provider.getBlock(event.blockNumber);
          activities.push({
            type: 'Loan Repaid',
            borrower: event.args.borrower,
            amount: ethers.utils.formatEther(event.args.amount),
            timestamp: block.timestamp,
            hash: event.transactionHash
          });
        }
      }
      
      // Sort by timestamp (newest first)
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(activities);
      
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const getRiskLevelForUser = (user) => {
  let riskScore = 0;
  
  // High balance might indicate potential for large fraudulent transactions
  if (parseFloat(user.balance) > 10000) riskScore += 20;
  
  // Active loan that's overdue is high risk
  if (user.isActive && isLoanOverdueForUser(user)) riskScore += 40;
  
  // Very high loan amount relative to balance
  if (user.isActive && parseFloat(user.loanAmount) > parseFloat(user.balance) * 2) riskScore += 30;
  
  if (riskScore >= 70) return { level: 'High', className: 'high-risk-user', icon: '🚨' };
  if (riskScore >= 40) return { level: 'Medium', className: 'medium-risk-user', icon: '⚠️' };
  if (riskScore >= 20) return { level: 'Low', className: 'low-risk-user', icon: '⚡' };
  return { level: 'Normal', className: 'normal-risk-user', icon: '✅' };
};

const isLoanOverdueForUser = (user) => {
  return user.isActive && Date.now() / 1000 > user.dueDate;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert(`Address copied to clipboard: ${text}`);
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert(`Address copied to clipboard: ${text}`);
  }
};



  const getUniqueAddressesFromEvents = async () => {
  if (!contract) return [];

  const provider = contract.provider;
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 10000); // ambil blok 10000 terakhir

  const addressSet = new Set();

  const transferEvents = await contract.queryFilter(contract.filters.Transfer(), fromBlock, currentBlock);
  transferEvents.forEach(e => {
    addressSet.add(e.args.from.toLowerCase());
    addressSet.add(e.args.to.toLowerCase());
  });

  const mintEvents = await contract.queryFilter(contract.filters.Mint(), fromBlock, currentBlock);
  mintEvents.forEach(e => addressSet.add(e.args.to.toLowerCase()));

  const loanEvents = await contract.queryFilter(contract.filters.LoanTaken(), fromBlock, currentBlock);
  loanEvents.forEach(e => addressSet.add(e.args.borrower.toLowerCase()));

  return [...addressSet];
};

const loadUsersData = async () => {
  try {
    setLoading(true);
    console.log('Loading comprehensive user data...');
    
    const addresses = await getUniqueAddressesFromEvents();
    console.log(`Found ${addresses.length} unique addresses`);
    
    const userData = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const balance = await contract.balanceOf(addr);
          const loan = await contract.getLoanInfo(addr);
          const isBlacklisted = await contract.isBlacklisted(addr);
          
          return {
            address: addr,
            balance: ethers.utils.formatEther(balance),
            loanAmount: ethers.utils.formatEther(loan.amount),
            dueDate: loan.dueDate.toNumber(),
            isActive: loan.isActive,
            isBlacklisted: isBlacklisted,
            lastUpdated: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error loading data for address ${addr}:`, error);
          return {
            address: addr,
            balance: '0',
            loanAmount: '0',
            dueDate: 0,
            isActive: false,
            isBlacklisted: false,
            error: true,
            lastUpdated: new Date().toISOString()
          };
        }
      })
    );
    
    // Filter out addresses with errors and sort by balance
    const validUserData = userData
      .filter(user => !user.error)
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    
    setUserList(validUserData);
    console.log(`Successfully loaded data for ${validUserData.length} users`);
    
  } catch (error) {
    console.error("Failed loading user list:", error);
    alert("Error loading user data. Please try again.");
  } finally {
    setLoading(false);
  }
};

class FraudDetectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fraud Detection Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>🚨 Fraud Detection Error</h3>
            <p>Something went wrong with the fraud detection system.</p>
            <button 
              className="action-btn"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


  // Transfer tokens
  const transfer = async () => {
    if (!transferTo || !transferAmount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(transferAmount);
      const tx = await contract.transfer(transferTo, amount);
      await tx.wait();
      
      alert('Transfer successful!');
      setTransferTo('');
      setTransferAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mint tokens (owner only)
  const mint = async () => {
    if (!mintTo || !mintAmount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(mintAmount);
      const tx = await contract.mint(mintTo, amount);
      await tx.wait();
      
      alert('Mint successful!');
      setMintTo('');
      setMintAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Mint error:', error);
      alert('Mint failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Burn tokens (owner only)
  const burn = async () => {
    if (!burnAmount) {
      alert('Please enter amount to burn');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(burnAmount);
      const tx = await contract.burn(amount);
      await tx.wait();
      
      alert('Burn successful!');
      setBurnAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Burn error:', error);
      alert('Burn failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve tokens
  const approve = async () => {
    if (!approveSpender || !approveAmount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(approveAmount);
      const tx = await contract.approve(approveSpender, amount);
      await tx.wait();
      
      alert('Approval successful!');
      setApproveSpender('');
      setApproveAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Approve error:', error);
      alert('Approve failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Transfer From
  const transferFrom = async () => {
    if (!transferFromOwner || !transferFromTo || !transferFromAmount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(transferFromAmount);
      const tx = await contract.transferFrom(transferFromOwner, transferFromTo, amount);
      await tx.wait();
      
      alert('TransferFrom successful!');
      setTransferFromOwner('');
      setTransferFromTo('');
      setTransferFromAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('TransferFrom error:', error);
      alert('TransferFrom failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check allowance
  const checkAllowance = async () => {
    if (!allowanceOwner || !allowanceSpender) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const allowance = await contract.allowance(allowanceOwner, allowanceSpender);
      setAllowanceResult(ethers.utils.formatEther(allowance));
    } catch (error) {
      console.error('Check allowance error:', error);
      alert('Check allowance failed: ' + error.message);
    }
  };

  // Take loan
  const takeLoan = async () => {
    if (!loanAmount) {
      alert('Please enter loan amount');
      return;
    }
    
    if (loanInfo.isActive) {
      alert('You already have an active loan');
      return;
    }
    
    try {
      setLoading(true);
      const amount = ethers.utils.parseEther(loanAmount);
      const tx = await contract.takeLoan(amount);
      await tx.wait();
      
      alert('Loan taken successfully!');
      setLoanAmount('');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Take loan error:', error);
      alert('Take loan failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Repay loan
  const repayLoan = async () => {
    if (!loanInfo.isActive) {
      alert('No active loan to repay');
      return;
    }
    
    try {
      setLoading(true);
      const tx = await contract.repayLoan();
      await tx.wait();
      
      alert('Loan repaid successfully!');
      
      // Refresh data
      await loadUserData(contract, account);
      
    } catch (error) {
      console.error('Repay loan error:', error);
      alert('Repay loan failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Blacklist address (owner only)
  const blacklistAddr = async () => {
    if (!blacklistAddress) {
      alert('Please enter address to blacklist');
      return;
    }
    
    try {
      setLoading(true);
      const tx = await contract.blacklistAddress(blacklistAddress);
      await tx.wait();
      
      alert('Address blacklisted successfully!');
      setBlacklistAddress('');
      
    } catch (error) {
      console.error('Blacklist error:', error);
      alert('Blacklist failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Unblacklist address (owner only)
const unblacklistAddr = async () => {
  if (!unblacklistAddress) {
    alert('Please enter address to unblacklist');
    return;
  }
  
  try {
    setLoading(true);
    const tx = await contract.unblacklistAddress(unblacklistAddress);
    await tx.wait();
    
    alert('Address unblacklisted successfully!');
    setUnblacklistAddress('');
    
  } catch (error) {
    console.error('Unblacklist error:', error);
    alert('Unblacklist failed: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Get loan duration text
  const getLoanDuration = (amount) => {
    const amountNum = parseFloat(amount);
    if (amountNum <= 100) return '3 days';
    if (amountNum <= 500) return '5 days';
    return '7 days';
  };

  // Check if loan is overdue
  const isLoanOverdue = () => {
    return loanInfo.isActive && Date.now() / 1000 > loanInfo.dueDate;
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🏦 Lending DApp</h1>
          <p className="subtitle">Decentralized Token Lending Platform</p>
        </header>

        {!account ? (
          <div className="connect-section">
            <button onClick={connectWallet} className="connect-btn">
              Connect Wallet
            </button>
            <p className="connect-text">Connect your MetaMask wallet to get started</p>
          </div>
        ) : (
          <div className="main-content">
            {/* Account Info */}
            <div className="account-info">
              <div className="account-card">
                <h3>Account Information</h3>
                <p><strong>Address:</strong> {account}</p>
                <p><strong>Balance:</strong> {balance} LTK</p>
                <p><strong>Status:</strong> 
                  {isOwner ? ' Owner' : ''}
                  {isBlacklisted ? ' Blacklisted' : ' Active'}
                </p>
                <button onClick={disconnect} className="disconnect-btn">
                  Disconnect
                </button>
              </div>
            </div>

            {/* Loan Information */}
            {(loanInfo.isActive || isBlacklisted) && (
              <div className="loan-info">
                <div className="loan-card">
                  <h3>Loan Information</h3>
                  {loanInfo.isActive && (
                    <>
                      <p><strong>Loan Amount:</strong> {loanInfo.amount} LTK</p>
                      <p><strong>Due Date:</strong> {formatTimestamp(loanInfo.dueDate)}</p>
                      <p><strong>Status:</strong> 
                        <span className={isLoanOverdue() ? 'overdue' : 'active'}>
                          {isLoanOverdue() ? ' Overdue' : ' Active'}
                        </span>
                      </p>
                      <button onClick={repayLoan} className="repay-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Repay Loan'}
                      </button>
                    </>
                  )}
                  {isBlacklisted && (
                    <p className="blacklist-warning">
                      ⚠️ Your address is blacklisted. Contact admin for assistance.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Sections */}
            <div className="actions-grid">
              {/* Transfer Section */}
              <div className="action-card">
                <h3>Transfer Tokens</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Recipient Address"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="form-input"
                  />
                  <button onClick={transfer} className="action-btn" disabled={loading || isBlacklisted}>
                    {loading ? 'Processing...' : 'Transfer'}
                  </button>
                </div>
              </div>

              {/* Approve Section */}
              <div className="action-card">
                <h3>Approve Tokens</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Spender Address"
                    value={approveSpender}
                    onChange={(e) => setApproveSpender(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(e.target.value)}
                    className="form-input"
                  />
                  <button onClick={approve} className="action-btn" disabled={loading || isBlacklisted}>
                    {loading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>

              {/* TransferFrom Section */}
              <div className="action-card">
                <h3>Transfer From</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="From Address"
                    value={transferFromOwner}
                    onChange={(e) => setTransferFromOwner(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="To Address"
                    value={transferFromTo}
                    onChange={(e) => setTransferFromTo(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferFromAmount}
                    onChange={(e) => setTransferFromAmount(e.target.value)}
                    className="form-input"
                  />
                  <button onClick={transferFrom} className="action-btn" disabled={loading || isBlacklisted}>
                    {loading ? 'Processing...' : 'Transfer From'}
                  </button>
                </div>
              </div>

              {/* Check Allowance Section */}
              <div className="action-card">
                <h3>Check Allowance</h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Owner Address"
                    value={allowanceOwner}
                    onChange={(e) => setAllowanceOwner(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Spender Address"
                    value={allowanceSpender}
                    onChange={(e) => setAllowanceSpender(e.target.value)}
                    className="form-input"
                  />
                  <button onClick={checkAllowance} className="action-btn">
                    Check Allowance
                  </button>
                  {allowanceResult !== '0' && (
                    <p className="allowance-result">Allowance: {allowanceResult} LTK</p>
                  )}
                </div>
              </div>

              {/* Loan Section */}
              <div className="action-card">
                <h3>Take Loan</h3>
                <div className="loan-info-text">
                  <p>• ≤100 tokens: 3 days</p>
                  <p>• ≤500 tokens: 5 days</p>
                  <p>• &gt;500 tokens: 7 days</p>
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    placeholder="Loan Amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="form-input"
                  />
                  {loanAmount && (
                    <p className="loan-duration">
                      Duration: {getLoanDuration(loanAmount)}
                    </p>
                  )}
                  <button 
                    onClick={takeLoan} 
                    className="action-btn" 
                    disabled={loading || isBlacklisted || loanInfo.isActive}
                  >
                    {loading ? 'Processing...' : 
                     loanInfo.isActive ? 'You already have an active loan' : 'Take Loan'}
                  </button>
                </div>
              </div>

              {/* Owner Only Sections */}
              {isOwner && (
                <>
                  <div className="action-card owner-only">
                    <h3>Mint Tokens (Owner Only)</h3>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Recipient Address"
                        value={mintTo}
                        onChange={(e) => setMintTo(e.target.value)}
                        className="form-input"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        className="form-input"
                      />
                      <button onClick={mint} className="action-btn owner-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Mint'}
                      </button>
                    </div>
                  </div>

                  <div className="action-card owner-only">
                    <h3>Burn Tokens (Owner Only)</h3>
                    <div className="form-group">
                      <input
                        type="number"
                        placeholder="Amount to Burn"
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                        className="form-input"
                      />
                      <button onClick={burn} className="action-btn owner-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Burn'}
                      </button>
                    </div>
                  </div>

                  <div className="action-card owner-only">
                    <h3>Blacklist Address (Owner Only)</h3>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Address to Blacklist"
                        value={blacklistAddress}
                        onChange={(e) => setBlacklistAddress(e.target.value)}
                        className="form-input"
                      />
                      <button onClick={blacklistAddr} className="action-btn danger-btn" disabled={loading}>
                        {loading ? 'Processing...' : 'Blacklist'}
                      </button>
                    </div>
                  </div>
                  <div className="action-card owner-only">
                  <h3>Unblacklist Address (Owner Only)</h3>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Address to Unblacklist"
                      value={unblacklistAddress}
                      onChange={(e) => setUnblacklistAddress(e.target.value)}
                      className="form-input"
                    />
                    <button onClick={unblacklistAddr} className="action-btn success-btn" disabled={loading}>
                      {loading ? 'Processing...' : 'Unblacklist'}
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>

            {isOwner && (
  <div className="fraud-detection-wrapper">
    <div className="userlist-section">
      <h3>📄 Connected Users Overview</h3>
      <div className="user-stats">
        <div className="user-stat-card">
          <span className="stat-label">Total Users:</span>
          <span className="stat-value">{userList.length}</span>
        </div>
        <div className="user-stat-card">
          <span className="stat-label">Active Loans:</span>
          <span className="stat-value">{userList.filter(user => user.isActive).length}</span>
        </div>
        <div className="user-stat-card">
          <span className="stat-label">Total Balances:</span>
          <span className="stat-value">
            {userList.reduce((sum, user) => sum + parseFloat(user.balance || 0), 0).toFixed(2)} LTK
          </span>
        </div>
      </div>
      
      <table className="user-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Address</th>
            <th>Balance (LTK)</th>
            <th>Loan Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {userList.length === 0 ? (
            <tr>
              <td colSpan="6" className="no-data-cell">
                <div className="no-data-message">
                  <span className="no-data-icon">📊</span>
                  <p>No user data available</p>
                  <p className="no-data-sub">Users will appear here after transactions</p>
                </div>
              </td>
            </tr>
          ) : (
            userList.map((user, idx) => {
              const riskLevel = getRiskLevelForUser(user);
              return (
                <tr key={idx} className={`user-row ${riskLevel.className}`}>
                  <td className="user-number">{idx + 1}</td>
                  <td className="user-address">
                    <div className="address-container">
                      <span className="address-text">
                        {user.address.substring(0, 10)}...{user.address.substring(user.address.length - 8)}
                      </span>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(user.address)}
                        title="Copy full address"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="user-balance">
                    <span className={`balance-amount ${parseFloat(user.balance) > 1000 ? 'high-balance' : ''}`}>
                      {parseFloat(user.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="loan-status">
                    {user.isActive ? (
                      <div className="loan-info">
                        <span className="loan-amount">{parseFloat(user.loanAmount).toFixed(2)} LTK</span>
                        <span className={`loan-badge ${isLoanOverdueForUser(user) ? 'overdue' : 'active'}`}>
                          {isLoanOverdueForUser(user) ? '⚠️ Overdue' : '✅ Active'}
                        </span>
                      </div>
                    ) : (
                      <span className="no-loan">No active loan</span>
                    )}
                  </td>
                  <td className="due-date">
                    {user.isActive ? (
                      <span className={isLoanOverdueForUser(user) ? 'overdue-date' : 'due-date-normal'}>
                        {formatTimestamp(user.dueDate)}
                      </span>
                    ) : (
                      <span className="no-date">-</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* Enhanced Fraud Detection Component */}
    <FraudDetection 
      contract={contract}
      provider={provider}
      userList={userList}
      onBlacklist={blacklistAddr}
      account={account}
      isOwner={isOwner}
      onUserListUpdate={loadUsersData}
    />
  </div>
)}

            {/* Activity Log */}
            <div className="activity-section">
              <h3>Activity Log</h3>
              <div className="activity-log">
                {activities.length === 0 ? (
                  <p className="no-activities">No activities found</p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-type">{activity.type}</div>
                      <div className="activity-details">
                        {activity.type === 'Transfer' && (
                          <p>
                            From: {activity.from} <br />
                            To: {activity.to} <br />
                            Amount: {activity.amount} LTK
                          </p>
                        )}
                        {activity.type === 'Mint' && (
                          <p>
                            To: {activity.to} <br />
                            Amount: {activity.amount} LTK
                          </p>
                        )}
                        {activity.type === 'Burn' && (
                          <p>
                            From: {activity.from} <br />
                            Amount: {activity.amount} LTK
                          </p>
                        )}
                        {activity.type === 'Loan Taken' && (
                          <p>
                            Borrower: {activity.borrower} <br />
                            Amount: {activity.amount} LTK <br />
                            Due: {formatTimestamp(activity.dueDate)}
                          </p>
                        )}
                        {activity.type === 'Loan Repaid' && (
                          <p>
                            Borrower: {activity.borrower} <br />
                            Amount: {activity.amount} LTK
                          </p>
                        )}
                      </div>
                      <div className="activity-time">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                      <div className="activity-hash">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${activity.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Etherscan
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;