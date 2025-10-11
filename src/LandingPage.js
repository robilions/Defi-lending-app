import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Landing Page Component
const LandingPage = ({ onConnect }) => {
  useEffect(() => {
    // Typewriter effect
    const typewriterEffect = () => {
      const text = "LendingApp";
      const element = document.getElementById('typewriter');
      if (!element) return;
      
      let index = 0;
      let isDeleting = false;

      function type() {
        if (!element) return;
        
        if (!isDeleting) {
          element.textContent = text.substring(0, index + 1);
          index++;
          if (index === text.length) {
            setTimeout(() => {
              isDeleting = true;
            }, 2000);
          }
        } else {
          element.textContent = text.substring(0, index - 1);
          index--;
          if (index === 0) {
            isDeleting = false;
          }
        }

        const speed = isDeleting ? 100 : 150;
        setTimeout(type, speed);
      }
      
      type();
    };

    typewriterEffect();

    // Animate stats
    const animateStats = () => {
      const stats = document.querySelectorAll('.stat-number');
      stats.forEach(stat => {
        const finalValue = stat.textContent;
        const isNumber = !isNaN(parseFloat(finalValue.replace(/[^0-9.]/g, '')));
        
        if (isNumber) {
          const numValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
          const suffix = finalValue.replace(/[0-9.]/g, '');
          let current = 0;
          const increment = numValue / 50;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= numValue) {
              current = numValue;
              clearInterval(timer);
            }
            stat.textContent = current.toFixed(1) + suffix;
          }, 30);
        }
      });
    };

    setTimeout(animateStats, 1000);
  }, []);

  const addSepoliaNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed! Please install MetaMask first.');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'SEP',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v3/'],
          blockExplorerUrls: ['https://sepolia.etherscan.io/']
        }]
      });
      alert('Sepolia network added successfully!');
    } catch (error) {
      console.error('Error adding Sepolia network:', error);
      if (error.code === 4902) {
        alert('Please add Sepolia network manually in MetaMask settings.');
      }
    }
  };

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="bg-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      {/* Main Content */}
      <main className="landing-main">
        <div className="hero">
          <h1 className="hero-title">
            Welcome to <span className="typewriter" id="typewriter">LendingApp</span>
          </h1>
          <p className="hero-subtitle">
            The next generation DeFi lending platform. Lend, borrow, and earn with complete transparency and security on the blockchain.
          </p>

          {/* Wallet Connection */}
          <div className="wallet-section">
            <button className="connect-wallet-btn" onClick={onConnect}>
              Connect Wallet
            </button>
            <div className="wallet-status">
              No wallet connected
            </div>
          </div>

          {/* Features */}
          <div className="features">
            <div className="feature-card">
              <span className="feature-icon">💰</span>
              <h3 className="feature-title">High Yield Lending</h3>
              <p className="feature-description">
                Earn competitive interest rates by lending your crypto assets to verified borrowers in our secure protocol.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3 className="feature-title">Secure & Trustless</h3>
              <p className="feature-description">
                Built on battle-tested smart contracts with multi-signature security and automated liquidation protection.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3 className="feature-title">Instant Transactions</h3>
              <p className="feature-description">
                Experience lightning-fast lending and borrowing with minimal gas fees and instant settlement.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MetaMask Guide */}
      <section className="metamask-guide">
        <h2 className="metamask-title">
          🦊 Don't have MetaMask? Need Sepolia Network?
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px' }}>
          MetaMask and Sepolia testnet are required to interact with our DeFi platform. Follow these simple steps:
        </p>
        
        <div className="metamask-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4 style={{ color: '#ffa500', marginBottom: '10px' }}>Download MetaMask</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Install MetaMask browser extension from the official website
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4 style={{ color: '#ffa500', marginBottom: '10px' }}>Setup Wallet</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Create a new wallet or import existing one with your seed phrase
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4 style={{ color: '#ffa500', marginBottom: '10px' }}>Switch to Sepolia</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Add Sepolia testnet to MetaMask for testing our DApp
            </p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4 style={{ color: '#ffa500', marginBottom: '10px' }}>Get Test ETH</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Use Sepolia faucet to get free test ETH for transactions
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '30px' }}>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-metamask"
          >
            Download MetaMask
          </a>
          <button onClick={addSepoliaNetwork} className="download-metamask sepolia-btn">
            Add Sepolia Network
          </button>
          <a 
            href="https://sepoliafaucet.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-metamask faucet-btn"
          >
            Get Test ETH
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stat">
          <span className="stat-number">$2.5M</span>
          <span className="stat-label">Total Value Locked</span>
        </div>
        <div className="stat">
          <span className="stat-number">1,234</span>
          <span className="stat-label">Active Users</span>
        </div>
        <div className="stat">
          <span className="stat-number">12.5%</span>
          <span className="stat-label">Average APY</span>
        </div>
        <div className="stat">
          <span className="stat-number">567</span>
          <span className="stat-label">Active Loans</span>
        </div>
      </section>

      {/* Copyright Section */}
      <footer className="copyright">
        <p className="copyright-text">© 2025 All Rights Reserved</p>
        <p className="copyright-name">Rofif Nabil</p>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          color: #ffffff;
          position: relative;
          overflow-x: hidden;
        }

        .bg-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .particle {
          position: absolute;
          background: rgba(0, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .particle:nth-child(1) { width: 4px; height: 4px; left: 10%; animation-delay: -0.5s; }
        .particle:nth-child(2) { width: 6px; height: 6px; left: 20%; animation-delay: -1s; }
        .particle:nth-child(3) { width: 3px; height: 3px; left: 30%; animation-delay: -1.5s; }
        .particle:nth-child(4) { width: 5px; height: 5px; left: 40%; animation-delay: -2s; }
        .particle:nth-child(5) { width: 4px; height: 4px; left: 60%; animation-delay: -2.5s; }
        .particle:nth-child(6) { width: 6px; height: 6px; left: 70%; animation-delay: -3s; }
        .particle:nth-child(7) { width: 3px; height: 3px; left: 80%; animation-delay: -3.5s; }
        .particle:nth-child(8) { width: 5px; height: 5px; left: 90%; animation-delay: -4s; }

        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }

        .landing-main {
          padding-top: 80px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hero {
          max-width: 1200px;
          padding: 0 50px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 900;
          background: linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #ffff00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          animation: glow 2s ease-in-out infinite alternate;
        }

        .typewriter {
          display: inline-block;
          border-right: 3px solid #00ffff;
          padding-right: 5px;
          animation: blink 0.7s step-end infinite;
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }

        @keyframes glow {
          from { filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.3)); }
          to { filter: drop-shadow(0 0 30px rgba(255, 0, 255, 0.4)); }
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .wallet-section {
          margin: 60px 0;
        }

        .connect-wallet-btn {
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          border: none;
          padding: 20px 50px;
          font-size: 1.3rem;
          font-weight: 700;
          color: #000;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
        }

        .connect-wallet-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .connect-wallet-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 255, 255, 0.5);
        }

        .connect-wallet-btn:hover::before {
          left: 100%;
        }

        .wallet-status {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin-top: 15px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin: 80px 0;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 35px 25px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00ffff, #ff00ff, #ffff00);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .feature-card:hover::before {
          transform: translateX(0);
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: rgba(0, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
        }

        .feature-title {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: #00ffff;
        }

        .feature-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          font-size: 1rem;
        }

        .metamask-guide {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid rgba(255, 165, 0, 0.3);
          border-radius: 20px;
          padding: 40px;
          margin: 60px 50px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .metamask-title {
          color: #ffa500;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .metamask-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
          margin: 35px 0;
        }

        .step {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 15px;
          padding: 25px;
          border-left: 3px solid #ffa500;
          text-align: left;
          transition: all 0.3s ease;
        }

        .step:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-5px);
        }

        .step-number {
          background: #ffa500;
          color: #000;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
          margin-bottom: 15px;
        }

        .download-metamask {
          background: linear-gradient(135deg, #ffa500, #ff6b35);
          border: none;
          padding: 16px 32px;
          color: white;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          font-size: 1rem;
        }

        .download-metamask:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(255, 165, 0, 0.4);
        }

        .sepolia-btn {
          background: linear-gradient(135deg, #627eea, #4f46e5);
        }

        .sepolia-btn:hover {
          box-shadow: 0 10px 30px rgba(98, 126, 234, 0.4);
        }

        .faucet-btn {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .faucet-btn:hover {
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 60px 50px;
          padding-bottom: 40px;
          text-align: center;
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat {
          padding: 20px 15px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .stat:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 255, 255, 0.3);
        }

        .stat-number {
          font-size: 2.2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          margin-bottom: 8px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          line-height: 1.3;
        }

        .copyright {
          text-align: center;
          padding: 30px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 1;
        }

        .copyright-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .copyright-name {
          color: #00ffff;
          font-weight: 700;
          font-size: 1.1rem;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 0 25px;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .connect-wallet-btn {
            padding: 16px 35px;
            font-size: 1.1rem;
          }

          .features {
            grid-template-columns: 1fr;
            gap: 20px;
            margin: 50px 0;
          }

          .metamask-guide {
            margin: 40px 25px;
            padding: 30px 20px;
          }

          .metamask-steps {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
            margin: 40px 20px;
            gap: 15px;
            padding-bottom: 40px;
          }

          .stat {
            padding: 18px 12px;
          }

          .stat-number {
            font-size: 1.8rem;
          }

          .stat-label {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 1.8rem;
          }

          .stats {
            gap: 12px;
            margin: 30px 15px;
          }

          .stat {
            padding: 15px 10px;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .stat-label {
            font-size: 0.7rem;
          }

          .copyright-text {
            font-size: 0.8rem;
          }

          .copyright-name {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
