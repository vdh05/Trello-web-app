import { useState, useEffect } from 'react';

export default function Login({ onLogin, loading, goToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    setCardVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    await onLogin(username, password);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(120deg, #026aa7 0%, #00c6fb 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated circles */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        left: '-80px',
        width: '200px',
        height: '200px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        animation: 'float1 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        right: '-60px',
        width: '140px',
        height: '140px',
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '50%',
        animation: 'float2 7s ease-in-out infinite'
      }} />
      <style>
        {`
          @keyframes float1 {
            0%,100% { transform: translateY(0);}
            50% { transform: translateY(30px);}
          }
          @keyframes float2 {
            0%,100% { transform: translateY(0);}
            50% { transform: translateY(-20px);}
          }
          .login-card-animate {
            opacity: 0;
            transform: scale(0.95);
            animation: scaleIn 0.7s cubic-bezier(.68,-0.55,.27,1.55) forwards;
          }
          @keyframes scaleIn {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .login-btn:hover {
            background: #0093e9;
            box-shadow: 0 2px 8px rgba(2,106,167,0.15);
            transform: translateY(-2px) scale(1.03);
          }
        `}
      </style>
      <div style={{
        width: '35%',
        background: 'transparent',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '40px 30px',
        zIndex: 2
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '2.5rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>Trello Clone</h1>
        <div style={{
          marginTop: '32px',
          fontSize: '1.2rem',
          fontWeight: '500',
          lineHeight: '1.5',
          maxWidth: '320px',
          opacity: 0.92
        }}>
          Welcome back! <br />
          <span style={{fontSize:'1rem',fontStyle:'italic',color:'#e0f7fa'}}>
            "Organize your work, unleash your creativity."
          </span>
        </div>
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
      }}>
        <div className={cardVisible ? "login-card-animate" : ""}
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(2,106,167,0.12)',
            padding: '48px 36px',
            minWidth: '320px',
            maxWidth: '370px',
            width: '100%',
            transition: 'box-shadow 0.2s',
            opacity: cardVisible ? 1 : 0
          }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '24px',
            color: '#026aa7',
            fontWeight: '700',
            letterSpacing: '1px'
          }}>Login</h2>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'18px'}}>
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #b3e0fc',
                fontSize: '1rem',
                outline: 'none',
                color: '#000000',
                transition: 'border 0.2s',
                boxShadow: '0 1px 4px rgba(2,106,167,0.04)'
              }}
            />
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #b3e0fc',
                  fontSize: '1rem',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#000000',
                  transition: 'border 0.2s',
                  boxShadow: '0 1px 4px rgba(2,106,167,0.04)'
                }}
              />
              <span
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#026aa7',
                  fontSize: '1.3rem',
                  userSelect: 'none'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#026aa7',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.08rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s'
              }}
            >{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          <button
            type="button"
            onClick={goToSignup}
            style={{
              marginTop: '18px',
              background: 'none',
              border: 'none',
              color: '#026aa7',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >Don't have an account? Signup</button>
          {error && <div style={{color:'red',marginTop:'14px',textAlign:'center'}}>{error}</div>}
        </div>
      </div>
      {/* Decorative SVG wave at bottom */}
      <svg style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '120px',
        zIndex: 1
      }} viewBox="0 0 1440 320">
        <path fill="#fff" fillOpacity="0.3" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,117.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
  );
}
