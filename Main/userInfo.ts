import url from '../Main/url.ts'
const userInfo = {'username': '', 'password': '', 'email': ''};

function collectName(name:string){
    userInfo.username = name;
}

function collectEmail_Password(email:string, password:string){
    userInfo.email = email;
    userInfo.password = password;
}
async function send_user_info(){
    console.log(userInfo);
    if(userInfo.email.length === 0 || userInfo.password.length === 0 || userInfo.username.length === 0) {
        return;
    }
    try{
        const res = await fetch(url.welcome, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userInfo),
        })
        if(!res.ok){
            console.log(res.status)
        }
        return await res.json()
    }
    catch (error) {
        console.error(error);
    }
}

export {collectName, collectEmail_Password, send_user_info};