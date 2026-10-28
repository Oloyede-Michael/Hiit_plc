import { Route, Routes, Navigate } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Submit from './pages/Submit.jsx';
import SubmitSuccess from './pages/SubmitSuccess.jsx';
import Track from './pages/Track.jsx';
import TrackResult from './pages/TrackResult.jsx';
import Privacy from './pages/Privacy.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Complaints from './pages/admin/Complaints.jsx';
import ComplaintDetail from './pages/admin/ComplaintDetail.jsx';
import Categories from './pages/admin/Categories.jsx';
import Settings from './pages/admin/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/submit/success" element={<SubmitSuccess />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:ref" element={<TrackResult />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
