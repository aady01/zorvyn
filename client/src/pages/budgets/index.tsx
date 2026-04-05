import { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget } from '@/hooks/useBudgets';
import { useTeams } from '@/hooks/useTeams';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBudgetSchema, type CreateBudgetFormData } from '@/validations/budget.schema';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import type { Budget } from '@/types';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function BudgetFormDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget?: Budget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { data: teamsData } = useTeams({ limit: 100 });
  const isEdit = !!budget;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBudgetFormData>({
    resolver: zodResolver(createBudgetSchema),
    values: budget
      ? {
        totalBudget: budget.totalBudget,
        period: budget.period,
        teamId: budget.teamId,
      }
      : {
        totalBudget: 0,
        period: new Date().toISOString().slice(0, 7),
        teamId: '',
      },
  });

  const isPending = createBudget.isPending || updateBudget.isPending;

  const onSubmit = (data: CreateBudgetFormData) => {
    if (isEdit) {
      updateBudget.mutate(
        { id: budget.id, data: { totalBudget: data.totalBudget } },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          },
        }
      );
    } else {
      createBudget.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Budget' : 'New Budget'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="totalBudget">Budget Amount</Label>
            <Input
              id="totalBudget"
              type="number"
              step="0.01"
              placeholder="10000"
              {...register('totalBudget', { valueAsNumber: true })}
            />
            {errors.totalBudget && (
              <p className="text-xs text-destructive">{errors.totalBudget.message}</p>
            )}
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="period">Period (YYYY-MM)</Label>
                <Input
                  id="period"
                  type="month"
                  {...register('period')}
                />
                {errors.period && (
                  <p className="text-xs text-destructive">{errors.period.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={watch('teamId')} onValueChange={(val) => setValue('teamId', val ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamsData?.data?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamId && (
                  <p className="text-xs text-destructive">{errors.teamId.message}</p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BudgetsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | undefined>();

  const { data, isLoading } = useBudgets({ page, limit: 20 });

  const handleEdit = (budget: Budget) => {
    setEditBudget(budget);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditBudget(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Manage team budgets and track utilization
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          description="Create a budget to start tracking team spending."
          action={
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Budget
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((budget) => {
              const utilization = budget.totalBudget > 0
                ? Math.round((budget.usedAmount / budget.totalBudget) * 100)
                : 0;
              const isOver = budget.usedAmount > budget.totalBudget;

              return (
                <Card key={budget.id} className="relative group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-sm">{budget.team?.name ?? 'Unknown Team'}</p>
                        <p className="text-xs text-muted-foreground">{budget.period}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEdit(budget)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Progress
                        value={Math.min(utilization, 100)}
                        className={cn(
                          'h-2',
                          isOver
                            ? '[&>div]:bg-red-500'
                            : utilization > 80
                              ? '[&>div]:bg-amber-500'
                              : '[&>div]:bg-emerald-500'
                        )}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={cn(
                          'font-semibold',
                          isOver ? 'text-red-600 dark:text-red-400' : utilization > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {utilization}% used
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.usedAmount)} / {formatCurrency(budget.totalBudget)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <BudgetFormDialog budget={editBudget} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
