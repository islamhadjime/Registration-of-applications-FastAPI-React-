import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createRequest,
  deleteRequest,
  fetchRequests,
  updateRequestStatus,
} from "@/api";
import { AppHeader } from "@/components/layout/AppHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import type {
  PaginatedRequests,
  Request,
  RequestPriority,
  RequestStatus,
  SortField,
  SortOrder,
} from "@/types";
import {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { timeZone: "UTC" }) + " UTC";
}

function statusVariant(status: RequestStatus): "default" | "secondary" | "outline" {
  if (status === "done") return "secondary";
  if (status === "in_progress") return "outline";
  return "default";
}

function priorityVariant(priority: RequestPriority): "default" | "secondary" | "destructive" {
  if (priority === "high") return "destructive";
  if (priority === "low") return "secondary";
  return "default";
}

function RequestsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-32 md:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="hidden h-4 w-28 lg:block" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

function CreateFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | "all">("all");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [data, setData] = useState<PaginatedRequests | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPriority, setCreatePriority] = useState<RequestPriority>("normal");
  const [createLoading, setCreateLoading] = useState(false);

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateDesc("");
    setCreatePriority("normal");
  };

  const loadRequests = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const result = await fetchRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      });
      setData(result);
      if (result.page > result.total_pages && result.total_pages > 0) {
        setPage(result.total_pages);
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Ошибка загрузки");
      setData(null);
    } finally {
      setListLoading(false);
    }
  }, [statusFilter, priorityFilter, search, sortBy, sortOrder, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await createRequest({
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
        priority: createPriority,
      });
      resetCreateForm();
      setCreateOpen(false);
      setPage(1);
      toast.success("Заявка создана");
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка создания");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: RequestStatus) => {
    try {
      const updated = await updateRequestStatus(id, status);
      toast.success("Статус обновлён");
      setDetailRequest((prev) => (prev?.id === id ? updated : prev));
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка изменения статуса");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить заявку?")) return;
    try {
      await deleteRequest(id);
      toast.success("Заявка удалена");
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Заявки</h1>
            <p className="text-sm text-muted-foreground">
              Создавайте, фильтруйте и управляйте внутренними заявками
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <Plus />
            Создать заявку
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Список заявок</CardTitle>
                <CardDescription>
                  {listLoading ? (
                    <Skeleton className="mt-1 h-4 w-24" />
                  ) : (
                    `Всего: ${data?.total ?? 0}`
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadRequests} disabled={listLoading}>
                <RefreshCw className={listLoading ? "animate-spin" : ""} />
                Обновить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск по заголовку и описанию"
                  className="pl-8"
                  disabled={listLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={listLoading}>
                  Найти
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters} disabled={listLoading}>
                  Сбросить
                </Button>
              </div>
            </form>

            {!listLoading && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v as RequestStatus | "all");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select
                    value={priorityFilter}
                    onValueChange={(v) => {
                      setPriorityFilter(v as RequestPriority | "all");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Сортировка</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => {
                      setSortBy(v as SortField);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">По дате</SelectItem>
                      <SelectItem value="priority">По приоритету</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Порядок</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(v) => {
                      setSortOrder(v as SortOrder);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">По убыванию</SelectItem>
                      <SelectItem value="asc">По возрастанию</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            {listError && (
              <Alert variant="destructive">
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            )}

            {listLoading ? (
              <RequestsTableSkeleton />
            ) : !data || data.items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">Заявок не найдено</p>
                <Button variant="link" className="mt-2" onClick={() => setCreateOpen(true)}>
                  Создать первую заявку
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ID</TableHead>
                        <TableHead className="w-[26%] min-w-[140px]">Заголовок</TableHead>
                        <TableHead className="hidden w-[30%] min-w-[160px] md:table-cell">
                          Описание
                        </TableHead>
                        <TableHead className="w-[100px]">Статус</TableHead>
                        <TableHead className="w-[100px]">Приоритет</TableHead>
                        <TableHead className="hidden w-[140px] lg:table-cell">Создана</TableHead>
                        <TableHead className="w-[180px] text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => {
                        const isDone = item.status === "done";
                        return (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer"
                            onClick={() => setDetailRequest(item)}
                          >
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.id}
                            </TableCell>
                            <TableCell
                              className="max-w-0 truncate font-medium hover:text-primary"
                              title={item.title}
                            >
                              {item.title}
                            </TableCell>
                            <TableCell
                              className="hidden max-w-0 truncate text-muted-foreground md:table-cell"
                              title={item.description || undefined}
                            >
                              {item.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(item.status)}>
                                {STATUS_LABELS[item.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={priorityVariant(item.priority)}>
                                {PRIORITY_LABELS[item.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                              {formatDate(item.created_at)}
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <Select
                                  value={item.status}
                                  disabled={isDone}
                                  onValueChange={(v) =>
                                    handleStatusChange(item.id, v as RequestStatus)
                                  }
                                >
                                  <SelectTrigger size="sm" className="w-[130px]">
                                    <SelectValue>{STATUS_LABELS[item.status]}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {isAdmin && (
                                  <Button
                                    variant="destructive"
                                    size="icon-xs"
                                    disabled={isDone}
                                    onClick={() => handleDelete(item.id)}
                                    title={isDone ? "Заявку в done нельзя удалять" : "Удалить"}
                                  >
                                    <Trash2 />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Страница {data.page} из {data.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft />
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Вперёд
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать заявку</DialogTitle>
            <DialogDescription>
              Заполните форму — заявка сразу появится в общем списке
            </DialogDescription>
          </DialogHeader>

          {createLoading ? (
            <CreateFormSkeleton />
          ) : (
            <form id="create-request-form" onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-title">Заголовок *</Label>
                <Input
                  id="modal-title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="От 3 до 120 символов"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select
                  value={createPriority}
                  onValueChange={(v) => setCreatePriority(v as RequestPriority)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-description">Описание</Label>
                <Textarea
                  id="modal-description"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Необязательно, до 1000 символов"
                />
              </div>
            </form>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Отмена
            </Button>
            <Button type="submit" form="create-request-form" disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus />
                  Создать
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailRequest !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRequest(null);
        }}
      >
        {detailRequest && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="pr-8 leading-snug">{detailRequest.title}</DialogTitle>
              <DialogDescription>Заявка #{detailRequest.id}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Статус">
                <Badge variant={statusVariant(detailRequest.status)}>
                  {STATUS_LABELS[detailRequest.status]}
                </Badge>
              </DetailField>
              <DetailField label="Приоритет">
                <Badge variant={priorityVariant(detailRequest.priority)}>
                  {PRIORITY_LABELS[detailRequest.priority]}
                </Badge>
              </DetailField>
              <DetailField label="Создана">
                {formatDate(detailRequest.created_at)}
              </DetailField>
              <DetailField label="Обновлена">
                {formatDate(detailRequest.updated_at)}
              </DetailField>
            </div>

            <Separator />

            <DetailField label="Описание">
              <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                {detailRequest.description || "Описание не указано"}
              </p>
            </DetailField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDetailRequest(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
