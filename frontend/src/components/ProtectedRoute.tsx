import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ role }: { role: string }) {
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

    // Si no hay token → al login
    if (!token || !userInfo.rol) return <Navigate to="/login" replace />;

    // Si el rol NO coincide → al login
    if (userInfo.rol !== role) return <Navigate to="/login" replace />;

    // Todo OK → renderiza las rutas internas
    return <Outlet />;
}
