/** GET /api/admin/universities/:universityId/dashboard — tenant yönetim özeti. */
export interface AdminDashboard {
  clubsByStatus: Record<string, number>;
  usersByStatus: Record<string, number>;
  pendingApplications: number;
  upcomingActivityCount: number;
}
