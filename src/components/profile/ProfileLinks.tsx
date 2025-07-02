'use client'
import Link from 'next/link'
import { Home, PlusCircle, Settings, Users, LogOut } from 'lucide-react'
import { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface LinkItem {
  href: string
  label: string
  icon: ElementType
}

const linkItems: LinkItem[] = [
  {
    href: '/farms',
    label: 'ฟาร์มของฉัน',
    icon: Home,
  },
  {
    href: '/farm/create',
    label: 'สร้างฟาร์ม',
    icon: PlusCircle,
  },
  {
    href: '/members',
    label: 'สมาชิก',
    icon: Users,
  },
  {
    href: '/settings',
    label: 'ตั้งค่า',
    icon: Settings,
  },
]

export default function ProfileLinks() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        toast.success('ออกจากระบบสำเร็จ')
        router.push('/login')
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (_e) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-10">
      {linkItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border hover:bg-blue-50 transition"
        >
          <Icon size={28} className="text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700 text-center">
            {label}
          </span>
        </Link>
      ))}
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow border hover:bg-red-50 transition col-span-2 sm:col-span-1"
        type="button"
      >
        <LogOut size={28} className="text-red-600 mb-2" />
        <span className="text-sm font-medium text-gray-700 text-center">
          {loading ? 'กำลังออก...' : 'ออกจากระบบ'}
        </span>
      </button>
    </div>
  )
}
