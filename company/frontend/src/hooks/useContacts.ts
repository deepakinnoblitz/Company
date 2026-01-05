import { useState, useEffect, useCallback } from 'react';

import { fetchContacts } from 'src/api/contacts';

export function useContacts(page: number, pageSize: number, search?: string) {
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchContacts({ page, page_size: pageSize, search });
            // Handle different possible response structures
            if (Array.isArray(res)) {
                setData(res);
                setTotal(res.length); // If no pagination total is returned, use length
            } else if (res && typeof res === 'object' && 'data' in res) {
                setData(res.data);
                setTotal(res.pagination?.total || res.data.length);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, total, loading, refetch: fetchData };
}
