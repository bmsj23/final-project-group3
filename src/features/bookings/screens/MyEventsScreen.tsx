import { FeaturePlaceholder } from '../../../components/ui/FeaturePlaceholder';

export function MyEventsScreen() {
  return (
    <FeaturePlaceholder
      description="This tab is reserved for booking history, created events, and later detail flows."
      eyebrow="Bookings"
      highlights={[
        'Upcoming, past, and cancelled bookings',
        'Created events list for organizers',
        'Booking detail and modify flows',
      ]}
      title="My Events"
    />
  );
}
