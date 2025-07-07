'use client'
import Link from 'next/link'
import { Home, PlusCircle, Bell, LogOut } from 'lucide-react'
import { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface LinkItem {
  href: string
  label: string
  icon: ElementType
}

interface ProfileLinksProps {
  hasOwnedFarm?: boolean
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
    href: '/invitations',
    label: 'คำเชิญ',
    icon: Bell,
  },
]

export default function ProfileLinks({ hasOwnedFarm = false }: ProfileLinksProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        toast.success('ออกจากระบบสำเร็จ')
        router.replace('/login')
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
    <div className="space-y-3 max-w-sm mx-auto mt-6">
      {linkItems.map(({ href, label, icon: Icon }) => {
        // Check if this is the create farm link
        const isCreateFarm = href === '/farm/create'
        const isDisabled = isCreateFarm && hasOwnedFarm
        
        if (isDisabled) {
          // Render disabled create farm button
          return (
            <div
              key={href}
              className="flex items-center gap-4 p-4 bg-base-200 rounded-lg shadow-md border opacity-60 cursor-not-allowed"
            >
              <Icon size={24} className="text-base-content/50" />
              <div className="flex-1">
                <span className="font-medium text-base-content/70 block">
                  สร้างฟาร์ม
                </span>
                <span className="text-xs text-base-content/50">
                  คุณสร้างฟาร์มแล้ว
                </span>
              </div>
            </div>
          )
        }
        
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-base-100 rounded-lg shadow-md border hover:bg-base-200 transition-colors"
          >
            <Icon size={24} className="text-primary" />
            <span className="font-medium text-base-content">
              {label}
            </span>
          </Link>
        )
      })}
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-4 p-4 bg-base-100 rounded-lg shadow-md border hover:bg-error/10 transition-colors mt-4"
        type="button"
      >
        <LogOut size={24} className="text-error" />
        <span className="font-medium text-base-content">
          {loading ? 'กำลังออก...' : 'ออกจากระบบ'}
        </span>
      </button>
    </div>
  )
}
