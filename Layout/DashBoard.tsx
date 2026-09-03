import styles from "../style/DashBoard.module.css"
import {handleFile, uploadFile} from "../Main/FileHanding.ts";
import {type NavigateFunction, useNavigate} from "react-router-dom";
import {type Dispatch, type SetStateAction, useState } from 'react'

async function handleUploadClick(setSelectedFile: File | null, navigate: NavigateFunction, setError: Dispatch<SetStateAction<string | null>>) {
    setError(null)
    const data = await uploadFile(setSelectedFile)
    if(data){
        navigate('/analyze', { state: { results: data } })
    }
    else{
        setError('Error uploading file')
    }
}

// ---- Decorative panel: a drawn data series, echoing the landing page's hero chart ----
function ArtPanel() {
    const points: [number, number][] = [
        [10, 150], [55, 120], [100, 135], [145, 90],
        [190, 105], [235, 60], [280, 78], [325, 40], [370, 55],
    ];
    const path = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
        .join(" ");
    const area = `${path} L 370 190 L 10 190 Z`;

    return (
        <div className={styles.art} aria-hidden="true">
            <svg viewBox="0 0 390 200">
                <defs>
                    <linearGradient id="dashArtFade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E8A54B" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#E8A54B" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[40, 80, 120, 160].map((y) => (
                    <line key={y} x1="10" y1={y} x2="370" y2={y} className={styles.gridLine} />
                ))}
                <path d={area} fill="url(#dashArtFade)" />
                <path d={path} className={styles.trendLine} />
                {points.map(([x, y], i) => (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3.5"
                        className={styles.trendDot}
                        style={{ animationDelay: `${0.9 + i * 0.09}s` }}
                    />
                ))}
            </svg>
        </div>
    );
}

const FORMATS = ['CSV', 'TSV', 'Excel', 'JSON'];

function DashBoard(){
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const hasFile = selectedFile !== null
    return (
        <div className={styles.mainPage}>
            <div className={styles.card}>
                <div className={styles.content}>
                    <h1 className={styles.heading}>Analyze your data</h1>
                    <p className={styles.sub}>
                        Upload a file and get statistical summaries and interactive
                        charts back — no notebook, no boilerplate.
                    </p>
                    <div className={styles.actions}>
                        <label className={`${styles.button} ${styles.primary}`}>
                            <input
                                type="file"
                                accept=".csv,.tsv,.xls,.xlsx,.json"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFile(e, setSelectedFile)}
                            />
                            Upload File
                        </label>
                        <button
                            className={`${styles.button} ${styles.secondary} ${hasFile ? "" : styles.disabled}`}
                            onClick={() => handleUploadClick(selectedFile, navigate, setError)}
                            disabled={!hasFile}
                        >
                            Analyze the Data
                        </button>
                        <button className={`${styles.button} ${styles.secondary}`} onClick={() => navigate('/Chatbot')}>
                            Ask AI
                        </button>
                    </div>
                    {selectedFile && <p className={styles.fileName}>Selected: {selectedFile.name}</p>}
                </div>
                <ArtPanel />
            </div>
            <div className={styles.chips}>
                {FORMATS.map((format) => (
                    <span key={format} className={styles.chip}>{format}</span>
                ))}
            </div>
            <button className={styles.homeLink} onClick={() => navigate('/')}>Back to Home</button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    )
}

export default DashBoard;