'use client'

import { useState } from 'react'
import { Profile } from '@/types/database'
import { JWTUser } from '@/types/auth'
import ProfileView from './ProfileView'
import ProfileEditForm from './ProfileEditForm'
import { UpdateProfileResult } from '@/app/profile/actions'

interface ProfileCardProps {
  user: JWTUser
  profile: Profile | null
  updateProfileAction: (formData: FormData) => Promise<UpdateProfileResult>
}

export default function ProfileCard({
  user,
  profile,
  updateProfileAction,
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSuccess = () => {
    setIsEditing(false)
    // The page will automatically revalidate due to revalidatePath in the action
    window.location.reload()
  }

  return (
    <div className="w-full">
      {isEditing ? (
        <ProfileEditForm
          user={user}
          profile={profile}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          updateProfileAction={updateProfileAction}
        />
      ) : (
        <ProfileView user={user} profile={profile} onEdit={handleEdit} />
      )}
    </div>
  )
}
