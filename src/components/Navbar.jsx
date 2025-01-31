import { Link } from 'react-router-dom'
import smallLogo from '../assets/small_logo.png'

function Navbar() {
  return (
    <nav className="bg-[#2D7EFF] p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <img src={smallLogo} alt="Logo" className="h-8 w-auto" />
          <Link 
            to="/" 
            className="text-white text-2xl font-bold"
          >
            Big Verve
          </Link>
          
          <div className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className="text-white/90 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/games" 
              className="text-white/90 hover:text-white transition-colors font-medium"
            >
              Games
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-6 rounded-full transition-all">
            Sign Up
          </button>
          <button className="bg-[#FF4D00] hover:bg-[#FF6B2C] text-white font-medium py-2 px-6 rounded-full transition-all">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 