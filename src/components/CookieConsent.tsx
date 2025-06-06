import React from 'react';
import CookieConsent from 'react-cookie-consent';
import { initGA, trackEvent } from '../utils/analytics';

interface CookieConsentWrapperProps {
  children: React.ReactNode;
}

export const CookieConsentWrapper: React.FC<CookieConsentWrapperProps> = ({ children }) => {
  const handleAcceptCookies = () => {
    // Initialize Google Analytics when user accepts
    initGA();
    trackEvent('privacy_consent_accepted', {
      consent_method: 'banner_accept',
      timestamp: new Date().toISOString()
    });
  };

  const handleDeclineCookies = () => {
    // Track decline (this will be the last GA event if they previously had cookies)
    trackEvent('privacy_consent_declined', {
      consent_method: 'banner_decline',
      timestamp: new Date().toISOString()
    });
    
    // Remove any existing GA cookies
    document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = '_ga_' + 'G-XXXXXXXXXX' + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  return (
    <>
      {children}
      <CookieConsent
        location="bottom"
        buttonText="✓ Akceptuję wszystkie"
        declineButtonText="✗ Tylko niezbędne"
        enableDeclineButton
        flipButtons={false}
        cookieName="mortgage_calculator_consent"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: '"Share Tech Mono", monospace',
          border: '2px solid #00ffff',
          borderBottom: 'none',
          boxShadow: '0 -5px 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)',
          padding: '20px',
          zIndex: 9999
        }}
        buttonStyle={{
          background: '#0a0a0a',
          border: '2px solid #00ff00',
          color: '#00ff00',
          fontSize: '14px',
          fontFamily: '"Share Tech Mono", monospace',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          padding: '12px 20px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minWidth: '140px'
        }}
        declineButtonStyle={{
          background: '#0a0a0a',
          border: '2px solid #ff4500',
          color: '#ff4500',
          fontSize: '14px',
          fontFamily: '"Share Tech Mono", monospace',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          padding: '12px 20px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minWidth: '140px',
          marginRight: '10px'
        }}
        contentStyle={{
          flex: '1 1 300px',
          margin: '0 20px 0 0'
        }}
        buttonWrapperClasses="cookie-buttons-wrapper"
        onAccept={handleAcceptCookies}
        onDecline={handleDeclineCookies}
        expires={365}
        overlay={false}
        disableStyles={false}
        hideOnAccept={true}
        hideOnDecline={true}
        acceptOnScroll={false}
        acceptOnScrollPercentage={50}
        debug={false}
      >
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#00ffff', textShadow: '0 0 5px #00ffff' }}>
            🍪 Używamy plików cookie i Google Analytics
          </strong>
        </div>
        
        <div style={{ marginBottom: '10px', lineHeight: '1.5' }}>
          Ta strona używa Google Analytics do zbierania <strong style={{ color: '#ffff00' }}>anonimowych</strong> danych 
          o użytkowaniu (zakresy kwot, oprocentowania) w celu poprawy kalkulatora. 
          <strong style={{ color: '#ffff00' }}> Nigdy nie zapisujemy Twoich konkretnych danych finansowych.</strong>
        </div>
        
        <div style={{ fontSize: '12px', opacity: 0.8, fontStyle: 'italic' }}>
          Kliknij "Tylko niezbędne" aby używać kalkulatora bez Analytics. 
          Więcej w{' '}
          <a 
            href="#privacy-policy" 
            style={{ color: '#00ffff', textDecoration: 'underline' }}
            onClick={(e) => {
              e.preventDefault();
              // You can implement a privacy policy modal here if needed
              alert('Polityka prywatności: Zbieramy tylko anonimowe, zagregowane dane o użytkowaniu kalkulatora (zakresy kwot, oprocentowania) via Google Analytics. Nie przechowujemy żadnych konkretnych danych finansowych ani osobowych.');
            }}
          >
            polityce prywatności
          </a>
        </div>
      </CookieConsent>
      
      <style>{`
        .cookie-buttons-wrapper {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          margin-top: 15px;
        }
        
        @media (max-width: 768px) {
          .cookie-buttons-wrapper {
            flex-direction: column;
            gap: 8px;
          }
          
          .cookie-buttons-wrapper button {
            width: 100%;
            max-width: 250px;
          }
        }
        
        /* Hover effects */
        .cookie-buttons-wrapper button:hover {
          box-shadow: 0 0 15px currentColor !important;
          text-shadow: 0 0 10px currentColor !important;
          transform: translateY(-2px) !important;
        }
        
        .cookie-buttons-wrapper button:active {
          transform: translateY(0) !important;
        }
      `}</style>
    </>
  );
};