import { useState, useEffect } from 'react';

function BoardEditDialog({ isOpen, onClose, board, onUpdate, onDelete, token }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && board) {
      setTitle(board.title || '');
      setError('');
      setSuccess('');
    }
  }, [isOpen, board]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:4000/api/boards/${board._id}/rename`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: title.trim() })
      });
      
      const data = await res.json();
      
      if (data._id) {
        setSuccess('Workspace name updated successfully!');
        onUpdate(data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update workspace name');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the workspace "${board.title}"? This action cannot be undone and will delete all cards in this workspace.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:4000/api/boards/${board._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Workspace deleted successfully!');
        onDelete(board._id);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to delete workspace');
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
          Edit Workspace
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Workspace Name: *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none'
            }}
            placeholder="Enter workspace name..."
          />
        </div>

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
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#ccc' : '#dc3545',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing...' : '🗑️ Delete Workspace'}
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
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
              onClick={handleUpdate}
              disabled={loading || !title.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: title.trim() && !loading ? '#026aa7' : '#ccc',
                color: 'white',
                cursor: title.trim() && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardEditDialog;
