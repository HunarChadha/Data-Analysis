import styles from '../style/WelcomePage.module.css'
import {useState} from "react";
import {collectName, send_user_info} from "../Main/userInfo.ts";
import {useNavigate} from "react-router-dom";

function WelcomePage() {
    const [name, setName] = useState('')
    const [empty, setEmpty] = useState(false)
    const navigate = useNavigate();
    const handleClick = () =>{
        if(name.length === 0){
            setEmpty(true)
        }
        else{
            setEmpty(false)
            collectName(name)
            send_user_info().then(data => {
                // the backend answers with the new user's numeric ID — never
                // store "undefined" when the request failed
                if(data !== undefined && data !== null && !isNaN(Number(data))){
                    localStorage.setItem('user_id', String(Number(data)))
                }
                navigate('/dashboard')
            })
        }
    }
    return(
        <div className={styles.mainPage}>
            <div className={styles.container}>
                <h1 className={styles.greetings}>Hey There!</h1>
                <h1 className={styles.Introduction}>I'm Vortex, your personal AI assistant</h1>
                <h1 className={styles.question}>What should i call you?</h1>
                <input className={styles.name} type={'text'} placeholder={'Name'} required={true} onChange={(e) => setName(e.target.value)}/>
                <button className={styles.continue} onClick={handleClick}>continue</button>
                {empty && <h1 className={styles.error} >Incorrect Name</h1>}
            </div>
        </div>
    )
}

export default WelcomePage;