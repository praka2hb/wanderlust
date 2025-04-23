import { Link, useNavigate } from 'react-router-dom'
import { animateScroll as scroll } from 'react-scroll'
import ProfileInfo from './Cards/ProfileCard';
import Logo from './Logo';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = ({userInfo}:any) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    const scrollToTop = () => {
        scroll.scrollToTop();
    };

    const scrollTo = () => {
        scroll.scrollToBottom();
    };

    const onLogout = () => {
        localStorage.clear();
        navigate('/home');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="relative">
            <nav className="bg-white dark:bg-lime-500 shadow-md h-16">
                <div className="flex justify-between items-center mx-auto max-w-screen-xl p-2 h-full px-4">
                    <Link 
                        to="/dashboard" 
                        onClick={scrollToTop} 
                        className="flex items-center cursor-pointer h-6"
                    >
                        <Logo />
                    </Link>
                    
                    {/* Mobile menu button */}
                    <button 
                        className="md:hidden text-white p-2"
                        onClick={toggleMenu}
                    >
                        {isMenuOpen ? (
                            <FaTimes className="text-xl" />
                        ) : (
                            <FaBars className="text-xl" />
                        )}
                    </button>
                    
                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center space-x-6 text-white font-medium">
                        <Link to='/home' onClick={scrollTo}>About</Link>
                        <ProfileInfo onLogout={onLogout} userInfo={userInfo} />
                    </div>
                </div>
            </nav>
            
            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-lime-400 shadow-md z-10">
                    <div className="flex flex-col py-4 px-6 space-y-4 text-white font-medium">
                        <Link 
                            to='/home' 
                            onClick={() => {
                                scrollTo();
                                setIsMenuOpen(false);
                            }}
                            className="py-2"
                        >
                            About
                        </Link>
                        <div className="py-2">
                            <ProfileInfo 
                                onLogout={() => {
                                    onLogout();
                                    setIsMenuOpen(false);
                                }} 
                                userInfo={userInfo} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;