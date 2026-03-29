import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';

export function HomeScreen() {
  return (
    <FeaturePlaceholder
      description="The home feed tab is scaffolded and ready for the upcoming events list, pull-to-refresh, and loading states."
      eyebrow="Events"
      highlights={[
        'Paginated upcoming events feed',
        'Shared event card component',
        'Remaining capacity indicators',
      ]}
      title="Home Feed"
    />
  );
}
