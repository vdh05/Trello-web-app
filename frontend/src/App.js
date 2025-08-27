import React, { useState } from 'react';

function Login({ setToken }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleLogin = async () => {
        const res = await fetch('http://localhost:4000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) setToken(data.token);
        else setError(data.error);
    };
    return (
        <div>
            <h2>Login</h2>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
            {error && <div>{error}</div>}
        </div>
    );
}

function Signup({ setPage }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSignup = async () => {
        const res = await fetch('http://localhost:4000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) setPage('login');
        else setError(data.error);
    };
    return (
        <div>
            <h2>Signup</h2>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleSignup}>Signup</button>
            {error && <div>{error}</div>}
        </div>
    );
}

function Dashboard({ token, onLogout }) {
    const [boards, setBoards] = useState([]);
    const [title, setTitle] = useState('');
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [cards, setCards] = useState([]);
    const [cardText, setCardText] = useState('');

    React.useEffect(() => {
        fetch('http://localhost:4000/api/boards', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setBoards);
    }, [token]);

    const createBoard = async () => {
        const res = await fetch('http://localhost:4000/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title })
        });
        const board = await res.json();
        setBoards([...boards, board]);
        setTitle('');
    };

    const selectBoard = async (board) => {
        setSelectedBoard(board);
        const res = await fetch(`http://localhost:4000/api/boards/${board.id}/cards`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCards(data);
    };

    const addCard = async () => {
        const res = await fetch(`http://localhost:4000/api/boards/${selectedBoard.id}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: cardText })
        });
        const card = await res.json();
        setCards([...cards, card]);
        setCardText('');
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <button onClick={onLogout}>Logout</button>
            <div>
                <input placeholder="New board title" value={title} onChange={e => setTitle(e.target.value)} />
                <button onClick={createBoard}>Create Board</button>
            </div>
            <div>
                <h3>Your Boards</h3>
                {boards.map(b => (
                    <div key={b.id}>
                        <button onClick={() => selectBoard(b)}>{b.title}</button>
                    </div>
                ))}
            </div>
            {selectedBoard && (
                <div>
                    <h3>Cards for {selectedBoard.title}</h3>
                    {cards.map(c => <div key={c.id}>{c.text}</div>)}
                    <input placeholder="New card text" value={cardText} onChange={e => setCardText(e.target.value)} />
                    <button onClick={addCard}>Add Card</button>
                </div>
            )}
        </div>
    );
}

export default function App() {
    const [page, setPage] = useState('login');
    const [token, setToken] = useState('');
    if (!token) {
        return page === 'login'
            ? <div><Login setToken={setToken} /><button onClick={() => setPage('signup')}>Go to Signup</button></div>
            : <div><Signup setPage={setPage} /><button onClick={() => setPage('login')}>Go to Login</button></div>;
    }
    return <Dashboard token={token} onLogout={() => { setToken(''); setPage('login'); }} />;
}
