import { useState, useEffect } from 'react';

function ShareDialog({ isOpen, onClose, onShare, boardTitle, token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleUserSelect = (username) => {
    setSelectedUser(username);
    setSearchQuery(username);
    setSearchResults([]);
  };

  const handleShare = async () => {
    if (!selectedUser) {
      setError('Please select a user to share with');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:4000/api/boards/${onShare}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: selectedUser })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to share board');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>

        <h2 style={{
          color: '#026aa7',
          marginBottom: '24px',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          Share Dashboard
        </h2>

        <p style={{
          color: '#666',
          marginBottom: '24px',
          fontSize: '0.95rem'
        }}>
          Share "{boardTitle}" with another user
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Search for a user:
          </label>
          <input
            type="text"
            placeholder="Enter username..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        {searchResults.length > 0 && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserSelect(user.username)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontWeight: 'bold', color: '#026aa7' }}>
                  @{user.username}
                </span>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <div style={{
            background: '#e3f2fd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #b3e0fc'
          }}>
            <span style={{ color: '#026aa7', fontWeight: 'bold' }}>
              Selected: @{selectedUser}
            </span>
          </div>
        )}

        {error && (
          <div style={{
            color: '#d32f2f',
            background: '#ffebee',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: '#2e7d32',
            background: '#e8f5e8',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c8e6c9'
          }}>
            {success}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              background: 'white',
              color: '#666',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedUser || loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: selectedUser && !loading ? '#026aa7' : '#ccc',
              color: 'white',
              cursor: selectedUser && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
