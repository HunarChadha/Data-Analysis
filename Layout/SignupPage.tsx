import styles from "../style/Signup.module.css"
import {Link, useNavigate} from 'react-router-dom';
import {collectEmail_Password} from "../Main/userInfo.ts";
import {useState } from 'react'

function SignupPage() {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [passwordMismatch, setPasswordMismatch] = useState(false)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const navigate = useNavigate()

    function onEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        setEmail(value)
        setEmailError(value.length > 0 && !emailRegex.test(value))
    }

    function onPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        setPassword(value)
        setPasswordMismatch(passwordConfirm.length > 0 && value !== passwordConfirm)
    }

    function onPasswordConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        setPasswordConfirm(value)
        setPasswordMismatch(value.length > 0 && value !== password)
    }

    function handleSubmit(e: React.MouseEvent) {
        e.preventDefault()
        if (!email || emailError || !password || password !== passwordConfirm) return
        collectEmail_Password(email, password)
        navigate('/Welcome')
    }

    return (
        <div className={styles.mainPage}>
            <div className={styles.container}>
                <h1 className={styles.header}>Sign Up</h1>
                <div className={styles.formGroup}>
                    <input type="email" placeholder="Email" className={styles.input} value={email} onChange={onEmailChange}/>
                    <input type="password" placeholder="Password" className={styles.input} value={password} onChange={onPasswordChange}/>
                    <input type="password" placeholder="Retype Password" className={styles.input} value={passwordConfirm} onChange={onPasswordConfirmChange}/>
                </div>
                <button className={styles.button} onClick={handleSubmit}>Sign Up</button>
                <Link to={'/login'} className={styles.link}>Already have an account?</Link>
                {passwordMismatch && <h1 className={styles.wrong}>Passwords don't match</h1>}
                {emailError && <h1 className={styles.wrong}>Incorrect Email</h1>}
            </div>
        </div>
    )
}

export default SignupPage;