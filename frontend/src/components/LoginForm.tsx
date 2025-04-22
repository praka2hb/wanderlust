import { Link, useNavigate } from "react-router-dom";
import wanderlust from "../assets/wanderlust.jpg";
import { useState } from "react";
import { validateEmail } from "../utils/validate";
import axiosInstance from "../utils/axiosInstance";
import HomeIcon from '@mui/icons-material/Home';

const Auth = () => {
  const [ email, setEmail ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ error, setError ] = useState('');

  const navigate = useNavigate();
  
  const handleLogin = async (e:any) => {
    e.preventDefault();
  
    if (!validateEmail(email)) {
      setError('Invalid email');
      return;
    }
  
    setError('');
    try {
      const response = await axiosInstance.post('/login', {
        email,
        password,
      });
  
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error); // Log full error for debugging
      setError(e.response?.data?.message || 'Failed to login. Please try again.');
    }
  };


  return (
    <div className="relative h-screen w-full">
      <img
        src={wanderlust}
        alt="Background"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0">
        <div className="absolute top-6 left-6 bg-opacity-25 p-2 bg-slate-300 rounded-md shadow-md hover:shadow-xl z-10 cursor-pointer">
          <Link to={"/home"}>
            <HomeIcon sx={{fontSize: 35}} className="text-white"  />
          </Link>
        </div>
        <div className="flex items-center justify-center w-full h-full backdrop-filter backdrop-blur-sm bg-gray-900 bg-opacity-25">
          <div className=' text-xl text-center flex justify-center w-[400px]'>
            <div className="bg-zinc-500 bg-opacity-50 p-6 rounded-lg shadow-lg text-center">
                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <h5 className="text-xl font-sans font-medium text-gray-900 dark:text-lime-400">Sign in to WanderLust</h5>
                    <div>
                        <label  className="block mb-2 text-sm font-sans text-gray-900 dark:text-white">Your email</label>
                        <input type="email" value={email} onChange={({target})=>(setEmail(target.value))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 bg-transparent dark:placeholder-gray-400 dark:text-white outline-none" placeholder="user@mail.com" required />
                    </div>
                    <div>
                        <label  className="block mb-2 text-sm font-sans text-gray-900 dark:text-white">Your password</label>
                        <input value={password} onChange={({target})=>(setPassword(target.value))} type="password" placeholder="••••••••" className="bg-gray-50 border-gray-300 border text-gray-900 text-sm rounded-lg block w-full p-2.5 bg-transparent dark:placeholder-gray-400 dark:text-white outline-none" required />
                    </div>
                    <div className="w-full h-full">
                    {error && <div className="text-red-500 font-sans font-medium text-sm">{error}</div>}
                    </div>
                    <button type="submit" className="w-full font-sans rounded-lg text-white text-sm px-5 py-2.5 text-center hover:bg-lime-700 hover:shadow-xl dark:bg-lime-600 outline-none">Login</button>
                    <div className="text-sm font-sans text-gray-500 dark:text-gray-300">
                        Not Registered?
                    <Link to={"/register"} className="text-lime-700 hover:underline dark:text-lime-500 cursor-pointer">Create Account</Link>
                    </div>
                </form>
            </div>
          </div>
        </div>
        </div>
    </div>
  );
};

export default Auth;
