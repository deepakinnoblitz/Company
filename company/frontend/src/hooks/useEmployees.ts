import { useState, useEffect, useCallback } from 'react';

import { fetchEmployees } from 'src/api/hr-management';

export function useEmployees(page: number, pageSize: number, search: string, orderBy?: string, order?: 'asc' | 'desc') {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchEmployees({
                page,
                page_size: pageSize,
                search,
                orderBy,
                order
            });
            setData(result.data);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, orderBy, order]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, total, loading, refetch };
}
