import type { CardProps } from '@mui/material/Card';
import type { TimelineItemProps } from '@mui/lab/TimelineItem';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = CardProps & {
    title?: string;
    subheader?: string;
    list: {
        name: string;
        state_from: string;
        state_to: string;
        date_and_time: string;
        change_by: string;
    }[];
};

export function LeadPipelineTimeline({ title, subheader, list, sx, ...other }: Props) {
    return (
        <Card sx={sx} {...other}>
            <CardHeader title={title} subheader={subheader} />

            {list.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Iconify icon={"solar:history-bold-duotone" as any} width={48} sx={{ color: 'text.disabled', mb: 1, opacity: 0.24 }} />
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        No state history available
                    </Typography>
                </Box>
            ) : (
                <Timeline
                    sx={{ m: 0, p: 3, [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}
                >
                    {[...list].reverse().map((item, index) => (
                        <Item key={item.name} item={item} lastItem={index === list.length - 1} />
                    ))}
                </Timeline>
            )}
        </Card>
    );
}

// ----------------------------------------------------------------------

type ItemProps = TimelineItemProps & {
    lastItem: boolean;
    item: Props['list'][number];
};

function Item({ item, lastItem, ...other }: ItemProps) {
    return (
        <TimelineItem {...other}>
            <TimelineSeparator>
                <TimelineDot color="primary" />
                {lastItem ? null : <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
                <Typography variant="subtitle2">
                    {item.state_from ? `${item.state_from} → ${item.state_to}` : `Initial State: ${item.state_to}`}
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {fDateTime(item.date_and_time)} by {item.change_by}
                </Typography>
            </TimelineContent>
        </TimelineItem>
    );
}
