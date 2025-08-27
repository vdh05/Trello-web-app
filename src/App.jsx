import { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import { BoardContext } from './context/BoardContext';
import Login from './components/Login';
import ShareDialog from './components/ShareDialog';
import CardEditDialog from './components/CardEditDialog';
import BoardEditDialog from './components/BoardEditDialog';
import SharedUsersDialog from './components/SharedUsersDialog';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
function CalendarView({ token, onLogout, currentUsername, onGoBoards, onGoUserDashboard, onGoCalendar, view }) {
  const [boards, setBoards] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11

  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch('http://localhost:4000/api/boards', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBoards(data);
      // fetch cards for all boards
      try {
        const results = await Promise.all(
          data.map(b => fetch(`http://localhost:4000/api/boards/${b._id}/cards`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []))
        );
        const merged = results.flat();
        setCards(merged);
      } catch {
        setCards([]);
      }
    };
    fetchAll();
  }, [token]);

  const cardsByDate = cards.filter(c => c.dueDate).reduce((acc, c) => {
    const key = new Date(c.dueDate).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  // Build single-month grid (6 weeks)
  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthCells = [];
  for (let i = 0; i < startDay; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(new Date(currentYear, currentMonth, d));
  while (monthCells.length < 42) monthCells.push(null);

  const goPrevMonth = () => {
    const m = currentMonth - 1;
    if (m < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(m);
    }
  };

  const goNextMonth = () => {
    const m = currentMonth + 1;
    if (m > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(m);
    }
  };

  return (
    <div style={{background:'#f4f6fa',minHeight:'100vh'}}>
      <Header onLogout={onLogout} onGoBoards={onGoBoards} onGoUserDashboard={onGoUserDashboard} onGoCalendar={onGoCalendar} view={view} />
      <div style={{display:'flex',height:'calc(100vh - 64px)'}}>
        {/* Sidebar overview */}
        <div style={{
          width:'320px', background:'#026aa7', color:'#fff', padding:'24px 10px', boxShadow:'2px 0 8px rgba(2,106,167,0.08)'
        }}>
          <h2 style={{marginBottom:16, textAlign:'center'}}>All Workspaces</h2>
          <div style={{display:'grid', gap:8}}>
            {boards.map(b => (
              <div key={b._id} style={{
                width:'100%', padding:'10px 12px', background:'#fff', color:'#026aa7', border:'none', borderRadius:8, fontWeight:'bold', display:'flex', justifyContent:'space-between'
              }}>
                <span>{b.title}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Single month calendar with navigation */}
        <div style={{flex:1, padding:24, overflowY:'auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <h3 style={{color:'#026aa7'}}>Calendar • {new Date(currentYear, currentMonth, 1).toLocaleDateString(undefined, { month:'long', year:'numeric' })}</h3>
            <div style={{display:'flex', gap:8}}>
              <button onClick={goPrevMonth} style={{padding:'6px 10px', background:'#e3f2fd', color:'#026aa7', border:'1px solid #b3e0fc', borderRadius:6, cursor:'pointer'}}>&lt; Prev</button>
              <button onClick={goNextMonth} style={{padding:'6px 10px', background:'#e3f2fd', color:'#026aa7', border:'1px solid #b3e0fc', borderRadius:6, cursor:'pointer'}}>Next &gt;</button>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{textAlign:'center', color:'#6b7280', fontWeight:'bold'}}>{d}</div>
            ))}
            {monthCells.map((date, i) => {
              const key = date ? date.toDateString() : `empty-${currentMonth}-${i}`;
              const dayCards = date ? (cardsByDate[date.toDateString()] || []) : [];
              const isToday = date && (date.toDateString() === new Date().toDateString());
              return (
                <div key={key} style={{ 
                  background: isToday ? '#f0f9ff' : '#fff', 
                  borderRadius:8, 
                  minHeight:100, 
                  padding:8, 
                  border: isToday ? '2px solid #0093e9' : '1px solid #e6f3ff'
                }}>
                  <div style={{ fontWeight:'bold', color: isToday ? '#0093e9' : '#026aa7', opacity: date ? 1 : 0 }}>
                    {date ? date.getDate() : ''}
                  </div>
                  {date && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
                      {dayCards.slice(0,4).map(c => (
                        <div key={c._id} title={c.text} style={{
                          fontSize:12, padding:'4px 6px', borderRadius:6, background: c.listId==='done' ? '#e8f5e9' : '#e3f2fd', color: c.listId==='done' ? '#2e7d32' : '#026aa7', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                        }}>{c.text}</div>
                      ))}
                      {dayCards.length > 4 && (
                        <div style={{fontSize:12, color:'#6b7280'}}>+{dayCards.length - 4} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
function UserDashboard({ token, onLogout, currentUsername, onGoBoards, onGoUserDashboard, view }) {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [cardsByList, setCardsByList] = useState({});
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const fetchBoards = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        selectBoard(data[0]);
      }
    } catch { setError('Failed to fetch boards'); }
  };

  const selectBoard = async (board) => {
    setSelectedBoard(board);
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/boards/${board._id}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const cardsByListObj = { todo: [], doing: [], done: [] };
      data.forEach((card) => {
        if (cardsByListObj[card.listId]) {
          cardsByListObj[card.listId].push(card);
        }
      });
      setCardsByList(cardsByListObj);
    } catch { setError('Failed to fetch cards'); }
  };

  const createBoard = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title })
      });
      const board = await res.json();
      setBoards([...boards, board]);
      setTitle('');
    } catch { setError('Failed to create board'); }
  };

  useEffect(() => { fetchBoards(); /* eslint-disable-next-line */ }, [token]);

  // Build metrics for selected board
  const allCards = Object.values(cardsByList).flat();
  const assignedToYou = allCards.filter(c => c.assignedTo === `@${currentUsername}` && c.listId !== 'done').length;
  const completedByYou = allCards.filter(c => c.completedBy === currentUsername).length;
  const youAssigned = allCards.filter(c => c.assignedBy === `@${currentUsername}`).length;

  // Simple 7-day completion series
  const now = new Date();
  const days = [...Array(7)].map((_,i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)));
  const series = days.map(d => {
    const dayStr = d.toDateString();
    return allCards.filter(c => c.completedAt && new Date(c.completedAt).toDateString() === dayStr).length;
  });
  const maxY = Math.max(1, ...series);

  return (
    <div style={{background:'#f4f6fa',minHeight:'100vh'}}>
      <Header onLogout={onLogout} onGoBoards={onGoBoards} onGoUserDashboard={onGoUserDashboard} view={view} />
      <div style={{display:'flex',height:'calc(100vh - 64px)'}}>
        {/* Sidebar (same as Boards) */}
        <div style={{
          width:'320px',
          background:'#026aa7',
          color:'white',
          padding:'24px 0 0 0',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          boxShadow:'2px 0 8px rgba(2,106,167,0.08)'
        }}>
          <h2 style={{marginBottom:'16px'}}>Workspaces</h2>
          <div style={{width:'100%', padding:'0 10px'}}>
            {boards.map(b => (
              <button key={b._id} onClick={() => selectBoard(b)} style={{
                width:'90%',
                margin:'8px 0',
                padding:'12px 16px',
                background:selectedBoard && selectedBoard._id===b._id?'#0093e9':!b.isOwner?'#f0f8ff':'#fff',
                color:selectedBoard && selectedBoard._id===b._id?'#fff':'#026aa7',
                border:!b.isOwner?'1px solid #b3e0fc':'none',
                borderRadius:8,
                fontWeight:'bold',
                cursor:'pointer',
                textAlign:'left',
                position:'relative'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{b.title}</span>
                  {!b.isOwner && (
                    <span style={{fontSize:'0.8rem',opacity:0.7}}>Shared</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div style={{marginTop:'16px',width:'90%'}}>
            <input placeholder="New workspace" value={title} onChange={e => setTitle(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
            <button onClick={createBoard} style={{marginTop:8,padding:'8px 16px',background:'#0093e9',color:'white',border:'none',borderRadius:6,width:'100%'}}>Create Workspace</button>
          </div>
        </div>

        {/* Main content: numbers (left) and graph (right) */}
        <div style={{flex:1,padding:'24px',overflowX:'auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'340px 1fr', gap:24}}>
            <div style={{background:'#026aa7', color:'#fff', borderRadius:12, padding:16}}>
              <div style={{fontWeight:'bold', marginBottom:12}}>Your Numbers</div>
              <div style={{display:'grid', gap:10}}>
                <div style={{background:'rgba(0,0,0,0.15)', borderRadius:8, padding:12}}>
                  <div style={{fontSize:12, opacity:0.85}}>Assigned to you</div>
                  <div style={{fontSize:26, fontWeight:'bold'}}>{assignedToYou}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.15)', borderRadius:8, padding:12}}>
                  <div style={{fontSize:12, opacity:0.85}}>Completed by you</div>
                  <div style={{fontSize:26, fontWeight:'bold'}}>{completedByYou}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.15)', borderRadius:8, padding:12}}>
                  <div style={{fontSize:12, opacity:0.85}}>You assigned</div>
                  <div style={{fontSize:26, fontWeight:'bold'}}>{youAssigned}</div>
                </div>
              </div>
            </div>
            <div style={{background:'#fff', borderRadius:12, padding:16, boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:'bold', color:'#026aa7', marginBottom:8}}>Completions (last 7 days)</div>
              <svg width="100%" height="220" viewBox="0 0 700 220" preserveAspectRatio="none" style={{background:'#f8fbff', borderRadius:8, border:'1px solid #e6f3ff'}}>
                <line x1="40" y1="180" x2="680" y2="180" stroke="#cfe8ff" />
                <line x1="40" y1="20" x2="40" y2="180" stroke="#cfe8ff" />
                {(() => {
                  const stepX = (680 - 40) / 6;
                  const points = series.map((v,i) => {
                    const x = 40 + i * stepX;
                    const y = 180 - (v / maxY) * 140;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <g>
                      <polyline points={points} fill="none" stroke="#0093e9" strokeWidth="3" />
                      {series.map((v,i) => {
                        const x = 40 + i * stepX;
                        const y = 180 - (v / maxY) * 140;
                        return <circle key={i} cx={x} cy={y} r="4" fill="#026aa7" />
                      })}
                    </g>
                  );
                })()}
                {days.map((d,i) => {
                  const stepX = (680 - 40) / 6;
                  const x = 40 + i * stepX;
                  const label = d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
                  return <text key={i} x={x} y={200} fontSize="10" textAnchor="middle" fill="#6b7280">{label}</text>
                })}
                {[0, Math.ceil(maxY/2), maxY].map((yVal, idx) => (
                  <text key={idx} x={20} y={180 - (yVal / maxY) * 140} fontSize="10" textAnchor="end" fill="#6b7280">{yVal}</text>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Signup({ onSignup, loading, goToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const res = await fetch('http://localhost:4000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });
      const data = await res.json();
      if (data.otpSent) {
        setShowOtp(true);
        setInfo('OTP sent to your email. Please enter it below.');
      } else if (data.success) {
        onSignup();
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      const res = await fetch('http://localhost:4000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp })
      });
      const data = await res.json();
      if (data.success) {
        setInfo('Email verified! You can now login.');
        setTimeout(onSignup, 1200);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="signup-container" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <form onSubmit={showOtp ? handleVerifyOtp : handleSignup} style={{background:'white',padding:32,borderRadius:12,boxShadow:'0 4px 24px rgba(0,0,0,0.08)',minWidth:320}}>
        <h2 style={{textAlign:'center',color:'#026aa7'}}>Signup</h2>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{margin:'12px 0',padding:10,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{margin:'12px 0',padding:10,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{margin:'12px 0',padding:10,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
        {showOtp && (
          <input placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} style={{margin:'12px 0',padding:10,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
        )}
        <button type="submit" style={{padding:10,borderRadius:6,border:'none',background:'#026aa7',color:'white',width:'100%',fontWeight:'bold'}}>
          {showOtp ? 'Verify OTP' : 'Signup'}
        </button>
        {error && <div style={{color:'red',marginTop:12,textAlign:'center'}}>{error}</div>}
        {info && <div style={{color:'#026aa7',marginTop:12,textAlign:'center'}}>{info}</div>}
      </form>
      {/* Link to Login */}
      <div style={{ position:'fixed', bottom:24, width:'100%', display:'flex', justifyContent:'center' }}>
        <div style={{ background:'rgba(255,255,255,0.9)', padding:'8px 12px', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <span style={{ marginRight:8, color:'#374151' }}>Already have an account?</span>
          <button type="button" onClick={goToLogin} style={{ background:'transparent', border:'none', color:'#026aa7', fontWeight:'bold', cursor:'pointer' }}>Log in</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout, currentUsername, onGoBoards, onGoUserDashboard, onGoCalendar, view }) {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [cardText, setCardText] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [error, setError] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [cardDescription, setCardDescription] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCardEditDialog, setShowCardEditDialog] = useState(false);
  const [showSharedUsersDialog, setShowSharedUsersDialog] = useState(false);
  const [showBoardEditDialog, setShowBoardEditDialog] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardCoord, setSelectedCardCoord] = useState(null); // { listId, index, cardId }
  const listInputRefs = useRef({});
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cardRefs = useRef({});

  // Fetch boards
  useEffect(() => {
    fetchBoards();
    // eslint-disable-next-line
  }, [token]);

  // Refresh board data periodically to keep in sync
  useEffect(() => {
    if (selectedBoard) {
      const interval = setInterval(() => {
        selectBoard(selectedBoard);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedBoard, token]);

  const fetchBoards = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        selectBoard(data[0]);
      }
    } catch {
      setError('Failed to fetch boards');
    }
  };

  // Simulate lists for demo (since backend only supports cards per board)
  const defaultLists = [
    { id: 'todo', title: 'To Do' },
    { id: 'doing', title: 'Doing' },
    { id: 'done', title: 'Done' }
  ];

  const selectBoard = async (board) => {
    setSelectedBoard(board);
    setLists(defaultLists);
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/boards/${board._id}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Distribute cards based on their actual listId
      const cardsByListObj = { todo: [], doing: [], done: [] };
      data.forEach((card) => {
        if (cardsByListObj[card.listId]) {
          cardsByListObj[card.listId].push(card);
        }
      });
      setCardsByList(cardsByListObj);
      setSelectedListId('todo');
      setSelectedCardCoord(null);
    } catch {
      setError('Failed to fetch cards');
    }
  };

  // Helpers for keyboard navigation
  const listOrder = ['todo', 'doing', 'done'];
  const getAdjacentListId = (currentListId, direction) => {
    const idx = listOrder.indexOf(currentListId);
    if (idx === -1) return currentListId;
    const nextIdx = Math.min(listOrder.length - 1, Math.max(0, idx + direction));
    return listOrder[nextIdx];
  };

  const ensureSelection = () => {
    if (selectedCardCoord) return selectedCardCoord;
    const firstListId = selectedListId || 'todo';
    const list = cardsByList[firstListId] || [];
    if (list.length > 0) {
      const card = list[0];
      const coord = { listId: firstListId, index: 0, cardId: card._id };
      setSelectedCardCoord(coord);
      return coord;
    }
    // find first non-empty list
    for (const lid of listOrder) {
      const arr = cardsByList[lid] || [];
      if (arr.length) {
        const coord = { listId: lid, index: 0, cardId: arr[0]._id };
        setSelectedCardCoord(coord);
        return coord;
      }
    }
    return null;
  };

  const moveSelection = (deltaRow, deltaCol) => {
    const current = ensureSelection();
    if (!current) return;
    let newListId = current.listId;
    let newIndex = current.index;
    if (deltaCol !== 0) {
      newListId = getAdjacentListId(current.listId, deltaCol);
      const destList = cardsByList[newListId] || [];
      newIndex = Math.min(destList.length - 1, Math.max(0, current.index));
    }
    if (deltaRow !== 0) {
      const list = cardsByList[newListId] || [];
      newIndex = Math.min(list.length - 1, Math.max(0, newIndex + deltaRow));
    }
    const listArr = cardsByList[newListId] || [];
    if (listArr.length === 0) return;
    const newCard = listArr[newIndex];
    setSelectedCardCoord({ listId: newListId, index: newIndex, cardId: newCard._id });
  };

  const moveSelectedCardToList = async (direction) => {
    const current = ensureSelection();
    if (!current) return;
    const destinationListId = getAdjacentListId(current.listId, direction);
    if (destinationListId === current.listId) return;

    const sourceList = cardsByList[current.listId] || [];
    const card = sourceList[current.index];
    if (!card) return;

    // Optimistic UI update
    setCardsByList(prev => {
      const next = { ...prev };
      const src = [...(next[current.listId] || [])];
      const [removed] = src.splice(current.index, 1);
      next[current.listId] = src;
      const dest = [...(next[destinationListId] || [])];
      removed.listId = destinationListId;
      dest.splice(0, 0, removed);
      next[destinationListId] = dest;
      return next;
    });

    // Sync with backend
    try {
      await fetch(`http://localhost:4000/api/cards/${card._id}/move`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceListId: current.listId,
          destinationListId,
          sourceIndex: current.index,
          destinationIndex: 0
        })
      });
    } catch (e) {
      // On error, reload board state
      selectBoard(selectedBoard);
    }

    // Update selection to moved card
    setSelectedCardCoord({ listId: destinationListId, index: 0, cardId: card._id });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) return;
      if (!selectedBoard) return;

      // Ctrl+K or Cmd+K: open global search
      if ((e.key.toLowerCase() === 'k') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQuery('');
        return;
      }

      // n: focus add card input
      if (e.key === 'n' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const lid = selectedListId || 'todo';
        const el = listInputRefs.current[lid];
        if (el && typeof el.focus === 'function') el.focus();
        return;
      }

      // e: edit selected card
      if (e.key === 'e' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const current = ensureSelection();
        if (!current) return;
        const card = (cardsByList[current.listId] || [])[current.index];
        if (card) handleEditCard(card);
        return;
      }

      // c: complete selected card
      if (e.key === 'c' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const current = ensureSelection();
        if (!current) return;
        const card = (cardsByList[current.listId] || [])[current.index];
        if (card && current.listId !== 'done') handleCompleteCard(card._id, current.listId);
        return;
      }

      // Delete: delete selected card
      if (e.key === 'Delete' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const current = ensureSelection();
        if (!current) return;
        const card = (cardsByList[current.listId] || [])[current.index];
        if (card) handleDeleteCard(card._id, current.listId);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1, 0); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1, 0); return; }
      if (e.key === 'ArrowRight' && !e.shiftKey) { e.preventDefault(); moveSelection(0, 1); return; }
      if (e.key === 'ArrowLeft' && !e.shiftKey) { e.preventDefault(); moveSelection(0, -1); return; }

      // Shift+Arrow to move card between lists
      if (e.key === 'ArrowRight' && e.shiftKey) { e.preventDefault(); moveSelectedCardToList(1); return; }
      if (e.key === 'ArrowLeft' && e.shiftKey) { e.preventDefault(); moveSelectedCardToList(-1); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cardsByList, selectedBoard, selectedListId, selectedCardCoord]);

  const createBoard = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title })
      });
      const board = await res.json();
      setBoards([...boards, board]);
      setTitle('');
    } catch {
      setError('Failed to create board');
    }
  };

  const addCard = async () => {
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/boards/${selectedBoard._id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          text: cardText, 
          assignedTo, 
          description: cardDescription,
          listId: selectedListId,
          dueDate: cardDueDate ? new Date(cardDueDate).toISOString() : null
        })
      });
      const card = await res.json();
      setCardsByList({
        ...cardsByList,
        [selectedListId]: [...cardsByList[selectedListId], card]
      });
      setCardText('');
      setAssignedTo('');
      setCardDescription('');
      setCardDueDate('');
    } catch {
      setError('Failed to add card');
    }
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setShowCardEditDialog(true);
  };

  const handleUpdateCard = (updatedCard) => {
    setCardsByList(prev => {
      const newCardsByList = { ...prev };
      Object.keys(newCardsByList).forEach(listId => {
        newCardsByList[listId] = newCardsByList[listId].map(card => 
          card._id === updatedCard._id ? updatedCard : card
        );
      });
      return newCardsByList;
    });
  };

  const handleDeleteCard = async (cardId, listId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setCardsByList(prev => ({
          ...prev,
          [listId]: prev[listId].filter(card => card._id !== cardId)
        }));
      } else {
        setError('Failed to delete card');
      }
    } catch {
      setError('Failed to delete card');
    }
  };

  const handleSendReminder = async (cardId) => {
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/cards/${cardId}/send-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setInfo('Reminder sent successfully!');
        setTimeout(() => setInfo(''), 3000);
      } else {
        setError(data.error || 'Failed to send reminder');
      }
    } catch {
      setError('Failed to send reminder');
    }
  };

  const handleCompleteCard = async (cardId, currentListId) => {
    setError('');
    try {
      const res = await fetch(`http://localhost:4000/api/cards/${cardId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update the card in state to move it to done list
        setCardsByList(prev => {
          const newCardsByList = { ...prev };
          
          // Remove from current list
          newCardsByList[currentListId] = newCardsByList[currentListId].filter(card => card._id !== cardId);
          
          // Add to done list with updated data
          const completedCard = data.card;
          newCardsByList.done = [completedCard, ...(newCardsByList.done || [])];
          
          return newCardsByList;
        });
        
        setInfo('Task completed successfully!');
        setTimeout(() => setInfo(''), 3000);
      } else {
        setError(data.error || 'Failed to complete task');
      }
    } catch {
      setError('Failed to complete task');
    }
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { status: 'none', color: 'transparent', text: '' };
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', color: '#dc3545', text: 'Overdue' };
    } else if (diffDays === 0) {
      return { status: 'today', color: '#ffc107', text: 'Due Today' };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: '#fd7e14', text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}` };
    } else {
      return { status: 'future', color: '#28a745', text: `Due ${due.toLocaleDateString()}` };
    }
  };

  // Drag and drop handler (immutable updates)
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;
    const sourceItems = Array.from(cardsByList[sourceId] || []);
    const [movedCard] = sourceItems.splice(source.index, 1);
    if (!movedCard) return;

    if (sourceId === destId) {
      // Reorder within same list
      const reordered = Array.from(sourceItems);
      reordered.splice(destination.index, 0, movedCard);
      setCardsByList(prev => ({ ...prev, [sourceId]: reordered }));
    } else {
      // Move between lists
      const destItems = Array.from(cardsByList[destId] || []);
      destItems.splice(destination.index, 0, { ...movedCard, listId: destId });
      setCardsByList(prev => ({ ...prev, [sourceId]: sourceItems, [destId]: destItems }));
    }

    // Sync with backend
    try {
      await fetch(`http://localhost:4000/api/cards/${draggableId}/move`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceListId: sourceId,
          destinationListId: destId,
          sourceIndex: source.index,
          destinationIndex: destination.index
        })
      });
    } catch (error) {
      console.error('Failed to sync card movement:', error);
      // Revert the optimistic update on error
      selectBoard(selectedBoard);
    }
  };

  return (
    <div style={{background:'#f4f6fa',minHeight:'100vh'}}>
      <Header onLogout={onLogout} onGoBoards={onGoBoards} onGoUserDashboard={onGoUserDashboard} onGoCalendar={onGoCalendar} view={view} />
      <div style={{display:'flex',height:'calc(100vh - 64px)'}}>
        {/* Sidebar */}
        <div style={{
          width:'320px',
          background:'#026aa7',
          color:'white',
          padding:'24px 0 0 0',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          boxShadow:'2px 0 8px rgba(2,106,167,0.08)'
        }}>
          <h2 style={{marginBottom:'16px'}}>Workspaces</h2>
          <div style={{width:'100%', padding:'0 10px'}}>
            {boards.map(b => (
              <button key={b._id} onClick={() => selectBoard(b)} style={{
                width:'90%',
                margin:'8px 0',
                padding:'12px 16px',
                background:selectedBoard && selectedBoard._id===b._id?'#0093e9':!b.isOwner?'#f0f8ff':'#fff',
                color:selectedBoard && selectedBoard._id===b._id?'#fff':'#026aa7',
                border:!b.isOwner?'1px solid #b3e0fc':'none',
                borderRadius:8,
                fontWeight:'bold',
                cursor:'pointer',
                textAlign:'left',
                position:'relative'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{b.title}</span>
                  {!b.isOwner && (
                    <span style={{fontSize:'0.8rem',opacity:0.7}}>Shared</span>
                  )}
                </div>
                {b.isOwner && (
                  <div style={{position:'absolute', right:8, top:8, display:'flex', gap:6}}>
                    <button title="Rename" onClick={(e) => { e.stopPropagation(); setBoardToEdit(b); setShowBoardEditDialog(true); }} style={{padding:'2px 6px', border:'none', background:'#ffc107', color:'#333', borderRadius:6, cursor:'pointer'}}>✏️</button>
                    <button title="Delete" onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`Delete workspace "${b.title}"?`)) return;
                      try {
                        const res = await fetch(`http://localhost:4000/api/boards/${b._id}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } });
                        const data = await res.json();
                        if (data.success) { setBoards(prev => prev.filter(x => x._id !== b._id)); if (selectedBoard && selectedBoard._id === b._id) setSelectedBoard(null); }
                        else alert(data.error || 'Failed to delete');
                      } catch { alert('Failed to delete'); }
                    }} style={{padding:'2px 6px', border:'none', background:'#dc3545', color:'#fff', borderRadius:6, cursor:'pointer'}}>🗑️</button>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div style={{marginTop:'16px',width:'90%'}}>
            <input placeholder="New workspace" value={title} onChange={e => setTitle(e.target.value)} style={{padding:8,borderRadius:6,border:'1px solid #ccc',width:'100%'}} />
            <button onClick={createBoard} style={{marginTop:8,padding:'8px 16px',background:'#0093e9',color:'white',border:'none',borderRadius:6,width:'100%'}}>Create Workspace</button>
          </div>
          {/* Sidebar-only content retained; metrics/graphs moved to Your Dashboard */}
        </div>
        {/* Main Board Area */}
        <div style={{flex:1,padding:'32px',overflowX:'auto'}}>
          {selectedBoard && (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <h3 style={{color:'#026aa7',fontSize:'1.5rem',fontWeight:'bold'}}>Workspace: {selectedBoard.title}</h3>
                {selectedBoard.isOwner && (
                  <div style={{display:'flex',gap:'12px'}}>
                    <button 
                      onClick={() => setShowSharedUsersDialog(true)}
                      style={{
                        padding:'10px 20px',
                        background:'#6c757d',
                        color:'white',
                        border:'none',
                        borderRadius:'8px',
                        fontWeight:'bold',
                        cursor:'pointer',
                        display:'flex',
                        alignItems:'center',
                        gap:'8px'
                      }}
                    >
                      <span>👥</span>
                      Manage Access
                    </button>
                    <button 
                      onClick={() => setShowShareDialog(true)}
                      style={{
                        padding:'10px 20px',
                        background:'#0093e9',
                        color:'white',
                        border:'none',
                        borderRadius:'8px',
                        fontWeight:'bold',
                        cursor:'pointer',
                        display:'flex',
                        alignItems:'center',
                        gap:'8px'
                      }}
                    >
                      <span>🔗</span>
                      Share
                    </button>
                  </div>
                )}
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <div style={{display:'flex',gap:'32px',marginTop:'24px'}}>
                  {lists.map(list => (
                    <Droppable droppableId={list.id} key={list.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            background:'linear-gradient(135deg,#e3f2fd 60%,#b3e0fc 100%)',
                            borderRadius:'16px',
                            padding:'20px',
                            minWidth:'260px',
                            boxShadow:'0 4px 16px rgba(2,106,167,0.10)',
                            maxHeight:'70vh',
                            overflowY:'auto',
                            transition:'box-shadow 0.2s'
                          }}
                        >
                          <h4 style={{color:'#026aa7',marginBottom:'16px',fontSize:'1.15rem',fontWeight:'bold',letterSpacing:'1px'}}>{list.title}</h4>
                          <div>
                            {(cardsByList[list.id]||[]).map((card, idx) => (
                              <Draggable key={card._id} draggableId={card._id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={(el) => { provided.innerRef(el); if (el) { cardRefs.current[card._id] = el; } }}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      background: card.listId === 'done' ? '#f8f9fa' : '#fff',
                                      borderRadius:'10px',
                                      padding:'14px 12px 10px 12px',
                                      marginBottom:'12px',
                                      boxShadow:snapshot.isDragging?'0 6px 24px rgba(2,106,167,0.18)':'0 2px 8px rgba(2,106,167,0.08)',
                                      position: 'relative',
                                      transition: 'box-shadow 0.2s, padding 0.2s',
                                      ...(selectedCardCoord && selectedCardCoord.cardId === card._id ? { border: '2px solid #026aa7' } : {}),
                                      ...(card.dueDate && getDueDateStatus(card.dueDate).status === 'overdue' ? { border: '2px solid #dc3545' } : {}),
                                      ...(card.listId === 'done' ? { opacity: 0.8, border: '2px solid #28a745' } : {}),
                                      ...provided.draggableProps.style
                                    }}
                                    onMouseEnter={() => setHoveredCardId(card._id)}
                                    onClick={() => {
                                      setSelectedCardCoord({ listId: list.id, index: idx, cardId: card._id });
                                      setExpandedCardId(prev => prev === card._id ? null : card._id);
                                    }}
                                    onMouseLeave={() => setHoveredCardId(null)}
                                    className="elevate"
                                  >
                                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px'}}>
                                    <div style={{
                                      fontWeight:'bold',
                                      fontSize:'1.08rem',
                                      color: card.listId === 'done' ? '#6c757d' : '#026aa7',
                                        textDecoration: card.listId === 'done' ? 'line-through' : 'none',
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                      {card.text}
                                      </div>
                                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleEditCard(card); }}
                                          title="Edit"
                                          style={{padding:'2px 6px',background:'#0093e9',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}
                                        >✏️</button>
                                        {card.dueDate && card.assignedTo && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleSendReminder(card._id); }}
                                            title="Remind"
                                            style={{padding:'2px 6px',background:'#ffc107',color:'#333',border:'none',borderRadius:4,cursor:'pointer'}}
                                          >🔔</button>
                                        )}
                                        {card.listId !== 'done' && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleCompleteCard(card._id, list.id); }}
                                            title="Complete"
                                            style={{padding:'2px 6px',background:'#28a745',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}
                                          >✅</button>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card._id, list.id); }}
                                          title="Delete"
                                          style={{padding:'2px 6px',background:'#dc3545',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}
                                        >🗑️</button>
                                      </div>
                                    </div>
                                    {card.description && (
                                      <div style={{
                                        fontSize:'0.9rem',
                                        color: card.listId === 'done' ? '#6c757d' : '#444',
                                        marginTop:'4px',
                                        opacity: card.listId === 'done' ? 0.6 : 0.85,
                                        textDecoration: card.listId === 'done' ? 'line-through' : 'none',
                                        whiteSpace: expandedCardId === card._id ? 'normal' : 'nowrap',
                                        overflow: expandedCardId === card._id ? 'visible' : 'hidden',
                                        textOverflow: expandedCardId === card._id ? 'clip' : 'ellipsis'
                                      }}>
                                        {card.description}
                                      </div>
                                    )}
                                    
                                    {/* Due Date Display */}
                                    {card.dueDate && (
                                      <div style={{
                                        marginTop: '8px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        background: getDueDateStatus(card.dueDate).color,
                                        display: 'inline-block'
                                      }}>
                                        📅 {getDueDateStatus(card.dueDate).text}
                                      </div>
                                    )}
                                    
                                    {/* Completion Info */}
                                    {card.completedAt && (
                                      <div style={{
                                        marginTop: '8px',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        background: '#28a745',
                                        display: 'inline-block'
                                      }}>
                                        ✅ Completed by @{card.completedBy} on {new Date(card.completedAt).toLocaleDateString()}
                                      </div>
                                    )}

                                    {/* actions are inline in header now; no hover panel */}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                          <div style={{marginTop:'18px',background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(2,106,167,0.04)'}}>
                            <input
                              placeholder="Task Title"
                              value={selectedListId===list.id?cardText:''}
                              onFocus={()=>setSelectedListId(list.id)}
                              onChange={e => {setSelectedListId(list.id);setCardText(e.target.value);}}
                              style={{padding:8,borderRadius:6,border:'1px solid #b3e0fc',width:'100%',marginBottom:'8px',fontWeight:'bold',color:'#000000'}}
                              ref={(el) => { if (el) { listInputRefs.current[list.id] = el; } }}
                            />
                            <textarea
                              placeholder="Task Description"
                              value={selectedListId===list.id?cardDescription:''}
                              onFocus={()=>setSelectedListId(list.id)}
                              onChange={e => {setSelectedListId(list.id);setCardDescription(e.target.value);}}
                              style={{padding:8,borderRadius:6,border:'1px solid #b3e0fc',width:'100%',marginBottom:'8px',resize:'vertical',minHeight:'48px',color:'#000000'}}
                            />
                            <input
                              placeholder="Assigned to (@username)"
                              value={selectedListId===list.id?assignedTo:''}
                              onFocus={()=>setSelectedListId(list.id)}
                              onChange={e => {setSelectedListId(list.id);setAssignedTo(e.target.value);}}
                              style={{padding:8,borderRadius:6,border:'1px solid #b3e0fc',width:'100%',marginBottom:'8px',color:'#000000'}}
                            />
                            <input
                              type="date"
                              placeholder="Due Date"
                              value={selectedListId===list.id?cardDueDate:''}
                              onFocus={()=>setSelectedListId(list.id)}
                              onChange={e => {setSelectedListId(list.id);setCardDueDate(e.target.value);}}
                              style={{padding:8,borderRadius:6,border:'1px solid #b3e0fc',width:'100%',marginBottom:'8px',color:'#000000'}}
                            />
                            <button
                              onClick={addCard}
                              style={{padding:'10px 0',background:'#026aa7',color:'white',border:'none',borderRadius:6,width:'100%',fontWeight:'bold',fontSize:'1rem',boxShadow:'0 2px 8px rgba(2,106,167,0.08)',marginTop:'4px'}}
                              disabled={!cardText || selectedListId!==list.id}
                            >Add Card</button>
                          </div>
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </DragDropContext>
            </>
          )}
          {error && <div style={{color:'red',marginTop:'16px'}}>{error}</div>}
        </div>
      </div>
      
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onShare={selectedBoard?._id}
        boardTitle={selectedBoard?.title}
        token={token}
      />
      
      <CardEditDialog
        isOpen={showCardEditDialog}
        onClose={() => setShowCardEditDialog(false)}
        card={selectedCard}
        onUpdate={handleUpdateCard}
        token={token}
      />
      
      <SharedUsersDialog
        isOpen={showSharedUsersDialog}
        onClose={() => setShowSharedUsersDialog(false)}
        boardId={selectedBoard?._id}
        boardTitle={selectedBoard?.title}
        token={token}
      />
      <BoardEditDialog
        isOpen={showBoardEditDialog}
        onClose={() => setShowBoardEditDialog(false)}
        board={boardToEdit}
        onUpdate={(updated) => {
          setBoards(prev => prev.map(x => x._id === updated._id ? updated : x));
          if (selectedBoard && selectedBoard._id === updated._id) setSelectedBoard(updated);
        }}
        onDelete={(deletedId) => {
          setBoards(prev => prev.filter(x => x._id !== deletedId));
          if (selectedBoard && selectedBoard._id === deletedId) setSelectedBoard(null);
        }}
        token={token}
      />
      {/* Global Quick Search Overlay */}
      {searchOpen && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: '10vh', zIndex: 9999
        }} onClick={() => setSearchOpen(false)}>
          <div style={{ background:'#ffffff', borderRadius:12, width:'min(720px, 92vw)', boxShadow:'0 16px 48px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding:16, borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:'#026aa7', fontWeight:'bold' }}>⌘K</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); } }}
                placeholder="Search cards by title, description, or assignee (@user)"
                style={{ flex:1, padding:'10px 12px', border:'1px solid #b3e0fc', borderRadius:8, outline:'none', fontSize:'1rem' }}
              />
            </div>
            <div style={{ maxHeight:'50vh', overflowY:'auto' }}>
              {(Object.keys(cardsByList).length === 0) && (
                <div style={{ padding:16, color:'#6b7280' }}>No cards to search.</div>
              )}
              {searchQuery.trim() !== '' && (
                (() => {
                  const q = searchQuery.trim().toLowerCase();
                  const results = [];
                  for (const lid of Object.keys(cardsByList)) {
                    for (const c of (cardsByList[lid]||[])) {
                      const hay = `${c.text||''}\n${c.description||''}\n${c.assignedTo||''}`.toLowerCase();
                      if (hay.includes(q)) results.push({ card:c, listId: lid });
                    }
                  }
                  if (results.length === 0) {
                    return <div style={{ padding:16, color:'#6b7280' }}>No matches.</div>;
                  }
                  return (
                    <div style={{ padding:8 }}>
                      {results.slice(0,100).map(({card, listId}) => (
                        <button key={card._id} onClick={() => {
                          setSearchOpen(false);
                          setSelectedCardCoord({ listId, index: (cardsByList[listId]||[]).findIndex(x=>x._id===card._id), cardId: card._id });
                          setExpandedCardId(card._id);
                          setTimeout(() => {
                            const el = cardRefs.current[card._id];
                            if (el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'center' });
                          }, 0);
                        }}
                        style={{
                          width:'100%', textAlign:'left', padding:'12px 14px', border:'none', background:'white', cursor:'pointer', borderRadius:8, margin:'6px 0',
                          display:'grid', gridTemplateColumns:'1fr auto', gap:8
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f8ff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                      >
                          <div>
                            <div style={{ fontWeight:'bold', color:'#026aa7', marginBottom:4 }}>{card.text}</div>
                            {card.description && (
                              <div style={{ fontSize: '0.9rem', color:'#374151', opacity:0.9, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.description}</div>
                            )}
                            {card.assignedTo && (
                              <div style={{ fontSize: '0.8rem', color:'#6b7280', marginTop:4 }}>Assigned: {card.assignedTo}</div>
                            )}
                          </div>
                          <div style={{ alignSelf:'center', fontSize:'0.8rem', color:'#026aa7', fontWeight:'bold' }}>{listId.toUpperCase()}</div>
                      </button>
                      ))}
                    </div>
                  );
                })()
              )}
              {searchQuery.trim() === '' && (
                <div style={{ padding:16, color:'#6b7280' }}>Type to search. Press Escape to close.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('login');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [mainView, setMainView] = useState('boards'); // 'boards' | 'userDashboard' | 'calendar'

  // Login handler
  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setCurrentUsername(username);
        setPage('dashboard');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch {
      alert('Network error');
    }
    setLoading(false);
  };

  // Signup handler
  const handleSignup = () => setPage('login');

  if (!token) {
    if (page === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          loading={loading}
          goToSignup={() => setPage('signup')}
        />
      );
    } else {
      return (
        <Signup
          onSignup={handleSignup}
          loading={loading}
          goToLogin={() => setPage('login')}
        />
      );
    }
  }
  return (
    mainView === 'boards' ? (
      <Dashboard 
        token={token} 
        onLogout={() => { setToken(''); setPage('login'); }} 
        currentUsername={currentUsername}
        onGoBoards={() => setMainView('boards')}
        onGoUserDashboard={() => setMainView('userDashboard')}
        onGoCalendar={() => setMainView('calendar')}
        view={mainView}
      />
    ) : (
      mainView === 'userDashboard' ? (
        <UserDashboard
          token={token}
          onLogout={() => { setToken(''); setPage('login'); }}
          currentUsername={currentUsername}
          onGoBoards={() => setMainView('boards')}
          onGoUserDashboard={() => setMainView('userDashboard')}
          onGoCalendar={() => setMainView('calendar')}
          view={mainView}
        />
      ) : (
        <CalendarView
          token={token}
          onLogout={() => { setToken(''); setPage('login'); }}
          currentUsername={currentUsername}
          onGoBoards={() => setMainView('boards')}
          onGoUserDashboard={() => setMainView('userDashboard')}
          onGoCalendar={() => setMainView('calendar')}
          view={mainView}
        />
      )
    )
  );
}
