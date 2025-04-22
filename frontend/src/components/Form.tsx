
import { Link } from "react-router-dom";

const Form = ()=>{

    return <div>
        <div className=' text-xl text-center mb-5 flex justify-center'>
        <div className="bg-zinc-500 bg-opacity-50 p-6 rounded-lg shadow-lg text-center">
            <div className="space-y-6">
                <h5 className="text-xl font-sans font-medium text-gray-900 dark:text-lime-400">Sign in to WanderLust</h5>
                <div>
                    <label  className="block mb-2 text-sm font-sans text-gray-900 dark:text-white">Your email</label>
                    <input type="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 bg-transparent dark:placeholder-gray-400 dark:text-white outline-none" placeholder="user@mail.com" required />
                </div>
                <div>
                    <label  className="block mb-2 text-sm font-sans text-gray-900 dark:text-white">Your password</label>
                    <input type="password" placeholder="••••••••" className="bg-gray-50 border-gray-300 border text-gray-900 text-sm rounded-lg block w-full p-2.5 bg-transparent dark:placeholder-gray-400 dark:text-white outline-none" required />
                </div>
                <button className="w-full font-sans rounded-lg text-sm px-5 py-2.5 text-center dark:bg-lime-600 outline-none">Login</button>
                <div className="text-sm font-sans text-gray-500 dark:text-gray-300">
                    Not Registered?
                <Link to={"/register"} className="text-lime-700 hover:underline dark:text-lime-500 cursor-pointer">Create Account</Link>
                </div>
            </div>
        </div>
      </div>
    </div>
}

export default Form;

//