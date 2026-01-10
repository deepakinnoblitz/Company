import { useState, useEffect } from 'react';

import { fetchReimbursementClaims } from 'src/api/reimbursement-claims';

export function useReimbursementClaims(
    page: number,
    pageSize: number,
    search: string = '',
    orderBy: string = 'date_of_expense',
    order: 'asc' | 'desc' = 'desc'
) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const refetch = async () => {
        setLoading(true);
        try {
            const result = await fetchReimbursementClaims({
                page,
                page_size: pageSize,
                search,
                orderBy,
                order,
            });
            setData(result.data);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch reimbursement claims:', error);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, search, orderBy, order]);

    return { data, total, loading, refetch };
}
