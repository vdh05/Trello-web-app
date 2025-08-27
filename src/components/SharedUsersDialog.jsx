import { useState, useEffect } from 'react';

function SharedUsersDialog({ isOpen, onClose, boardId, boardTitle, token }) {
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && boardId) {
      fetchSharedUsers();
    }
  }, [isOpen, boardId]);

  const fetchSharedUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/boards/${boardId}/shared-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSharedUsers(data);
      } else {
        setError(data.error || 'Failed to fetch shared users');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (username) => {
    if (!window.confirm(`Are you sure you want to remove access for @${username}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:4000/api/boards/${boardId}/share/${username}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message);
        // Refresh the shared users list
        fetchSharedUsers();
      } else {
        setError(data.error || 'Failed to remove user');
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
          Shared Users
        </h2>

        <p style={{
          color: '#666',
          marginBottom: '24px',
          fontSize: '0.95rem'
        }}>
          Users with access to "{boardTitle}"
        </p>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#026aa7'
          }}>
            Loading...
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

        {sharedUsers.length === 0 && !loading ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            No users have been shared with this board yet.
          </div>
        ) : (
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '20px'
          }}>
            {sharedUsers.map((user) => (
              <div
                key={user._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  background: '#f8f9fa'
                }}
              >
                <span style={{ fontWeight: 'bold', color: '#026aa7' }}>
                  @{user.username}
                </span>
                <button
                  onClick={() => handleRemoveUser(user.username)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SharedUsersDialog;
