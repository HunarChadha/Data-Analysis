import styles from '../style/Chatbot.module.css'
import {
    userMessage,
    type conv,
    response,
    chats_history,
    FetchChatHistory,
    createChats,
    chats_message,
    FetchChatMessage, saveChat, resetInd
} from "../Main/chatbot.ts";
import {useState, type KeyboardEvent} from "react";
import {useNavigate} from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function ChatBot(){
    const [chat, setChat] = useState<conv[]>([]);
    const [message,setMessage]=useState<string|null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [busy, setBusy] = useState(false);   // a response is streaming in
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const user_id = localStorage.getItem("user_id");
    const [title, setitle] = useState<string>('');
    const sendMessage = async (event: KeyboardEvent<HTMLInputElement>, Message:string|null) => {
        if(event.key !== 'Enter' || !Message || busy){
            return
        }
        const entry = userMessage(Message);
        if(!entry){
            return
        }
        const currentMessage = Message;
        setMessage(null);
        event.currentTarget.value = "";
        setBusy(true);
        setChat(prevChat => [...prevChat, entry]);
        try {
            await response(currentMessage, (text) => {
                setChat(prevChat => prevChat.map((item, index) =>
                    index === prevChat.length - 1 ? {...item, response: text} : item
                ));
            });
        }
        finally {
            // ignore Enter until the stream finished — mid-stream sends would
            // have the old stream's callback overwrite the new message
            setBusy(false);
        }
    }
    const handleClick = async (index:number) =>{
        const convID:number = chats_message[index]
        if(!convID){
            return
        }
        const data = await FetchChatMessage(String(convID), user_id)
        let messages:conv[] = []
        // messages arrive as [.., user, ai, user, ai, ..]; only walk complete
        // pairs and skip malformed rows
        const pairs = data.length - (data.length % 2)
        for(let i = 0; i < pairs; i+=2){
            const promptRow = data[i]
            const responseRow = data[i + 1]
            if(!Array.isArray(promptRow) || !Array.isArray(responseRow)){
                continue
            }
            const entry:conv = {prompt:promptRow[3], response:responseRow[3]};
            messages.push(entry);
        }
        setChat(messages);
        setitle(chats_history[index] ?? '')
        localStorage.setItem('convID', String(convID))
        setSidebarOpen(false)
    }
    const ChatHistory = async () => {
        // no user id (not logged in) — the backend would fail on int(None)
        if(!user_id){
            return
        }
        const data = await FetchChatHistory(user_id)
        createChats(data)
        setSidebarOpen(true)
    }
    const newChat = () => {
        setChat([])
        setitle('')
        // next save creates a fresh conversation on the backend
        resetInd()
        let convID = Number(localStorage.getItem('convID'));
        convID = convID + 1;
        localStorage.setItem('convID', String(convID))
    }
    return(
        <div className={styles.mainPage}>
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <span>Vortex</span>
                    <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6 6 18"/>
                            <path d="m6 6 12 12"/>
                        </svg>
                    </button>
                </div>
                <div className={styles.chatHistory}>
                    {sidebarOpen && <div>
                        {chats_history.map((item, index) =>(
                            <p key={index} onClick={() => (handleClick(index))}>{item}</p>
                        ))}
                    </div>}
                </div>
            </div>
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)}/>}
            <div className={styles.toolbar}>
                <div className={styles.tool}>
                    <button className={styles.toolButton} onClick={() => (ChatHistory())}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="16" rx="2"/>
                            <line x1="9" y1="4" x2="9" y2="20"/>
                        </svg>
                    </button>
                    <span className={styles.tooltip}>Sidebar</span>
                </div>
                <div className={styles.tool}>
                    <button className={styles.toolButton} onClick={() => newChat()}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M12 7v10"/>
                            <path d="M7 12h10"/>
                        </svg>
                    </button>
                    <span className={styles.tooltip}>New chat</span>
                </div>
                <div className={styles.tool}>
                    <button className={styles.toolButton} onClick={() => navigate('/dashboard')}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </button>
                    <span className={styles.tooltip}>Upload data</span>
                </div>
            </div>
            <div className={styles.chat}>
                <div className={styles.prompt}>
                    {chat.map((item, index) => (
                        <div key={index}>
                            <div className={styles.userPrompt}>
                                <p >{item.prompt}</p>
                            </div>
                            <div className={styles.aiResponse}>
                                <div className={styles.markdownContent}>
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {item.response}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <input type="text" placeholder="Ask Vortex" className={styles.input} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => sendMessage(e, message)} />
            <h3> AI can make mistakes. NOTE:- Chat is not saved automatically to save chat:</h3>
            <input className={styles.inputTitle} placeholder={'Enter title for chat'} onChange={(e) => {setitle(e.target.value)}}/>
            <button
                className={`${styles.button} ${saving || chat.length === 0 ? styles.disabledButton : ""}`}
                disabled={saving || chat.length === 0}
                onClick={async () => {
                    setSaving(true)
                    try {
                        await saveChat(chat, localStorage.getItem('user_id'), title, localStorage.getItem('convID'))
                    }
                    finally {
                        setSaving(false)
                    }
                }}
            >
                {saving ? 'Saving…' : 'Save Chat'}
            </button>
        </div>
    )
}

export default ChatBot;