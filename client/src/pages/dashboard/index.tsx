import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSummary, useByTeam, useByCategory, useBudgetVsActual, useTrends } from '@/hooks/useAnalytics';
import { useRecords } from '@/hooks/useRecords';
import { StatCard } from '@/components/shared/stat-card';
import { TrendLine } from '@/components/charts/trend-line';
import { CategoryPie } from '@/components/charts/category-pie';
import { IncomeExpenseBar } from '@/components/charts/income-expense-bar';
import { BudgetGauge } from '@/components/charts/budget-gauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'EMPLOYEE';

  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: trends, isLoading: trendsLoading } = useTrends();
  const { data: categories, isLoading: categoriesLoading } = useByCategory();
  const { data: teamData, isLoading: teamLoading } = useByTeam();
  const { data: budgetData, isLoading: budgetLoading } = useBudgetVsActual();
  const { data: recentRecords, isLoading: recordsLoading } = useRecords({ page: 1, limit: 5 });

  const showManagerData = role === 'MANAGER' || role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Hello, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening with your finances today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={summary ? formatCurrency(summary.totalIncome) : '$0'}
          description={`${summary?.incomeCount ?? 0} transactions`}
          icon={TrendingUp}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          loading={summaryLoading}
        />
        <StatCard
          title="Total Expense"
          value={summary ? formatCurrency(summary.totalExpense) : '$0'}
          description={`${summary?.expenseCount ?? 0} transactions`}
          icon={TrendingDown}
          iconClassName="bg-red-500/10 text-red-600 dark:text-red-400"
          loading={summaryLoading}
        />
        <StatCard
          title="Net Balance"
          value={summary ? formatCurrency(summary.net) : '$0'}
          description="Income - Expenses"
          icon={DollarSign}
          iconClassName={cn(
            summary && summary.net >= 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
          loading={summaryLoading}
        />
        <StatCard
          title="Total Records"
          value={(summary?.incomeCount ?? 0) + (summary?.expenseCount ?? 0)}
          description="All time"
          icon={Activity}
          loading={summaryLoading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendLine data={trends} loading={trendsLoading} />
        <CategoryPie data={categories} loading={categoriesLoading} />
      </div>

      {/* Charts Row 2 — Manager/Admin only */}
      {showManagerData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeExpenseBar data={teamData} loading={teamLoading} />
          <BudgetGauge data={budgetData} loading={budgetLoading} />
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !recentRecords?.data || recentRecords.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">{record.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={record.type === 'INCOME' ? 'default' : 'secondary'}
                        className={cn(
                          'text-[11px] font-medium',
                          record.type === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20'
                        )}
                      >
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      'text-right text-sm font-medium tabular-nums',
                      record.type === 'INCOME'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {record.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(record.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
