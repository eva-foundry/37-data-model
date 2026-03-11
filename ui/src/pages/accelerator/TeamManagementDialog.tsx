// EVA-STORY: F46-01-004
// EVA-STORY: F46-05-005
// EVA-FEATURE: F46-01 F46-05
import { useState } from 'react'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Select,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import {
  AddRegular,
  DeleteRegular,
  DocumentTextRegular,
  LockClosedRegular,
  ShieldRegular,
} from '@fluentui/react-icons'
import type { Booking, TeamMember, UserRole } from '@/lib/types'
import { ROLE_DESCRIPTIONS } from '@/lib/constants'

interface TeamManagementDialogProps {
  booking: Booking
  open: boolean
  onOpenChange: (open: boolean) => void
}

const useStyles = makeStyles({
  dialogSurface: {
    width: 'min(860px, calc(100vw - 24px))',
  },
  content: {
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('18px'),
  },
  sectionCard: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('12px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
  },
  helperText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('10px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  memberMain: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  memberMeta: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  memberName: {
    fontWeight: 600,
  },
  memberEmail: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  memberActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  empty: {
    textAlign: 'center',
    ...shorthands.padding('24px', '0'),
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
})

export default function TeamManagementDialog({ booking, open, onOpenChange }: TeamManagementDialogProps) {
  const [teamMembers, setTeamMembers] = useLocalStorageState<Record<string, TeamMember[]>>('team-members', {})

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('reader')
  const styles = useStyles()

  const members = teamMembers?.[booking.id] || []

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <ShieldRegular fontSize={14} />
      case 'contributor':
        return <DocumentTextRegular fontSize={14} />
      case 'reader':
        return <LockClosedRegular fontSize={14} />
    }
  }

  const getRoleBadgeAppearance = (role: UserRole): 'filled' | 'outline' | 'tint' => {
    switch (role) {
      case 'admin':
        return 'filled'
      case 'contributor':
        return 'tint'
      case 'reader':
        return 'outline'
    }
  }

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      window.alert('Please enter both name and email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      window.alert('Please enter a valid email address')
      return
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      addedAt: new Date().toISOString()
    }

    setTeamMembers((current) => ({
      ...(current || {}),
      [booking.id]: [...(current?.[booking.id] || []), newMember]
    }))

    window.alert(`${newMemberName} added to team as ${newMemberRole}`)
    setNewMemberName('')
    setNewMemberEmail('')
    setNewMemberRole('reader')
  }

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers((current) => ({
      ...(current || {}),
      [booking.id]: (current?.[booking.id] || []).filter(m => m.id !== memberId)
    }))
    window.alert('Team member removed')
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>Team Management</DialogTitle>
          <DialogContent className={styles.content}>
            <Text>Add team members and assign roles to control workspace access</Text>

          <div className={styles.sectionCard}>
            <Text weight="semibold">Add Team Member</Text>

            <div className={styles.formGrid}>
              <Field label="Name">
                <Input
                  id="member-name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Full name"
                />
              </Field>

              <Field label="Email">
                <Input
                  id="member-email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </Field>
            </div>

            <Field label="Role">
              <Select
                id="member-role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
              >
                <option value="reader">Reader</option>
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </Select>
              <Text className={styles.helperText}>{ROLE_DESCRIPTIONS[newMemberRole]}</Text>
            </Field>

            <Button appearance="primary" onClick={handleAddMember} icon={<AddRegular />}>
              Add Team Member
            </Button>
          </div>

          <div className={styles.sectionCard}>
            <Text weight="semibold">Team Members ({members.length})</Text>
            
            {members.length === 0 ? (
              <div className={styles.empty}>
                No team members added yet. Add members to collaborate on this workspace.
              </div>
            ) : (
              <div className={styles.memberList}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={styles.memberRow}
                  >
                    <div className={styles.memberMain}>
                      <Avatar name={member.name} color="brand" />
                      <div className={styles.memberMeta}>
                        <Text className={styles.memberName}>{member.name}</Text>
                        <Text className={styles.memberEmail}>{member.email}</Text>
                      </div>
                    </div>
                    
                    <div className={styles.memberActions}>
                      <Badge appearance={getRoleBadgeAppearance(member.role)} icon={getRoleIcon(member.role)}>
                        {member.role}
                      </Badge>
                      <Button
                        appearance="subtle"
                        onClick={() => handleRemoveMember(member.id)}
                        icon={<DeleteRegular />}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
