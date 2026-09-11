import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [values, setValues] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = { username: values.username.trim() ? "" : "Ingresa tu usuario.", password: values.password ? "" : "Ingresa tu contraseña." };
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) {
      document.getElementById(nextErrors.username ? "username" : "password")?.focus();
      return;
    }
    const role = login(values.username, values.password);
    if (!role) {
      setErrors({ username: "Usuario o contraseña incorrectos.", password: "Usuario o contraseña incorrectos." });
      return;
    }
    navigate(role === "asistencia" ? "/asistencia" : "/inicio", { replace: true });
  };

  return (
    <main className="login-page">
      <section className="visual-panel" aria-hidden="true">
        <div className="visual-panel__content">
          <span className="visual-panel__eyebrow"><span className="visual-panel__line" />MIGUEL</span>
          <h2>Módulo Inteligente para la Gestión Unificada del Estudiante y sus Logros</h2>
          <p>Un espacio para crecer, conectar y avanzar juntos.</p>
        </div>
      </section>
      <section className="access-panel" aria-labelledby="login-title">
        <article className="login-card">
          <header className="brand">
            <div className="brand__halo"><img className="brand__logo" src="/logo.png" alt="Logo de la I.E. Almirante Miguel Grau Seminario" /></div>
            <p className="brand__intro">Hola, soy</p><h1 id="login-title">MIGUEL</h1>
            <span className="brand__accent" aria-hidden="true" /><p className="brand__message">¡Espero que tengas un excelente día!</p>
          </header>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className={`field ${errors.username ? "is-invalid" : ""}`}>
              <label htmlFor="username">Usuario</label><div className="input-wrap"><UserRound /><input id="username" name="username" placeholder="Ingresa tu usuario" autoComplete="username" value={values.username} onChange={handleChange} aria-invalid={Boolean(errors.username)} aria-describedby="username-error" /></div>
              <p className="field__error" id="username-error" aria-live="polite">{errors.username}</p>
            </div>
            <div className={`field ${errors.password ? "is-invalid" : ""}`}>
              <div className="field__heading"><label htmlFor="password">Contraseña</label><a href="#recuperar">¿Olvidaste tu contraseña?</a></div>
              <div className="input-wrap"><LockKeyhole /><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Ingresa tu contraseña" autoComplete="current-password" value={values.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} aria-describedby="password-error" /><button className="password-toggle" type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
              <p className="field__error" id="password-error" aria-live="polite">{errors.password}</p>
            </div>
            <button className="submit-button" type="submit"><span>INGRESAR</span><ArrowRight /></button>
          </form>
          <footer className="login-card__footer"><span /><p>I.E. Almirante Miguel Grau Seminario</p><span /></footer>
        </article>
      </section>
    </main>
  );
}
