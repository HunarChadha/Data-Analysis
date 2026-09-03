import url from "./url.ts";

type conv = {prompt:string, response:string}
let chats_history:string[] = []
let chats_message:number[] = []
let convSaved = false

function resetInd() {
    convSaved = false
}

function extractConvId(data: any): number | null {
    if (Array.isArray(data) && data.length > 0) return extractConvId(data[0])
    if (typeof data === 'number' && Number.isFinite(data)) return data
    if (typeof data === 'string' && data.trim() !== '' && !isNaN(Number(data))) return Number(data)
    if (data && typeof data === 'object') {
        for (const key of ['conv_id', 'convID', 'CONVERSATION_ID', 'conversation_id', 'id']) {
            if (data[key] !== undefined && data[key] !== null && !isNaN(Number(data[key]))) {
                return Number(data[key])
            }
        }
    }
    return null
}

// @ts-ignore
function createChats(chats_data){
    console.log(chats_data, "chats data")
    chats_history.length = 0
    chats_message.length = 0
    // fetch failure used to return a string, which iterated one character per
    // "chat" — guard so a bad response leaves an empty sidebar instead.
    if(!Array.isArray(chats_data)) return
    for(let i = 0; i < chats_data.length; i++){
        const row = chats_data[i]
        // history rows are [CONVERSATION_ID, ..., TITLE, ...]
        if(!Array.isArray(row) || row.length < 3) continue
        chats_history.push(String(row[2]))
        chats_message.push(Number(row[0]))
    }
}
async function saveConv(user_id:string | null, title:string){
    if(!user_id){
        return
    }
    const user_idn = Number(user_id)
    // untitled chats still get a conversation — otherwise saveChat would have
    // nothing to attach messages to
    const convTitle = title?.trim() || 'Untitled chat'
    try {
        const res = await fetch(url.saveConv, {
            method: 'POST',
            headers: {"content-type": "application/json"},
            body: JSON.stringify({user_id: user_idn, title: convTitle})
        })
        if (!res.ok || !res.body) {
            const errBody = await res.text().catch(() => null);
            console.log(res.status, errBody);
            return "Something went wrong";
        }
        const data = await res.json();
        return await data
    }
    catch (error) {
        console.error(error)
        return "Something went wrong"
    }
}
async function saveChat(chats:conv[], user_id:string|null, title:string, convID:string|null){
    const user_idn = Number(user_id)
    if(!user_id || !Number.isFinite(user_idn) || chats.length === 0){
        return;
    }
    let convIDn = Number(convID)
    if(!convSaved){
        // first save: create the conversation and use the ID the backend
        // assigns. Never fall back to a stale client-side ID — messages sent
        // to a conversation that doesn't exist trip the CONVERSATION_ID
        // foreign key on the MESSAGES table.
        const created = await saveConv(user_id, title)
        const newId = extractConvId(created)
        if(!newId){
            console.log("conversation could not be created:", created)
            return;
        }
        convIDn = newId
        localStorage.setItem('convID', String(newId))
        convSaved = true
    }
    if(!convIDn || isNaN(convIDn)){
        return;
    }
    console.log("conv_saved")
    console.log(convIDn)
    // USER_ID rides along so the backend can verify this user owns the
    // conversation before overwriting its messages
    let n:number = 1;
    let chats_data = []
    for(let i = 0; i < chats.length; i++){
        const entry = chats[i]
        const data_user = {ROLE: 'USER', USER_ID: user_idn, CONVERSATION_ID: convIDn, CONTENT:entry.prompt, IND:n}
        n = n + 1
        const data_ai = {ROLE: 'AI', USER_ID: user_idn, CONVERSATION_ID: convIDn, CONTENT:entry.response, IND:n}
        n = n + 1
        chats_data.push(data_user)
        chats_data.push(data_ai)
    }
    console.log(chats_data)
    saveMessages(chats_data)
}
async function saveMessages(chats_data){
    if(!chats_data){
        return
    }
    try {
        const res = await fetch(url.SaveChat, {
            method: 'POST',
            headers: {"content-type": "application/json"},
            body: JSON.stringify(chats_data)
        })
        if (!res.ok || !res.body) {
            const errBody = await res.text().catch(() => null);
            console.log(res.status, errBody);
            return "Something went wrong";
        }
        console.log("save")
        return await res.json()
    }
    catch (error) {
        console.error(error)
        return "Something went wrong"
    }
}

function userMessage(Message:string|null): conv|null {
    if(!Message) {
        return null
    }
    return {
        prompt: Message,
        response: "....generating response",
    }
}
async function FetchChatHistory(user_id:string|null) {
    try{
        const res = await fetch(url.chatbotHistory, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({user_id: user_id}),
        });
        if(!res.ok || !res.body) {
            console.log(res.status)
            return []
        }
        return await res.json()
    }
    catch(err){
        console.log(err)
        return []
    }
}

async function FetchChatMessage(conv_id:string|null, user_id:string|null){
    // user_id is required — the backend checks conversation ownership
    if(!conv_id || !user_id || isNaN(Number(user_id))) {
        return []
    }
    try{
        const res = await fetch(url.chatMessage, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({conv_id: conv_id, user_id: user_id}),
        })
        if(!res.ok || !res.body) {
            console.log(res.status)
            return []
        }
        const data = await res.json()
        if(!Array.isArray(data)){
            // "Access denied" / "Conversation N does not exist" — leave the
            // save state untouched so a later save re-verifies ownership
            console.log("chat message fetch failed:", data)
            return []
        }
        convSaved = true
        return data
    }
    catch(err){
        console.log(err)
        return []
    }
}

async function response(message: string, onChunk: (text: string) => void): Promise<string> {
    try {
        const res = await fetch(url.chatbot, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({prompt: message}),
        });
        if (!res.ok || !res.body) {
            console.log(res.status);
            return "Something went wrong. Please try again.";
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            full += decoder.decode(value, {stream: true});
            onChunk(full);
        }
        return full;
    } catch (error) {
        console.error(error);
        return "Something went wrong. Please try again.";
    }
}

export {userMessage, response, chats_history, FetchChatHistory, createChats, chats_message, FetchChatMessage, saveChat, resetInd}
export type {conv}