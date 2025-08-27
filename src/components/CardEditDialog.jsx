import { useState, useEffect } from 'react';

function CardEditDialog({ isOpen, onClose, card, onUpdate, token }) {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && card) {
      setText(card.text || '');
      setDescription(card.description || '');
      setAssignedTo(card.assignedTo || '');
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
      setRecurrence(card.recurrence || 'none');
      setRecurrenceEndDate(card.recurrenceEndDate ? new Date(card.recurrenceEndDate).toISOString().split('T')[0] : '');
      setError('');
    }
  }, [isOpen, card]);

  const handleUpdate = async () => {
    if (!text.trim()) {
      setError('Card title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:4000/api/cards/${card._id}/update`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text.trim(),
          description: description.trim(),
          assignedTo: assignedTo.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          recurrence,
          recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null
        })
      });
      
      const data = await res.json();
      
      if (data._id) {
        onUpdate(data);
        onClose();
      } else {
        setError(data.error || 'Failed to update card');
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
          Edit Card
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Card Title: *
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none',
              color: '#000000'
            }}
            placeholder="Enter card title..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Description:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px',
              color: '#000000'
            }}
            placeholder="Enter card description..."
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Assigned To:
          </label>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none',
              color: '#000000'
            }}
            placeholder="Enter username (e.g., @username)"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#026aa7',
            fontWeight: 'bold'
          }}>
            Due Date:
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #b3e0fc',
              fontSize: '1rem',
              outline: 'none',
              color: '#000000'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#026aa7',
              fontWeight: 'bold'
            }}>
              Recurrence:
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #b3e0fc',
                fontSize: '1rem',
                outline: 'none',
                background: 'white'
              }}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#026aa7',
              fontWeight: 'bold'
            }}>
              Repeat Until:
            </label>
            <input
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #b3e0fc',
                fontSize: '1rem',
                outline: 'none',
                color: '#000000'
              }}
              disabled={recurrence === 'none'}
            />
          </div>
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
            onClick={handleUpdate}
            disabled={loading || !text.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: text.trim() && !loading ? '#026aa7' : '#ccc',
              color: 'white',
              cursor: text.trim() && !loading ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardEditDialog;
