import { useState, useEffect, useCallback } from 'react';

import { fetchExpenses } from 'src/api/expenses';

export function useExpenses(page: number, pageSize: number, search: string, orderBy?: string, order?: 'asc' | 'desc') {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchExpenses({
                page,
                page_size: pageSize,
                search,
                orderBy,
                order
            });
            setData(result.data);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, orderBy, order]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, total, loading, refetch };
}
