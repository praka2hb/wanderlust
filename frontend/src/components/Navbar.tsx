import { Link, useNavigate } from 'react-router-dom'
import { animateScroll as scroll } from 'react-scroll'
import ProfileInfo from './Cards/ProfileCard';
import Logo from './Logo';



const Navbar = ({userInfo}:any) => {
    const navigate = useNavigate()
    const scrollToTop = () => {
        scroll.scrollToTop();
      };

    const scrollTo = ()=>{
        scroll.scrollToBottom()
    }

    const onLogout = ()=>{
        localStorage.clear()
        navigate('/home')
    }
    return (
    <div>
        <nav className="bg-white border-gray-200 dark:bg-lime-500 h-16">
            <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl p-2 h-full">
                <Link to="/dashboard" onClick={scrollToTop} className="ml-4 flex items-center cursor-pointer h-6 ">
                <Logo />
                </Link>
                <div className="flex items-center space-x-6 rtl:space-x-reverse text-white font-medium pr-6">
                    <Link to='/home' onClick={scrollTo} >About</Link>
                    <ProfileInfo onLogout={onLogout} userInfo={userInfo} />
                </div>
            </div>
        </nav>
    </div>
  )
}

export default Navbar