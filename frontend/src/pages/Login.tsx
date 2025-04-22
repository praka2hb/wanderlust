import { Navigate } from "react-router-dom"
import Auth from "../components/LoginForm"


export const Login = () => {
  const isAuthenticated = !!localStorage.getItem('token')
  return (
    <div className="h-screen overflow-hidden">
        <div >
          {isAuthenticated ? <Navigate to={"/dashboard"} /> : <Auth />}
        </div>
    </div>
  )
}

