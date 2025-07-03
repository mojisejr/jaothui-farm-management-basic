import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center bg-base-100 px-4 pt-16 pb-10"
      data-theme="jaothui"
    >
      {/* Hero Section */}
      <div className="flex flex-col items-center flex-grow">
        <Image
          src="/images/jaothui-logo.png"
          alt="JAOTHUI Logo"
          width={240}
          height={240}
          priority
        />
        <h1 className="text-4xl font-bold text-base-content text-center mt-8">
          ยินดีต้อนรับเข้าสู่ระบบ E-ID
        </h1>
        <p className="text-xl text-base-content text-center mt-2">ข้อมูลควาย</p>

        <p className="text-sm text-neutral text-center mt-16">
          powered by JAOTHUI
        </p>
      </div>

      {/* CTA Section */}
      <div className="w-full flex justify-center mt-8">
        <Link href="/login" className="btn btn-primary btn-lg w-full max-w-xs">
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  )
}
