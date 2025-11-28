import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos del login
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState('');
    const [clave, setClave] = useState('');
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ message: '', type: '', show: false });

    // ============================================================
    // 🔐 VERIFICAR SI YA ESTÁ LOGUEADO
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

        if (token && userInfo.rol) {
            if (userInfo.rol === 'Administrador') {
                navigate('/admin/inicio');
            } else if (userInfo.rol === 'Vigilante') {
                navigate('/vigilante/inicio');
            }
        }
    }, [navigate]);

    // ============================================================
    // 🔐 LOGIN SUBMIT
    // ============================================================
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ message: '', type: '', show: false });

        if (!rol) {
            setAlert({ message: 'Debe seleccionar un rol.', type: 'error', show: true });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:5000/login', {
                usuario,
                clave,
                rol
            });

            setAlert({ message: '✅ Inicio de sesión exitoso', type: 'success', show: true });
            setLoading(false);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_info', JSON.stringify(response.data.user));

            setTimeout(() => {
                if (rol === 'Administrador') {
                    navigate('/admin/inicio');
                } else {
                    navigate('/vigilante/inicio');
                }
            }, 500);

        } catch (err: any) {
            const errorMessage =
                err.response?.data?.error || 'Error de conexión con el servidor.';
            setAlert({ message: `❌ ${errorMessage}`, type: 'error', show: true });
            setLoading(false);
        }
    };

    // ============================================================
    // 🎨 UI DEL LOGIN
    // ============================================================
    // ... resto del código ...

    // 4. Estructura JSX
    return (
        // NUEVO WRAPPER: Contiene el fondo y centra la tarjeta
        <div className={styles.loginWrapper}>
            
            <div className={styles.loginContainer}>
                <div className={styles.logo}>
                    <img src="/img/logo.png" alt="SmartCar Logo" />
                </div>

                <h1>Bienvenido a SmartCar</h1>
                {/* ... resto del formulario igual ... */}
                <p>Inicia sesión para continuar</p>

                <form id="loginForm" onSubmit={handleLoginSubmit}>
                    {/* ... tus inputs ... */}
                    <div className={styles.formGroup}>
                        <label htmlFor="usuario">Usuario</label>
                        <input
                            type="text"
                            id="usuario"
                            name="usuario"
                            placeholder="Ingresa tu usuario"
                            required
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="clave">Contraseña</label>
                        <input
                            type="password"
                            id="clave"
                            name="clave"
                            placeholder="Ingresa tu contraseña"
                            required
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                        />
                    </div>

                    <div className={styles.roles}>
                        <label>
                            <input
                                type="radio"
                                name="rol"
                                value="Administrador"
                                checked={rol === 'Administrador'}
                                onChange={(e) => setRol(e.target.value)}
                            /> Administrador
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="rol"
                                value="Vigilante"
                                checked={rol === 'Vigilante'}
                                onChange={(e) => setRol(e.target.value)}
                            /> Vigilante
                        </label>
                    </div>

                    <button type="submit" id="btnLogin" disabled={loading}>
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>

                    <div 
                        className={`${styles.alert} ${styles[alert.type]} ${alert.show ? styles.show : ''}`}
                    >
                        {alert.message}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;