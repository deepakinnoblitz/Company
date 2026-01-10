import type { Estimation } from 'src/api/estimation';

import { useState, useEffect } from 'react';

import { fetchEstimations } from 'src/api/estimation';

export function useEstimations(
    page: number,
    rowsPerPage: number,
    search: string
) {
    const [data, setData] = useState<Estimation[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [trigger, setTrigger] = useState(0);

    const refetch = () => setTrigger((prev) => prev + 1);

    useEffect(() => {
        setLoading(true);

        fetchEstimations({
            page: page + 1, // Frappe pages start from 1
            page_size: rowsPerPage,
            search,
        })
            .then((res) => {
                setData(res.data);
                setTotal(res.total);
            })
            .catch((err) => {
                console.error("Failed to fetch estimations", err);
                setData([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page, rowsPerPage, search, trigger]);

    return { data, total, loading, refetch };
}
