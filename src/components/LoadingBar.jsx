export default function LoadingBar({ label = "Carga en curso" }) {
  return <span className="loading-bar" role="progressbar" aria-label={label}><span className="loading-bar__fill" /></span>;
}
