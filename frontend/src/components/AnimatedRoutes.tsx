import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { AnimatePresence } from 'framer-motion'
import { Register } from '../pages/Register'
import { Dashboard } from '../pages/Dashboard'



export const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence>
    <Routes location={location} key={location.pathname}>
      <Route path='/' element={<Root />} />
      <Route path="/home" element={<Home />}/>
      <Route path='/login' element={<Login />}/>
      <Route path='/register' element={<Register />}/>
      <Route path='/dashboard' element={<Dashboard />} />
    </Routes>
    </AnimatePresence>
  )
}

const Root = ()=>{
  const isAuthenticated = !!localStorage.getItem('token')
  return isAuthenticated? ( <Navigate to='/dashboard' /> ) : (<Navigate to='/home' />)
}

