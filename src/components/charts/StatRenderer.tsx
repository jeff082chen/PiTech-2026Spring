/**
 * StatRenderer
 *
 * Single entry point that dispatches a StatChartConfig to the correct renderer.
 * Import this component anywhere you need to render a chart from JSON config.
 */

import type { StatChartConfig } from '../../types';
import BigNumber        from './BigNumber';
import TwoCounter       from './TwoCounter';
import Pipeline         from './Pipeline';
import BarCompare       from './BarCompare';
import CardCompare      from './CardCompare';
import HorizontalBars   from './HorizontalBars';
import StackedBars      from './StackedBars';
import QuoteList        from './QuoteList';
import HighlightCallout from './HighlightCallout';
import GridCards        from './GridCards';
import CostCompare      from './CostCompare';
import TimelineBar      from './TimelineBar';
import LineChart        from './LineChart';
import { CUSTOM_CHART_REGISTRY } from './customRegistry';

interface Props {
  chart: StatChartConfig;
}

export default function StatRenderer({ chart }: Props) {
  switch (chart.type) {
    case 'big-number':        return <BigNumber        chart={chart} />;
    case 'two-counter':       return <TwoCounter       chart={chart} />;
    case 'pipeline':          return <Pipeline         chart={chart} />;
    case 'bar-compare':       return <BarCompare       chart={chart} />;
    case 'card-compare':      return <CardCompare      chart={chart} />;
    case 'horizontal-bars':   return <HorizontalBars   chart={chart} />;
    case 'stacked-bars':      return <StackedBars      chart={chart} />;
    case 'quote-list':        return <QuoteList        chart={chart} />;
    case 'highlight-callout': return <HighlightCallout chart={chart} />;
    case 'grid-cards':        return <GridCards        chart={chart} />;
    case 'cost-compare':      return <CostCompare      chart={chart} />;
    case 'timeline-bar':      return <TimelineBar      chart={chart} />;
    case 'line-chart':        return <LineChart        chart={chart} />;
    case 'component': {
      const Comp = CUSTOM_CHART_REGISTRY[chart.componentId];
      if (!Comp) {
        return (
          <div className="text-red-400 text-xs p-4 text-center">
            Unknown component: {chart.componentId}
          </div>
        );
      }
      return <Comp data={chart.data} />;
    }
    default: {
      const exhaustive: never = chart;
      return (
        <div className="text-red-400 text-xs p-4 text-center">
          Unknown chart type: {(exhaustive as { type: string }).type}
        </div>
      );
    }
  }
}
