import { useState, useEffect, useCallback } from 'react';

import { fetchInterviews } from 'src/api/interviews';

export function useInterviews(
    page: number = 1,
    pageSize: number = 10,
    search: string = '',
    orderBy: string = 'creation',
    order: 'asc' | 'desc' = 'desc'
) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetchInterviews(page, pageSize, search, orderBy, order);
            setData(result.data);
            setTotal(result.total);
            setError(null);
        } catch (err: any) {
            setError(err);
            console.error('Failed to fetch interviews:', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, orderBy, order]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        data,
        total,
        loading,
        error,
        refetch,
    };
}
