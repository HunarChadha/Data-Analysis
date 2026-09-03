import styles from '../style/LoginPage.module.css'
import {Link, useNavigate} from 'react-router-dom';
import {Login} from "../Main/Login.ts";
import {useState} from "react";

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passw, setpassw] = useState(false);
    const [dataw, setdataw] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async () => {
        if(!email || !password){
            return
        }
        const info = await Login(email, password);
        if (info === 'Database'){
            setpassw(false)
            setdataw(true);
            return;
        }
        else if (info === 'Pass'){
            setdataw(false);
            setpassw(true);
            return;
        }
        else if (info && !isNaN(Number(info))){
            // only a numeric user id is a successful login — anything else
            // ("something went wrong", undefined) must not navigate
            localStorage.setItem('user_id', String(Number(info)))
            navigate('/dashboard')
        }

    }
    return (
        <div className={styles.mainPage}>
            <div className={styles.container}>
                <h1 className={styles.header}>Welcome Back!</h1>
                <div className={styles.formGroup}>
                    <input type="email" placeholder="Email" className={styles.input} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" className={styles.input} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className = {styles.button} onClick={() => {handleLogin()}}>Login</button>
                <Link to={'/Signup'} className={styles.link}>Don't have an account?</Link>
                {passw && <p className={styles.incorrect}>Incorrect Password</p>}
                {dataw && <p className={styles.incorrect}>Incorrect Email</p>}

            </div>
        </div>
    )
}

export default LoginPage