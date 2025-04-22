
export const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email)
}

export const getInitials = (username: string)=>{
    return username.split(' ').map((username)=>username[0]).join('').toUpperCase()
}

export const filterFirstName = (username : string)=>{
    return username.split(' ')[0]
}