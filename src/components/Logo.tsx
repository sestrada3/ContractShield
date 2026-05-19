import Image from 'next/image';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="https://raw.githubusercontent.com/sestrada3/ContractShield/master/assets/logo%20SMALL.png"
        alt="ContractShield"
        width={36}
        height={36}
        className="object-contain"
        unoptimized
      />
      <span className="text-xl font-bold tracking-tight text-white">
        Contract<span className="text-gold-500">Shield</span>
      </span>
    </div>
  );
}
