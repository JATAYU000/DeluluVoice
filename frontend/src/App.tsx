import { Routes, Route } from 'react-router-dom';
import { TapeProvider } from './context/TapeContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Generate from './pages/Generate';
import Checkout from './pages/Checkout';

function App() {
  return (
    <TapeProvider>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </div>
    </TapeProvider>
  );
}

export default App;
