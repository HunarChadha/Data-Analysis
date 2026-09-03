import url from '../Main/url'


function handleFile(e: React.ChangeEvent<HTMLInputElement>, setSelectedFile: (file: File) => void) {
    const file = e.target.files?.[0]
    if (file) {
        setSelectedFile(file)
        console.log("selectedFile", file.name)
    }
}
async function uploadFile(setSelectedFile: File |null) {
    if(!setSelectedFile) {
        return;
    }
    const formData = new FormData();
    formData.append("file", setSelectedFile);
    try {
        const response = await fetch(url.dashboard, {
            method: "POST",
            body: formData,
        })
        if(!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }
        const data = await response.json();
        console.log("back", data);
        return data
    }catch(err) {
        console.error(err);
    }
}
export  {handleFile, uploadFile};