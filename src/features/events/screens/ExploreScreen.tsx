import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';

export function ExploreScreen() {
  return (
    <FeaturePlaceholder
      description="This tab is ready for category filtering, search, and discovery-focused UI work."
      eyebrow="Events"
      highlights={[
        'Category chips or grid',
        'Debounced search input',
        'Filtered event result states',
      ]}
      title="Explore"
    />
  );
}
