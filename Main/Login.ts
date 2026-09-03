import url from "./url.ts"

async function Login(email:string, password:string){
    if(!email || !password){
        return;
    }
    try{
        const res = await fetch(url.login, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'email': email, 'password': password})
        })
        if(!res.ok){
            console.log(res.status);
            return "something went wrong";
        }
        return await res.json()
    }
    catch (error){
        console.log(error)
    }
}
export {Login}