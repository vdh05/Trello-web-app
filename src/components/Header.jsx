import React from 'react';

const Header = ({ onLogout, view, onGoBoards, onGoUserDashboard, onGoCalendar }) => {
    return (
        <div className='w-100 h-14 px-4 border-b flex flex-row justify-between items-center' style={{
            background:'linear-gradient(90deg,#026aa7,#0093e9)',
            borderBottom:'1px solid rgba(159,173,188,0.25)',
            boxShadow:'0 2px 12px rgba(2,106,167,0.18)'
        }}>
            <div className="left justify-center items-center flex">
                <h3 className='text-slate-50' style={{letterSpacing:'1px'}}>Trello Clone</h3>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
                {onGoBoards && (
                    <button onClick={onGoBoards} style={{
                        padding:'8px 12px',
                        background: view === 'boards' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                        color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:8, cursor:'pointer'
                    }}>Boards</button>
                )}
                {onGoUserDashboard && (
                    <button onClick={onGoUserDashboard} style={{
                        padding:'8px 12px',
                        background: view === 'userDashboard' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                        color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:8, cursor:'pointer'
                    }}>Your Dashboard</button>
                )}
                {onGoCalendar && (
                    <button onClick={onGoCalendar} style={{
                        padding:'8px 12px',
                        background: view === 'calendar' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                        color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:8, cursor:'pointer'
                    }}>Calendar</button>
                )}
                {onLogout && (
                    <button onClick={onLogout} style={{
                        padding:'8px 14px',
                        background:'rgba(255,255,255,0.15)',
                        color:'#ffffff',
                        border:'1px solid rgba(255,255,255,0.35)',
                        borderRadius:8,
                        fontWeight:'bold',
                        backdropFilter:'blur(2px)',
                        cursor:'pointer'
                    }}>Logout</button>
                )}
            </div>
        </div>
    );
}

export default Header;
