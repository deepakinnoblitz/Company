import { useState, useEffect, useCallback } from 'react';

import { fetchLeaveApplications } from 'src/api/hr-management';

export function useLeaveApplications(page: number, pageSize: number, search: string) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchLeaveApplications({
                page,
                page_size: pageSize,
                search
            });
            setData(result.data);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch leave applications:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, total, loading, refetch };
}
