import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fNumber, fPercent, fShortenNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total: number;
  percent: number;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function AnalyticsWidgetSummary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  ...other
}: Props) {
  const theme = useTheme();

  const chartColors = [theme.palette[color].main];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    xaxis: { categories: chart.categories },
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    markers: {
      strokeWidth: 0,
    },
    ...chart.options,
  });

  const renderTrending = () => (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 0.75,
        typography: 'subtitle2',
        color: percent < 0 ? 'error.main' : 'success.main',
        bgcolor: alpha(percent < 0 ? theme.palette.error.main : theme.palette.success.main, 0.08),
      }}
    >
      <Iconify width={16} icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />
      <Box component="span">
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
    </Stack>
  );

  return (
    <Card
      sx={[
        {
          p: 3,
          boxShadow: (t) => t.customShadows?.card,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          overflow: 'hidden',
          '&:before': {
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            content: "''",
            position: 'absolute',
            zIndex: 1,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.01)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
          }
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.25,
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
            zIndex: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ zIndex: 2 }}>
          {renderTrending()}
        </Box>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          zIndex: 2,
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 'medium' }}>
            {title}
          </Typography>

          <Typography variant="h3" sx={{ fontWeight: 'fontWeightBold' }}>
            {fShortenNumber(total)}
          </Typography>
        </Box>

        <Chart
          type="line"
          series={[{ data: chart.series }]}
          options={chartOptions}
          sx={{ width: '40%', height: 60 }}
        />
      </Box>
    </Card>
  );
}
