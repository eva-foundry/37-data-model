// EVA-STORY: F46-01-005
// EVA-STORY: F46-05-003
// EVA-FEATURE: F46-01 F46-05
import { useState } from 'react'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardFooter,
  Text,
  Title3,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import {
  CalendarRegular,
  PeopleRegular,
  ReceiptRegular,
  ClipboardTaskRegular,
} from '@fluentui/react-icons'
import type { Booking } from '@/lib/types'
import { WORKSPACES } from '@/lib/constants'
import ExitSurveyDialog from './ExitSurveyDialog'
import TeamManagementDialog from './TeamManagementDialog'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('64px', '24px'),
    ...shorthands.gap('12px'),
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shorthands.gap('16px'),
  },
  cardTopLeft: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    flex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  dates: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
  costBlock: {
    textAlign: 'right',
  },
  costLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  costValue: {
    color: tokens.colorBrandForeground1,
    fontWeight: 700,
    fontSize: '20px',
  },
  metaBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
  },
})

export default function MyBookings() {
  const [bookings] = useLocalStorageState<Booking[]>('bookings', [])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [exitSurveyOpen, setExitSurveyOpen] = useState(false)
  const [teamManagementOpen, setTeamManagementOpen] = useState(false)
  const styles = useStyles()

  const userBookings = (bookings || []).filter(b => b.userId === 'current-user')

  const getWorkspace = (workspaceId: string) => {
    return WORKSPACES.find(w => w.id === workspaceId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge appearance="filled" color="success">Active</Badge>
      case 'pending':
        return <Badge appearance="outline">Pending</Badge>
      case 'completed':
        return <Badge appearance="tint">Completed</Badge>
      case 'cancelled':
        return <Badge appearance="filled" color="danger">Cancelled</Badge>
      default:
        return <Badge appearance="outline">{status}</Badge>
    }
  }

  const handleExitSurvey = (booking: Booking) => {
    setSelectedBooking(booking)
    setExitSurveyOpen(true)
  }

  const handleTeamManagement = (booking: Booking) => {
    setSelectedBooking(booking)
    setTeamManagementOpen(true)
  }

  if (userBookings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <CalendarRegular fontSize={40} />
        </div>
        <Title3>No Bookings Yet</Title3>
        <Text align="center" className={styles.subtitle}>
          You haven't made any workspace reservations. Browse available workspaces to get started.
        </Text>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3>My Bookings</Title3>
        <Text className={styles.subtitle}>Manage your workspace reservations and team access</Text>
      </div>

      <div className={styles.root}>
        {userBookings.map((booking) => {
          const workspace = getWorkspace(booking.workspaceId)
          if (!workspace) return null

          return (
            <Card key={booking.id}>
              <CardHeader>
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.titleRow}>
                      <Text size={500} weight="semibold">{workspace.name}</Text>
                      {getStatusBadge(booking.status)}
                    </div>
                    <Text className={styles.dates}>
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </Text>
                  </div>
                  <div className={styles.costBlock}>
                    <Text className={styles.costLabel}>Total Cost</Text>
                    <Text className={styles.costValue}>${booking.totalCost}</Text>
                  </div>
                </div>
              </CardHeader>

              <CardFooter className={styles.cardContent}>
                <div className={styles.metaBadges}>
                  {booking.entrySurveyCompleted && (
                    <Badge appearance="outline" icon={<ClipboardTaskRegular fontSize={14} />}>
                      Entry Survey Complete
                    </Badge>
                  )}
                  {booking.exitSurveyCompleted && (
                    <Badge appearance="outline" icon={<ReceiptRegular fontSize={14} />}>
                      Exit Survey Complete
                    </Badge>
                  )}
                </div>

                <div className={styles.actions}>
                  {booking.status === 'active' && (
                    <>
                      <Button
                        appearance="outline"
                        onClick={() => handleTeamManagement(booking)}
                        icon={<PeopleRegular />}
                      >
                        Manage Team
                      </Button>
                      {!booking.exitSurveyCompleted && (
                        <Button
                          appearance="outline"
                          onClick={() => handleExitSurvey(booking)}
                          icon={<ClipboardTaskRegular />}
                        >
                          Complete Exit Survey
                        </Button>
                      )}
                    </>
                  )}
                  {booking.exitSurveyCompleted && (
                    <Button
                      appearance="outline"
                      icon={<ReceiptRegular />}
                    >
                      View Receipt
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {selectedBooking && (
        <>
          <ExitSurveyDialog
            booking={selectedBooking}
            open={exitSurveyOpen}
            onOpenChange={setExitSurveyOpen}
          />
          <TeamManagementDialog
            booking={selectedBooking}
            open={teamManagementOpen}
            onOpenChange={setTeamManagementOpen}
          />
        </>
      )}
    </div>
  )
}
