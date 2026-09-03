import {Navigate, useLocation, useNavigate} from 'react-router-dom'
import {manage_data, chartsData} from "../Main/DataManagement.ts";

function AnalyzePage() {
    const results = useLocation().state?.results
    const navigate = useNavigate()
    if (!results) return <Navigate to="/" replace />
    manage_data(results)
    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '2rem', width: '100%',
            minHeight: '100vh', boxSizing: 'border-box',
            background: '#0F1215', color: '#ECEEF1',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            <button
                onClick={() => navigate('/Chatbot')}
                style={{
                    position: 'fixed', top: '16px', right: '16px', zIndex: 10,
                    padding: '10px 18px', borderRadius: '8px',
                    background: '#E8A54B', color: '#17130A', border: 'none',
                    fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(232, 165, 75, 0.22)',
                }}
            >
                Ask AI
            </button>
            {chartsData.map((chart, i) => (
                <div key={i} style={{
                    width: '45%', minWidth: '320px', padding: '0.75rem 1rem 1rem', boxSizing: 'border-box',
                    background: '#171B20', border: '1px solid #262B32', borderRadius: '15px',
                }}>
                    {chart}
                </div>
            ))}
        </div>
    )
}

export default AnalyzePage;