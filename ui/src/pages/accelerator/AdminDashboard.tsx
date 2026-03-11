// EVA-STORY: F46-01-006
// EVA-FEATURE: F46-01
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import {
  Badge,
  Card,
  CardHeader,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import {
  BuildingRegular,
  CalendarRegular,
  ChartMultipleRegular,
  MoneyRegular,
  ArrowTrendingRegular,
} from '@fluentui/react-icons'
import type { Booking, EntrySurvey, ExitSurvey } from '@/lib/types'
import { WORKSPACES } from '@/lib/constants'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  statLabel: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  statValue: {
    fontSize: '30px',
    fontWeight: 700,
    lineHeight: '36px',
  },
  statHint: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  utilizationRow: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  utilizationTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  workspaceInfo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  tableWrap: {
    overflowX: 'auto',
  },
  right: {
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    ...shorthands.padding('24px', '0'),
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
})

export default function AdminDashboard() {
  const [bookings] = useLocalStorageState<Booking[]>('bookings', [])
  const [entrySurveys] = useLocalStorageState<EntrySurvey[]>('entry-surveys', [])
  const [exitSurveys] = useLocalStorageState<ExitSurvey[]>('exit-surveys', [])
  const styles = useStyles()

  const allBookings = bookings || []
  const activeBookings = allBookings.filter(b => b.status === 'active')
  const completedBookings = allBookings.filter(b => b.status === 'completed')
  const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalCost, 0)
  const completionRate = allBookings.length > 0 
    ? Math.round((completedBookings.length / allBookings.length) * 100) 
    : 0
  const entrySurveyCount = (entrySurveys || []).length

  const getWorkspaceName = (workspaceId: string) => {
    return WORKSPACES.find(w => w.id === workspaceId)?.name || 'Unknown'
  }

  const getWorkspaceUtilization = () => {
    return WORKSPACES.map(workspace => {
      const workspaceBookings = allBookings.filter(b => b.workspaceId === workspace.id)
      const activeCount = workspaceBookings.filter(b => b.status === 'active').length
      const utilization = Math.round((activeCount / workspace.capacity) * 100)
      return {
        ...workspace,
        activeBookings: activeCount,
        utilization
      }
    })
  }

  const getAverageSatisfaction = () => {
    const surveys = exitSurveys || []
    if (surveys.length === 0) return 0
    const total = surveys.reduce((sum, s) => sum + s.rating, 0)
    return (total / surveys.length).toFixed(1)
  }

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <Title3>Admin Dashboard</Title3>
        <Text className={styles.subtitle}>Monitor workspace utilization and system metrics</Text>
      </div>

      <div className={styles.statGrid}>
        <Card>
          <CardHeader className={styles.statTop}>
            <Text className={styles.statLabel}>Total Bookings</Text>
            <CalendarRegular fontSize={20} />
          </CardHeader>
          <div className={styles.cardBody}>
            <Text className={styles.statValue}>{allBookings.length}</Text>
            <div>
              <Badge appearance="tint" size="small">
                {activeBookings.length} active
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className={styles.statTop}>
            <Text className={styles.statLabel}>Total Revenue</Text>
            <MoneyRegular fontSize={20} />
          </CardHeader>
          <div className={styles.cardBody}>
            <Text className={styles.statValue}>${totalRevenue}</Text>
            <Text className={styles.statHint}>Cost recovery tracked</Text>
          </div>
        </Card>

        <Card>
          <CardHeader className={styles.statTop}>
            <Text className={styles.statLabel}>Completion Rate</Text>
            <ChartMultipleRegular fontSize={20} />
          </CardHeader>
          <div className={styles.cardBody}>
            <Text className={styles.statValue}>{completionRate}%</Text>
            <Text className={styles.statHint}>{completedBookings.length} completed</Text>
          </div>
        </Card>

        <Card>
          <CardHeader className={styles.statTop}>
            <Text className={styles.statLabel}>Avg Satisfaction</Text>
            <ArrowTrendingRegular fontSize={20} />
          </CardHeader>
          <div className={styles.cardBody}>
            <Text className={styles.statValue}>{getAverageSatisfaction()}</Text>
            <Text className={styles.statHint}>Out of 5.0 ({entrySurveyCount} entry surveys)</Text>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Text weight="semibold">
            <BuildingRegular fontSize={18} /> Workspace Utilization
          </Text>
        </CardHeader>
        <div className={styles.cardBody}>
            {getWorkspaceUtilization().map((workspace) => (
              <div key={workspace.id} className={styles.utilizationRow}>
                <div className={styles.utilizationTop}>
                  <div className={styles.workspaceInfo}>
                    <Text>{workspace.name}</Text>
                    <Badge appearance="outline" size="small">
                      {workspace.activeBookings}/{workspace.capacity}
                    </Badge>
                  </div>
                  <Text weight="semibold">{workspace.utilization}%</Text>
                </div>
                <ProgressBar value={Math.min(workspace.utilization, 100) / 100} />
              </div>
            ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <Text weight="semibold">
            <CalendarRegular fontSize={18} /> Recent Bookings
          </Text>
        </CardHeader>
        <div className={styles.cardBody}>
          {allBookings.length === 0 ? (
            <Text className={styles.empty}>No bookings yet</Text>
          ) : (
            <div className={styles.tableWrap}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>User</TableHeaderCell>
                    <TableHeaderCell>Workspace</TableHeaderCell>
                    <TableHeaderCell>Period</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className={styles.right}>Cost</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBookings.slice(-10).reverse().map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <TableCellLayout>{booking.userName}</TableCellLayout>
                      </TableCell>
                      <TableCell>{getWorkspaceName(booking.workspaceId)}</TableCell>
                      <TableCell>
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance={booking.status === 'active' ? 'filled' : booking.status === 'completed' ? 'tint' : 'outline'}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={styles.right}>${booking.totalCost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
