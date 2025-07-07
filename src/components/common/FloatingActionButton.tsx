import Link from 'next/link'
import { Plus, Users, Calendar, ClockIcon } from 'lucide-react'

interface FloatingActionButtonProps {
  activeTab: 'animals' | 'activities' | 'schedules'
  farmId: string
}

export default function FloatingActionButton({
  activeTab,
  farmId,
}: FloatingActionButtonProps) {
  const config = {
    animals: {
      icon: Users,
      label: 'เพิ่มสัตว์',
      href: `/animal/create?farmId=${farmId}`,
      bgColor: 'bg-primary',
      hoverColor: 'hover:bg-primary-focus',
    },
    activities: {
      icon: Calendar,
      label: 'เพิ่มกิจกรรม',
      href: `/activity/create?farmId=${farmId}`,
      bgColor: 'bg-secondary',
      hoverColor: 'hover:bg-secondary-focus',
    },
    schedules: {
      icon: ClockIcon,
      label: 'เพิ่มกำหนดการ',
      href: `/schedule/create?farmId=${farmId}`,
      bgColor: 'bg-accent',
      hoverColor: 'hover:bg-accent-focus',
    },
  }

  const currentConfig = config[activeTab]
  const Icon = currentConfig.icon

  return (
    <Link
      href={currentConfig.href}
      className={`
        btn btn-circle btn-lg shadow-lg
        ${currentConfig.bgColor} ${currentConfig.hoverColor}
        text-white border-none
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
      `}
      aria-label={currentConfig.label}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <Plus className="w-5 h-5 absolute opacity-30" />
        <Icon className="w-5 h-5 relative z-10" />
      </div>
    </Link>
  )
}
