import type { Lead } from 'src/api/leads';

import { useState, useEffect } from 'react';

import { fetchLeads } from 'src/api/leads';

export function useLeads(
    page: number,
    rowsPerPage: number,
    search: string,
    status?: string
) {
    const [data, setData] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [trigger, setTrigger] = useState(0);

    const refetch = () => setTrigger((prev) => prev + 1);

    useEffect(() => {
        setLoading(true);

        fetchLeads({
            page: page + 1, // Frappe pages start from 1
            page_size: rowsPerPage,
            search,
            status,
        })
            .then((res) => {
                setData(res.data);
                setTotal(res.total);
            })
            .catch((err) => {
                console.error("Failed to fetch leads", err);
                setData([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page, rowsPerPage, search, status, trigger]);

    return { data, total, loading, refetch };
}
