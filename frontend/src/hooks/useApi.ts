import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query'
import axios from 'axios'

// ─── Error helper ─────────────────────────────────────────────────────────────
export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    return data?.error ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}

// ─── useApi ───────────────────────────────────────────────────────────────────
/**
 * Generic query hook wrapping TanStack Query.
 *
 * @example
 * const { data, isLoading, error } = useApi(
 *   QUERY_KEYS.tasks,
 *   () => tasksApi.getTasks()
 * )
 */
export function useApi<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error, TData, QueryKey>({
    queryKey,
    queryFn,
    ...options,
  })
}

// ─── useApiMutation ───────────────────────────────────────────────────────────
/**
 * Generic mutation hook wrapping TanStack Query useMutation.
 * Automatically invalidates provided query keys on success.
 *
 * @example
 * const { mutate, isPending } = useApiMutation(
 *   (data: CreateTaskInput) => tasksApi.createTask(data),
 *   { invalidateKeys: [QUERY_KEYS.tasks] }
 * )
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateKeys?: QueryKey[]
  }
) {
  const queryClient = useQueryClient()
  const { invalidateKeys, onSuccess, ...restOptions } = options ?? {}

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key as readonly unknown[] })
        })
      }
      onSuccess?.(data, variables, context)
    },
    ...restOptions,
  })
}
