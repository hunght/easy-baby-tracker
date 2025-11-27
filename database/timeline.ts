import { deleteDiaperChange, getDiaperChanges, type DiaperChangeRecord } from '@/database/diaper';
import { deleteDiaryEntry, getDiaryEntries, type DiaryEntryRecord } from '@/database/diary';
import { deleteFeeding, getFeedings, type FeedingRecord } from '@/database/feeding';
import { deleteGrowthRecord, getGrowthRecords, type GrowthRecord } from '@/database/growth';
import { deleteHealthRecord, getHealthRecords, type HealthRecord } from '@/database/health';
import { deletePumping, getPumpings, type PumpingRecord } from '@/database/pumping';
import { deleteSleepSession, getSleepSessions, type SleepSessionRecord } from '@/database/sleep';

export type TimelineActivityType =
    | 'diaper'
    | 'feeding'
    | 'sleep'
    | 'growth'
    | 'health'
    | 'pumping'
    | 'diary';

export type TimelineActivity =
    | { type: 'diaper'; timestamp: number; data: DiaperChangeRecord; id: string }
    | { type: 'feeding'; timestamp: number; data: FeedingRecord; id: string }
    | { type: 'sleep'; timestamp: number; data: SleepSessionRecord; id: string }
    | { type: 'growth'; timestamp: number; data: GrowthRecord; id: string }
    | { type: 'health'; timestamp: number; data: HealthRecord; id: string }
    | { type: 'pumping'; timestamp: number; data: PumpingRecord; id: string }
    | { type: 'diary'; timestamp: number; data: DiaryEntryRecord; id: string };

type GetTimelineOptions = {
    babyId?: number;
    beforeTime?: number; // Unix timestamp in seconds
    limit?: number;
    filterTypes?: TimelineActivityType[];
};

export async function getTimelineActivities(
    options: GetTimelineOptions = {}
): Promise<TimelineActivity[]> {
    const { babyId, beforeTime, limit = 20, filterTypes } = options;

    // If filterTypes is provided, only fetch those. Otherwise fetch all.
    const typesToFetch = new Set(
        filterTypes ?? [
            'diaper',
            'feeding',
            'sleep',
            'growth',
            'health',
            'pumping',
            'diary',
        ]
    );

    // We fetch 'limit' items from EACH source to ensure we have enough candidates
    // for the final sorted list. This is a simple strategy that works well for
    // reasonable limits.
    const promises: Promise<TimelineActivity[]>[] = [];

    if (typesToFetch.has('diaper')) {
        promises.push(
            getDiaperChanges({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'diaper',
                    timestamp: item.time,
                    data: item,
                    id: `diaper_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('feeding')) {
        promises.push(
            getFeedings({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'feeding',
                    timestamp: item.startTime,
                    data: item,
                    id: `feeding_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('sleep')) {
        promises.push(
            getSleepSessions({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'sleep',
                    timestamp: item.startTime,
                    data: item,
                    id: `sleep_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('growth')) {
        promises.push(
            getGrowthRecords({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'growth',
                    timestamp: item.time,
                    data: item,
                    id: `growth_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('health')) {
        promises.push(
            getHealthRecords({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'health',
                    timestamp: item.time,
                    data: item,
                    id: `health_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('pumping')) {
        promises.push(
            getPumpings({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'pumping',
                    timestamp: item.startTime,
                    data: item,
                    id: `pumping_${item.id}`,
                }))
            )
        );
    }

    if (typesToFetch.has('diary')) {
        promises.push(
            getDiaryEntries({ babyId, endDate: beforeTime, limit }).then((res) =>
                res.map((item) => ({
                    type: 'diary',
                    timestamp: item.createdAt,
                    data: item,
                    id: `diary_${item.id}`,
                }))
            )
        );
    }

    const results = await Promise.all(promises);
    const allActivities = results.flat();

    // Sort by timestamp descending
    allActivities.sort((a, b) => b.timestamp - a.timestamp);

    // Take the top 'limit'
    return allActivities.slice(0, limit);
}

export async function deleteTimelineActivity(activity: TimelineActivity, babyId?: number): Promise<void> {
    switch (activity.type) {
        case 'diaper':
            await deleteDiaperChange(activity.data.id, babyId);
            break;
        case 'feeding':
            await deleteFeeding(activity.data.id, babyId);
            break;
        case 'sleep':
            await deleteSleepSession(activity.data.id, babyId);
            break;
        case 'growth':
            await deleteGrowthRecord(activity.data.id, babyId);
            break;
        case 'health':
            await deleteHealthRecord(activity.data.id, babyId);
            break;
        case 'pumping':
            await deletePumping(activity.data.id, babyId);
            break;
        case 'diary':
            await deleteDiaryEntry(activity.data.id, babyId);
            break;
        default:
            throw new Error(`Unknown activity type`);
    }
}
