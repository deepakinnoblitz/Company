import type { Deal } from 'src/api/deals';

import { useState, useEffect } from 'react';

import { fetchDeals } from 'src/api/deals';

export function useDeals(
    page: number,
    rowsPerPage: number,
    search: string,
    stage?: string
) {
    const [data, setData] = useState<Deal[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [trigger, setTrigger] = useState(0);

    const refetch = () => setTrigger((prev) => prev + 1);

    useEffect(() => {
        setLoading(true);

        fetchDeals({
            page: page + 1, // Frappe pages start from 1
            page_size: rowsPerPage,
            search,
            stage,
        })
            .then((res) => {
                if (Array.isArray(res)) {
                    setData(res);
                    setTotal(res.length);
                } else {
                    setData(res?.data || []);
                    setTotal(res?.pagination?.total || 0);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch deals", err);
                setData([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page, rowsPerPage, search, stage, trigger]);

    return { data, total, loading, refetch };
}
