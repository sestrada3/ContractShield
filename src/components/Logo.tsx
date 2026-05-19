// Replace with actual logo image when available
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 0L0 6V18C0 27.6 7.2 36 16 36C24.8 36 32 27.6 32 18V6L16 0Z" fill="#F59E0B" />
        <path d="M16 4L4 9V18C4 25.2 9.6 32 16 32C22.4 32 28 25.2 28 18V9L16 4Z" fill="#0F1F38" />
        <path d="M22 13L14 21L10 17" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-white">
        Contract<span className="text-gold-500">Shield</span>
      </span>
    </div>
  );
}
