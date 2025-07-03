import Image from 'next/image'

interface JaothuiLogoProps {
  className?: string
  href?: string
}

export default function JaothuiLogo({
  className = 'h-8 w-auto',
  href = '/profile',
}: JaothuiLogoProps) {
  return (
    <a href={href} className="inline-flex items-center" title="JAOTHUI">
      <Image
        src="/images/jaothui-logo.png"
        alt="JAOTHUI Logo"
        width={32}
        height={32}
        className={className}
        priority
      />
    </a>
  )
}
