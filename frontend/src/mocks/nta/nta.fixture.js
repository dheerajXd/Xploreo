/**
 * Canonical Fixtures for Non-Tech Admin (NTA) Domain
 * Consumed from central root Database/fixtures/admin/nta_metrics.json.
 */
import ntaFixtures from '@database/fixtures/admin/nta_metrics.json';

export const DEMO_NTA_DASHBOARD_METRICS = ntaFixtures.dashboardMetrics;
export const DEMO_NTA_REGIONAL_SUMMARY = ntaFixtures.regionalSummary;
export const DEMO_NTA_RECENT_ACTIVITY = ntaFixtures.recentActivity;
export const DEMO_NTA_RECENT_BOOKINGS = ntaFixtures.recentBookings;
export const DEMO_NTA_PRICING_DISTRIBUTION = ntaFixtures.pricingDistribution;
export const DEMO_GUIDE_APPLICATIONS = ntaFixtures.guideApplications;
