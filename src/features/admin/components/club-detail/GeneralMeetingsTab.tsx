import { useQuery } from "@tanstack/react-query";
import { getAdminClubMembers } from "@/features/admin/api/moderation";
import ClubGeneralMeetingsSection from "@/features/clubs/components/ClubGeneralMeetingsSection";

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
  canCreate: boolean;
}

export default function GeneralMeetingsTab({
  universityId,
  clubId,
  enabled,
  canCreate,
}: Props) {
  const membersQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "members"],
    queryFn: () => getAdminClubMembers(universityId, clubId),
    enabled,
  });

  return (
    <ClubGeneralMeetingsSection
      universityId={universityId}
      clubId={clubId}
      enabled={enabled}
      canCreate={canCreate}
      approvedMembers={membersQuery.data ?? []}
      variant="tab"
    />
  );
}
