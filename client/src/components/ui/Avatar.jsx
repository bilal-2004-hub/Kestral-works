import { initials } from '../../utils/format.js';

export default function Avatar({ name = '', src, size = 36 }) {
  if (src) {
    return <img src={src} alt="" width={size} height={size} loading="lazy" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full bg-marine-800 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
