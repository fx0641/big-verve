import logo from '../assets/logo.png'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="container mx-auto mt-8 p-4 flex flex-col items-center relative">
      {/* Top left bubbles */}
      <div className="absolute top-[5%] left-[5%] w-8 h-8 rounded-full bg-blue-500/10 animate-float"></div>
      <div className="absolute top-[15%] left-[10%] w-4 h-4 rounded-full bg-orange-500/10 animate-float" style={{ animationDelay: '1s' }}></div>
      
      {/* Top right bubbles */}
      <div className="absolute top-[8%] right-[15%] w-6 h-6 rounded-full bg-blue-500/10 animate-float" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-[20%] right-[8%] w-5 h-5 rounded-full bg-orange-500/10 animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Bottom bubbles */}
      <div className="absolute bottom-[10%] left-[20%] w-6 h-6 rounded-full bg-blue-500/10 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-[15%] right-[15%] w-8 h-8 rounded-full bg-orange-500/10 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-[20%] left-[40%] w-4 h-4 rounded-full bg-blue-500/10 animate-float" style={{ animationDelay: '0.7s' }}></div>
      
      {/* Middle area bubbles */}
      <div className="absolute top-[40%] left-[8%] w-5 h-5 rounded-full bg-orange-500/10 animate-float" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute top-[45%] right-[10%] w-6 h-6 rounded-full bg-blue-500/10 animate-float" style={{ animationDelay: '0.3s' }}></div>
      
      <img 
        src={logo} 
        alt="Logo" 
        className="w-80 h-80 object-contain mb-8 animate-float" 
      />
      <h1 className="text-4xl font-bold">
        <span className="text-[#2D7EFF]">Welcome to </span>
        <span className="text-[#FF4D00]">Big Verve</span>
      </h1>
      <p className="mt-4 text-lg text-gray-700 max-w-2xl text-center">
        Where creativity meets energy! Join us on this exciting journey.
      </p>
      <div className="mt-8 flex gap-4">
        <button className="bg-[#2D7EFF] hover:bg-[#4C8FFF] text-white font-medium py-3 px-8 rounded-full transition-all">
          Get Started
        </button>
        <Link to="/games" className="bg-[#FF4D00] hover:bg-[#FF6B2C] text-white font-medium py-3 px-8 rounded-full transition-all">
          Games
        </Link>
      </div>
    </div>
  )
}

export default Home 