import { useState, useEffect, useCallback } from 'react';

import { fetchSalarySlips } from 'src/api/salary-slips';

export function useSalarySlips(
    page: number,
    page_size: number,
    search: string,
    order_by?: string,
    order?: 'asc' | 'desc'
) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchSalarySlips({
                page,
                page_size,
                search,
                order_by,
                order,
            });
            setData(result.data);
            setTotal(result.total);
            setError(null);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [page, page_size, search, order_by, order]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, total, loading, error, refetch };
}
