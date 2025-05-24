import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Order from './pages/CourierOrders';
import Profile from './pages/Profile';

function App() {
  return (

      <Routes>
      <Route path="login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/orders" element={<Order />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
  );
}

export default App;